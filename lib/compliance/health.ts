// Deterministic compliance health scoring — not AI-guessed, since a
// company's red/amber/green status needs to be auditable and reproducible,
// not probabilistic. This replaces the `companies.status` column, which
// was set to 'green' at creation and never actually updated by anything.

export type HealthStatus = 'green' | 'amber' | 'red'

export type HealthReason = {
  severity: 'red' | 'amber'
  message: string
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type MissionControlScore = {
  trustScore: number
  governanceScore: number
  riskLevel: RiskLevel
  reasons: HealthReason[]
}

const AMBER_WINDOW_DAYS = 30

export function daysUntil(dateStr: string, today: Date): number {
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

type HealthInputs = {
  events: { type: string; due_date: string; status: string }[]
  tasks: { title: string; due_date: string | null; status: string }[]
  directorCount: number
  today?: Date
}

// Shared across computeCompanyHealth and computeMissionControl so both stay
// consistent about what counts as a red/amber reason — split by source
// (compliance events vs tasks vs director register) because governance
// scoring only cares about the first and third.
function buildReasons(params: HealthInputs) {
  const today = params.today ?? new Date()
  today.setHours(0, 0, 0, 0)

  const eventReasons: HealthReason[] = []
  for (const e of params.events) {
    if (e.status === 'completed') continue
    const diff = daysUntil(e.due_date, today)
    if (diff < 0) eventReasons.push({ severity: 'red', message: `${e.type} is overdue by ${-diff} day${-diff === 1 ? '' : 's'}` })
    else if (diff <= AMBER_WINDOW_DAYS) eventReasons.push({ severity: 'amber', message: `${e.type} is due in ${diff} day${diff === 1 ? '' : 's'}` })
  }

  const taskReasons: HealthReason[] = []
  for (const t of params.tasks) {
    if (t.status === 'done' || !t.due_date) continue
    const diff = daysUntil(t.due_date, today)
    if (diff < 0) taskReasons.push({ severity: 'red', message: `Task "${t.title}" is overdue by ${-diff} day${-diff === 1 ? '' : 's'}` })
  }

  const directorReasons: HealthReason[] = params.directorCount === 0
    ? [{ severity: 'amber', message: 'No directors on record' }]
    : []

  return { eventReasons, taskReasons, directorReasons }
}

function bySeverity(a: HealthReason, b: HealthReason): number {
  return a.severity === b.severity ? 0 : a.severity === 'red' ? -1 : 1
}

export function computeCompanyHealth(params: HealthInputs): { status: HealthStatus; reasons: HealthReason[] } {
  const { eventReasons, taskReasons, directorReasons } = buildReasons(params)
  const reasons = [...eventReasons, ...taskReasons, ...directorReasons].sort(bySeverity)

  const status: HealthStatus = reasons.some((r) => r.severity === 'red')
    ? 'red'
    : reasons.some((r) => r.severity === 'amber')
      ? 'amber'
      : 'green'

  return { status, reasons }
}

// Governance score covers only statutory/board signals (compliance events +
// director register) — it deliberately excludes tasks, which are day-to-day
// operational items, not governance filings. Trust score is the overall
// number and folds task hygiene back in. Both are 0-100, deterministic, and
// built only from data this repo actually tracks (SG compliance events +
// role assignments) — no tax/HR figures, since there's no data source for
// those yet.
export function computeMissionControl(params: HealthInputs): MissionControlScore {
  const { eventReasons, taskReasons, directorReasons } = buildReasons(params)

  const redEventCount = eventReasons.filter((r) => r.severity === 'red').length
  const amberEventCount = eventReasons.filter((r) => r.severity === 'amber').length
  const overdueTaskCount = taskReasons.length

  let governanceScore = 100
  if (params.directorCount === 0) governanceScore -= 40
  governanceScore -= redEventCount * 15
  governanceScore -= amberEventCount * 6
  governanceScore = Math.max(0, governanceScore)

  const trustScore = Math.max(0, governanceScore - overdueTaskCount * 10)

  const reasons = [...eventReasons, ...taskReasons, ...directorReasons].sort(bySeverity)
  const riskLevel: RiskLevel = reasons.some((r) => r.severity === 'red')
    ? 'HIGH'
    : reasons.some((r) => r.severity === 'amber')
      ? 'MEDIUM'
      : 'LOW'

  return { trustScore, governanceScore, riskLevel, reasons }
}
