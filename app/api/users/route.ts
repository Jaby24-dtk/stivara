import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'
import { assignableRoles, canAssignRole, canManageUsers } from '@/lib/users/permissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Admin-only: adds a login to the caller's own organization. Mirrors
// app/api/auth/signup/route.ts (auth user + public.users row via the
// service-role client, rolling back the auth user on failure), except the
// organization always comes from the caller's session, never the request.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ error: 'Only admins can add users' }, { status: 403 })
  }

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const role = String(body.role ?? '')

  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A name and valid email are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!canAssignRole(user.role, role)) {
    return NextResponse.json(
      { error: `You can only assign these roles: ${assignableRoles(user.role).join(', ')}` },
      { status: 403 }
    )
  }

  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
  }

  const { data: newUser, error: userError } = await admin
    .from('users')
    .insert({
      id: authData.user.id,
      organization_id: user.organization_id,
      name,
      email,
      role,
    })
    .select('id, organization_id, name, email, role, created_at')
    .single()
  if (userError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  const supabase = await createClient()
  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'users',
    recordId: newUser.id,
    action: 'create',
    newValue: newUser,
    request,
  })

  return NextResponse.json({ user: newUser })
}
