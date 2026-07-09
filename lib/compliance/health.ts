// Deterministic compliance health scoring — not AI-guessed, since a
// company's red/amber/green status needs to be auditable and reproducible,
// not probabilistic. This replaces the `companies.status` column, which
// was set to 'green' at creation and never actually updated by anything.

export type HealthStatus = 'green' | 'amber' | 'red'

export type HealthReason = {
  severity: 'red' | 'amber'
  message: string
}

const AMBER_WINDOW_DAYS = 30

function daysUntil(dateStr: string, today: Date): number {
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

export function computeCompanyHealth(params: {
  events: { type: string; due_date: string; status: string }[]
  tasks: { title: string; due_date: string | null; status: string }[]
  directorCount: number
  today?: Date
}): { status: HealthStatus; reasons: HealthReason[] } {
  const today = params.today ?? new Date()
  today.setHours(0, 0, 0, 0)
  const reasons: HealthReason[] = []

  for (const e of params.events) {
    if (e.status === 'completed') continue
    const diff = daysUntil(e.due_date, today)
    if (diff < 0) reasons.push({ severity: 'red', message: `${e.type} is overdue by ${-diff} day${-diff === 1 ? '' : 's'}` })
    else if (diff <= AMBER_WINDOW_DAYS) reasons.push({ severity: 'amber', message: `${e.type} is due in ${diff} day${diff === 1 ? '' : 's'}` })
  }

  for (const t of params.tasks) {
    if (t.status === 'done' || !t.due_date) continue
    const diff = daysUntil(t.due_date, today)
    if (diff < 0) reasons.push({ severity: 'red', message: `Task "${t.title}" is overdue by ${-diff} day${-diff === 1 ? '' : 's'}` })
  }

  if (params.directorCount === 0) {
    reasons.push({ severity: 'amber', message: 'No directors on record' })
  }

  const status: HealthStatus = reasons.some((r) => r.severity === 'red')
    ? 'red'
    : reasons.some((r) => r.severity === 'amber')
      ? 'amber'
      : 'green'

  // Most urgent first: red reasons before amber.
  reasons.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'red' ? -1 : 1))

  return { status, reasons }
}
