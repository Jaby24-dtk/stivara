// Company history, built only from dates this repo already stores —
// incorporation_date, role_assignments (appointments/resignations), and
// document uploads. No new schema, no fabricated milestones.

const roleLabel: Record<string, string> = {
  director: 'Director',
  shareholder: 'Shareholder',
  officer: 'Officer',
  beneficial_owner: 'Beneficial owner',
}

export type TimelineEvent = { date: string; label: string }

export function buildTimeline(params: {
  companyName: string
  incorporationDate: string | null
  roleAssignments: { personName: string; role: string; startDate: string; endDate: string | null }[]
  documents: { name: string; createdAt: string }[]
}): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (params.incorporationDate) {
    events.push({ date: params.incorporationDate, label: `${params.companyName} incorporated` })
  }

  for (const r of params.roleAssignments) {
    const role = roleLabel[r.role] ?? r.role
    events.push({ date: r.startDate, label: `${r.personName} appointed as ${role}` })
    if (r.endDate) {
      events.push({ date: r.endDate, label: `${r.personName} ceased to be ${role}` })
    }
  }

  for (const d of params.documents) {
    events.push({ date: d.createdAt.slice(0, 10), label: `Document uploaded: ${d.name}` })
  }

  events.sort((a, b) => a.date.localeCompare(b.date))
  return events
}
