import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'
import { CORPORATE_ROLE_LABELS } from '@/lib/reference/corporateRoles'

const VALID_ROLES = Object.keys(CORPORATE_ROLE_LABELS)
const VALID_CATEGORIES = ['company', 'bank', 'auditor', 'service_provider', 'government_body', 'other']

// Creates a legal entity (corporate shareholder, holding company, auditor,
// bank, service provider) and appoints it to a company's role_assignments in
// one call — mirrors app/api/people/route.ts's create-and-appoint pattern.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    companyId, name, entityCategory, jurisdiction, registrationNumber, registeredAddress, notes,
    role, startDate, shareCount, shareClass, isNominee, nominator,
  } = body

  if (!companyId || !name || !entityCategory || !VALID_CATEGORIES.includes(entityCategory)) {
    return NextResponse.json(
      { error: `companyId, name, and a valid entityCategory (${VALID_CATEGORIES.join(', ')}) are required` },
      { status: 400 }
    )
  }
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `A valid role (${VALID_ROLES.join(', ')}) is required` }, { status: 400 })
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

  const { data: legalEntity, error: entityError } = await supabase
    .from('legal_entities')
    .insert({
      organization_id: user.organization_id,
      name,
      entity_category: entityCategory,
      jurisdiction: jurisdiction || null,
      registration_number: registrationNumber || null,
      registered_address: registeredAddress || null,
      notes: notes || null,
    })
    .select()
    .single()
  if (entityError) return NextResponse.json({ error: entityError.message }, { status: 400 })

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'legal_entities',
    recordId: legalEntity.id,
    action: 'create',
    newValue: legalEntity,
    request,
  })

  const { data: roleAssignment, error: roleError } = await supabase
    .from('role_assignments')
    .insert({
      legal_entity_id: legalEntity.id,
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
    await supabase.from('legal_entities').delete().eq('id', legalEntity.id)
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

  return NextResponse.json({ legalEntity, roleAssignment })
}
