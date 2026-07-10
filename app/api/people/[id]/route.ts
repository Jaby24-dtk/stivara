import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'
import { encryptPII, isPIIEncryptionConfigured } from '@/lib/security/pii'

const ID_TYPES = ['nric', 'passport', 'fin', 'other']
const KYC_STATUSES = ['not_started', 'pending', 'verified', 'rejected']
const SANCTIONS_STATUSES = ['not_screened', 'clear', 'flagged', 'under_review']
const PEP_STATUSES = ['not_pep', 'pep', 'pep_associate', 'unknown']

// Updates a person's KYC/detail fields. idNumber and residentialAddress are
// encrypted here before storage (never stored or logged in plaintext) —
// old_value in the audit log therefore also only ever contains ciphertext.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const {
    name, email, idType, idNumber, nationality, residentialAddress, serviceAddress,
    phone, dateOfBirth, kycStatus, sanctionsScreeningStatus, pepStatus, verificationDate,
  } = body

  if (idType !== undefined && idType !== null && !ID_TYPES.includes(idType)) {
    return NextResponse.json({ error: `idType must be one of ${ID_TYPES.join(', ')}` }, { status: 400 })
  }
  if (kycStatus !== undefined && kycStatus !== null && !KYC_STATUSES.includes(kycStatus)) {
    return NextResponse.json({ error: `kycStatus must be one of ${KYC_STATUSES.join(', ')}` }, { status: 400 })
  }
  if (sanctionsScreeningStatus !== undefined && sanctionsScreeningStatus !== null && !SANCTIONS_STATUSES.includes(sanctionsScreeningStatus)) {
    return NextResponse.json({ error: `sanctionsScreeningStatus must be one of ${SANCTIONS_STATUSES.join(', ')}` }, { status: 400 })
  }
  if (pepStatus !== undefined && pepStatus !== null && !PEP_STATUSES.includes(pepStatus)) {
    return NextResponse.json({ error: `pepStatus must be one of ${PEP_STATUSES.join(', ')}` }, { status: 400 })
  }
  if ((idNumber || residentialAddress) && !isPIIEncryptionConfigured()) {
    return NextResponse.json({ error: 'PII_ENCRYPTION_KEY is not configured — cannot store ID number or residential address' }, { status: 503 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email || null
  if (idType !== undefined) updates.id_type = idType || null
  if (idNumber !== undefined) updates.id_number_encrypted = idNumber ? encryptPII(idNumber) : null
  if (nationality !== undefined) updates.nationality = nationality || null
  if (residentialAddress !== undefined) updates.residential_address_encrypted = residentialAddress ? encryptPII(residentialAddress) : null
  if (serviceAddress !== undefined) updates.service_address = serviceAddress || null
  if (phone !== undefined) updates.phone = phone || null
  if (dateOfBirth !== undefined) updates.date_of_birth = dateOfBirth || null
  if (kycStatus !== undefined) updates.kyc_status = kycStatus || null
  if (sanctionsScreeningStatus !== undefined) updates.sanctions_screening_status = sanctionsScreeningStatus || null
  if (pepStatus !== undefined) updates.pep_status = pepStatus || null
  if (verificationDate !== undefined) updates.verification_date = verificationDate || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = await createClient()

  // RLS scopes this to people in the caller's org.
  const { data: person, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 })

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'people',
    recordId: person.id,
    action: 'update',
    newValue: person,
    request,
  })

  return NextResponse.json({ person })
}
