import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

const VALID_ROLES = ['director', 'shareholder', 'officer', 'beneficial_owner']

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { companyId, name, email, role, startDate, shareCount, shareClass } = body
  if (!companyId || !name || !role || !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: 'companyId, name, and a valid role (director, shareholder, officer, beneficial_owner) are required' },
      { status: 400 }
    )
  }
  if (shareCount != null && shareCount < 0) {
    return NextResponse.json({ error: 'shareCount cannot be negative' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: person, error: personError } = await supabase
    .from('people')
    .insert({ organization_id: user.organization_id, name, email: email ?? null })
    .select()
    .single()
  if (personError) return NextResponse.json({ error: personError.message }, { status: 400 })

  const { data: roleAssignment, error: roleError } = await supabase
    .from('role_assignments')
    .insert({
      person_id: person.id,
      company_id: companyId,
      role,
      start_date: startDate || new Date().toISOString().slice(0, 10),
      share_count: shareCount ?? null,
      share_class: shareCount != null ? shareClass ?? null : null,
    })
    .select()
    .single()
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 400 })

  return NextResponse.json({ person, roleAssignment })
}
