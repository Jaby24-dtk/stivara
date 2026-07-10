import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit/log'
import { decryptPII } from '@/lib/security/pii'

// Single chokepoint for decrypting id_number/residential_address — every
// call is logged as a view_sensitive audit event. Not yet role-gated (that
// lands in Milestone 5 once real per-user roles exist to gate against);
// today it's still behind normal auth + org-scoped RLS.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  const { data: person } = await supabase
    .from('people')
    .select('id, id_number_encrypted, residential_address_encrypted')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .single()
  if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 })

  let idNumber: string | null = null
  let residentialAddress: string | null = null
  try {
    idNumber = person.id_number_encrypted ? decryptPII(person.id_number_encrypted) : null
    residentialAddress = person.residential_address_encrypted ? decryptPII(person.residential_address_encrypted) : null
  } catch (err) {
    console.error('PII decryption failed:', err)
    return NextResponse.json({ error: 'Could not decrypt sensitive fields' }, { status: 500 })
  }

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'people',
    recordId: person.id,
    action: 'view_sensitive',
    request,
  })

  return NextResponse.json({ idNumber, residentialAddress })
}
