import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'

// Two uses of the same endpoint: ending a role assignment (e.g. a director
// resigning) by setting end_date — the person and history stay on record,
// they just stop showing as current — or, when shareCount/shareClass are
// given instead, updating a shareholder's holding without touching end_date.
// RemoveRoleButton always posts {}, so the "end the role" branch stays the
// default when neither share field is present.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { endDate, shareCount, shareClass } = await request.json()

  const hasShareFields = shareCount !== undefined || shareClass !== undefined
  if (hasShareFields && endDate !== undefined) {
    return NextResponse.json({ error: 'Cannot end a role and update its shareholding in the same request' }, { status: 400 })
  }

  const updates: Record<string, string | number | null> = {}
  if (hasShareFields) {
    if (shareCount !== undefined) updates.share_count = shareCount
    if (shareClass !== undefined) updates.share_class = shareClass
  } else {
    updates.end_date = endDate || new Date().toISOString().slice(0, 10)
  }

  const supabase = await createClient()
  const { data: before } = await supabase.from('role_assignments').select('*').eq('id', id).single()

  // RLS scopes this update to role assignments whose company belongs to the caller's org.
  const { data: roleAssignment, error } = await supabase
    .from('role_assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!roleAssignment) return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 })

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'role_assignments',
    recordId: roleAssignment.id,
    action: 'update',
    oldValue: before,
    newValue: roleAssignment,
    request,
  })

  return NextResponse.json({ roleAssignment })
}
