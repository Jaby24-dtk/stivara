import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Creates the auth user, then the organization + public.users row that RLS
// keys off of. Runs server-side with the service-role key because the new
// user has no organization_id yet, so RLS would otherwise block the insert.
export async function POST(request: Request) {
  const { name, email, password, organizationName, organizationType } = await request.json()

  if (!name || !email || !password || !organizationName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: organizationName, type: organizationType === 'firm' ? 'firm' : 'self_serve' })
    .select()
    .single()
  if (orgError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: orgError.message }, { status: 400 })
  }

  const { error: userError } = await admin.from('users').insert({
    id: authData.user.id,
    organization_id: org.id,
    name,
    email,
    role: 'super_admin',
  })
  if (userError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
