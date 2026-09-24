import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'
import { assignableRoles, canAssignRole, canManageUser } from '@/lib/users/permissions'
import type { UserRow } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

// Loads the target within the caller's own org and checks the caller may
// manage them. Returns an error response or the target row.
async function loadManageableUser(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const supabase = await createClient()
  const { data: target } = await supabase
    .from('users')
    .select('id, organization_id, name, email, role, created_at')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .single()
  if (!target) return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }

  if (!canManageUser(user, target as UserRow)) {
    return { error: NextResponse.json({ error: 'You are not allowed to manage this user' }, { status: 403 }) }
  }
  return { user, target: target as UserRow, supabase }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const loaded = await loadManageableUser(id)
  if ('error' in loaded) return loaded.error
  const { user, target, supabase } = loaded

  const body = await request.json()
  const updates: Partial<Pick<UserRow, 'name' | 'role'>> = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    updates.name = name
  }
  if (body.role !== undefined) {
    const role = String(body.role)
    if (!canAssignRole(user.role, role)) {
      return NextResponse.json(
        { error: `You can only assign these roles: ${assignableRoles(user.role).join(', ')}` },
        { status: 403 }
      )
    }
    updates.role = role
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Service-role client: RLS only lets users update their own row.
  const admin = createAdminClient()
  const { data: updated, error } = await admin
    .from('users')
    .update(updates)
    .eq('id', target.id)
    .select('id, organization_id, name, email, role, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'users',
    recordId: target.id,
    action: 'update',
    oldValue: target,
    newValue: updated,
    request,
  })

  return NextResponse.json({ user: updated })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const loaded = await loadManageableUser(id)
  if ('error' in loaded) return loaded.error
  const { user, target, supabase } = loaded

  const admin = createAdminClient()

  // documents.uploaded_by has no ON DELETE rule, so it would block the
  // cascade from auth.users → public.users. Keep the documents, drop the link.
  const { error: docsError } = await admin.from('documents').update({ uploaded_by: null }).eq('uploaded_by', target.id)
  if (docsError) return NextResponse.json({ error: docsError.message }, { status: 400 })

  // Deleting the auth user cascades to public.users and signs them out.
  const { error } = await admin.auth.admin.deleteUser(target.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'users',
    recordId: target.id,
    action: 'delete',
    oldValue: target,
    request,
  })

  return NextResponse.json({ ok: true })
}
