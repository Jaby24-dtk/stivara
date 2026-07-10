// Feeds the AI Assistant real, structured facts about a company — not just
// indexed documents — so questions like "who are our directors" or "is this
// person a director elsewhere" get answered from Stivara's own records
// instead of "no indexed documents found". Every line here traces to a real
// row; nothing here is inferred or guessed (ownership %, ID expiry, etc.
// aren't tracked yet, so they're simply not mentioned).

import { createClient } from '@/lib/supabase/server'
import { deriveEventStatus } from '@/lib/compliance/health'

const roleLabel: Record<string, string> = {
  director: 'director',
  shareholder: 'shareholder',
  officer: 'officer',
  beneficial_owner: 'beneficial owner',
}

export async function buildCompanyContext(companyId: string): Promise<string> {
  const supabase = await createClient()

  const [{ data: company }, { data: roles }, { data: events }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('role_assignments').select('person_id, role, start_date, people(name)').eq('company_id', companyId).is('end_date', null),
    supabase.from('compliance_events').select('type, due_date, status').eq('company_id', companyId).order('due_date'),
  ])

  const lines: string[] = []

  if (company) {
    lines.push(
      `Company: ${company.name}, jurisdiction ${company.jurisdiction}, FYE ${company.fye}` +
        (company.incorporation_date ? `, incorporated ${company.incorporation_date}` : '') +
        '.'
    )
  }

  type RoleRow = { person_id: string; role: string; start_date: string; people: { name: string } | null }
  const roleList = (roles ?? []) as unknown as RoleRow[]

  if (roleList.length === 0) {
    lines.push('No directors, shareholders, or officers are on record for this company.')
  } else {
    for (const r of roleList) {
      lines.push(`${r.people?.name ?? 'Unknown person'} is a ${roleLabel[r.role] ?? r.role} of this company, appointed ${r.start_date}.`)
    }

    // Cross-company overlap: is this person also active at another company in
    // the same org? RLS already scopes both queries to the caller's org.
    const personIds = [...new Set(roleList.map((r) => r.person_id))]
    const { data: otherRoles } = await supabase
      .from('role_assignments')
      .select('person_id, role, people(name), companies(name)')
      .in('person_id', personIds)
      .neq('company_id', companyId)
      .is('end_date', null)

    type OtherRoleRow = { person_id: string; role: string; people: { name: string } | null; companies: { name: string } | null }
    for (const r of (otherRoles ?? []) as unknown as OtherRoleRow[]) {
      if (!r.people?.name || !r.companies?.name) continue
      lines.push(`${r.people.name} is also a ${roleLabel[r.role] ?? r.role} of ${r.companies.name}.`)
    }
  }

  type EventRow = { type: string; due_date: string; status: string }
  for (const e of (events ?? []) as EventRow[]) {
    // deriveEventStatus, not e.status directly — the column is written once
    // at insert and never updated, so it goes stale (see health.ts). Feeding
    // the raw column to the AI as "ground truth" would let it tell a user a
    // filing is fine when it's actually overdue.
    lines.push(`${e.type} is due ${e.due_date} (status: ${deriveEventStatus(e)}).`)
  }

  return lines.join('\n')
}
