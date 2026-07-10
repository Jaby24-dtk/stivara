import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { provisionComplianceEvents } from '@/lib/compliance/provisioning'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, jurisdiction, entityType, incorporationDate, fye } = body
  if (!name || !jurisdiction || !fye) {
    return NextResponse.json({ error: 'name, jurisdiction, and fye are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      organization_id: user.organization_id,
      name,
      jurisdiction,
      entity_type: entityType ?? null,
      incorporation_date: incorporationDate ?? null,
      fye,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { warning } = await provisionComplianceEvents(supabase, company.id, jurisdiction, fye)
  if (warning) return NextResponse.json({ company, warning })

  return NextResponse.json({ company })
}
