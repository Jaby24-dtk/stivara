import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { generateComplianceEvents } from '@/lib/compliance/singapore'

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

  const events = generateComplianceEvents(jurisdiction, fye)
  if (events.length > 0) {
    const { error: eventsError } = await supabase
      .from('compliance_events')
      .insert(events.map((e) => ({ company_id: company.id, type: e.type, due_date: e.due_date })))
    if (eventsError) {
      return NextResponse.json({ company, warning: `Compliance events not created: ${eventsError.message}` })
    }
  }

  return NextResponse.json({ company })
}
