import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'
import { CORPORATE_ROLE_LABELS } from '@/lib/reference/corporateRoles'

const VALID_ROLES = Object.keys(CORPORATE_ROLE_LABELS)

// Two ways to call this: create a new person and appoint them (name/email
// required), or appoint an existing legal entity (legalEntityId, no name/
// email/person created) — exactly one holder must be given, matching the
// role_assignments_holder_exclusive DB constraint.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { companyId, name, email, legalEntityId, role, startDate, shareCount, shareClass, isNominee, nominator } = body
  if (!companyId || !role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `companyId and a valid role (${VALID_ROLES.join(', ')}) are required` }, { status: 400 })
  }
  if (!name && !legalEntityId) {
    return NextResponse.json({ error: 'Either name (to create a person) or legalEntityId is required' }, { status: 400 })
  }
  if (name && legalEntityId) {
    return NextResponse.json({ error: 'Provide either name or legalEntityId, not both' }, { status: 400 })
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

  let person = null
  if (name) {
    const { data: newPerson, error: personError } = await supabase
      .from('people')
      .insert({ organization_id: user.organization_id, name, email: email ?? null })
      .select()
      .single()
    if (personError) return NextResponse.json({ error: personError.message }, { status: 400 })
    person = newPerson

    await logAudit({
      supabase,
      organizationId: user.organization_id,
      actorUserId: user.id,
      tableName: 'people',
      recordId: person.id,
      action: 'create',
      newValue: person,
      request,
    })
  } else {
    const { data: legalEntity } = await supabase
      .from('legal_entities')
      .select('id')
      .eq('id', legalEntityId)
      .eq('organization_id', user.organization_id)
      .single()
    if (!legalEntity) return NextResponse.json({ error: 'Legal entity not found' }, { status: 404 })
  }

  const { data: roleAssignment, error: roleError } = await supabase
    .from('role_assignments')
    .insert({
      person_id: person?.id ?? null,
      legal_entity_id: person ? null : legalEntityId,
      company_id: companyId,
      role,
      start_date: startDate || new Date().toISOString().slice(0, 10),
      share_count: shareCount ?? null,
      share_class: shareCount != null ? shareClass ?? null : null,
      is_nominee: isNominee ?? false,
      nominator: nominator ?? null,
    })
    .select()
    .single()
  if (roleError) {
    if (person) await supabase.from('people').delete().eq('id', person.id)
    return NextResponse.json({ error: roleError.message }, { status: 400 })
  }

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'role_assignments',
    recordId: roleAssignment.id,
    action: 'create',
    newValue: roleAssignment,
    request,
  })

  return NextResponse.json({ person, roleAssignment })
}
