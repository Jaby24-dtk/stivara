import type { SupabaseClient } from '@supabase/supabase-js'
import { generateComplianceEvents } from './singapore'

// Shared by company creation and by editing a company's FYE/jurisdiction —
// every compliance deadline should show up as something to actually do, not
// just a date on a calendar, so this always creates both the event and its
// matching task together.
export async function provisionComplianceEvents(
  supabase: SupabaseClient,
  companyId: string,
  jurisdiction: string,
  fye: string
): Promise<{ warning?: string }> {
  const events = generateComplianceEvents(jurisdiction, fye)
  if (events.length === 0) return {}

  const { data: insertedEvents, error: eventsError } = await supabase
    .from('compliance_events')
    .insert(events.map((e) => ({ company_id: companyId, type: e.type, due_date: e.due_date })))
    .select()
  if (eventsError) return { warning: `Compliance events not created: ${eventsError.message}` }

  const { error: tasksError } = await supabase.from('tasks').insert(
    (insertedEvents ?? []).map((e) => ({
      company_id: companyId,
      title: `Complete: ${e.type}`,
      due_date: e.due_date,
      source_compliance_event_id: e.id,
    }))
  )
  if (tasksError) return { warning: `Tasks not created: ${tasksError.message}` }

  return {}
}
