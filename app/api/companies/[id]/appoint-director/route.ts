import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { generateDirectorAppointmentPack } from '@/lib/documents/directorAppointment'

const ACRA_NOTIFICATION_WINDOW_DAYS = 14

// Director Appointment Wizard, end to end, in one request: adds the person
// + role assignment, drafts the consent + resolution pack in a single AI
// call, and creates the ACRA filing-deadline task — the 3-4 steps this used
// to take manually, done atomically instead of the client orchestrating
// several round trips (build brief Section 5: "multi-step workflow, not
// single-shot generation").
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: companyId } = await params
  const { name, email, effectiveDate } = await request.json()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, jurisdiction')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const effective = effectiveDate || new Date().toISOString().slice(0, 10)

  const { data: existingDirectorRows } = await supabase
    .from('role_assignments')
    .select('people(name)')
    .eq('company_id', companyId)
    .eq('role', 'director')
    .is('end_date', null)
  const existingDirectors = (existingDirectorRows ?? [])
    .map((r) => (r.people as unknown as { name: string } | null)?.name)
    .filter((n): n is string => !!n)

  const { data: person, error: personError } = await supabase
    .from('people')
    .insert({ organization_id: user.organization_id, name, email: email ?? null })
    .select()
    .single()
  if (personError) return NextResponse.json({ error: personError.message }, { status: 400 })

  const { data: roleAssignment, error: roleError } = await supabase
    .from('role_assignments')
    .insert({ person_id: person.id, company_id: companyId, role: 'director', start_date: effective })
    .select()
    .single()
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 400 })

  const document = await generateDirectorAppointmentPack({
    companyName: company.name,
    jurisdiction: company.jurisdiction,
    appointeeName: name,
    effectiveDate: effective,
    existingDirectors,
  })

  const filingDeadline = new Date(effective)
  filingDeadline.setDate(filingDeadline.getDate() + ACRA_NOTIFICATION_WINDOW_DAYS)

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      company_id: companyId,
      title: `File director appointment (${name}) with ACRA via BizFile+`,
      due_date: filingDeadline.toISOString().slice(0, 10),
    })
    .select()
    .single()
  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 400 })

  return NextResponse.json({ person, roleAssignment, document, task })
}
