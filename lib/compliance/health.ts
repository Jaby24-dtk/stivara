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

// Pure UTC arithmetic, deliberately — a date-only string like '2026-07-11'
// parses as UTC midnight, but truncating it to *local* midnight (as this
// used to do via due.setHours(0,0,0,0)) silently shifts the date back a day
// in any timezone behind UTC. Same class of bug addMonths() in
// lib/compliance/singapore.ts already guards against, just missed here.
// today's local Y/M/D is read (not its UTC one) since that's the calendar
// date the caller means by "today", then re-anchored at UTC midnight so
// both sides of the diff are computed the same way.
export function daysUntil(dateStr: string, today: Date): number {
  const due = new Date(dateStr)
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((due.getTime() - todayUTC) / 86_400_000)
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

export type EventStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed'

// compliance_events.status is written once at insert time (see
// app/api/companies/route.ts) and nothing ever updates it afterward — the
// same staleness bug this file already fixed once for companies.status.
// Derive the real status at read time instead of trusting the column.
export function deriveEventStatus(event: { due_date: string; status: string }, today?: Date): EventStatus {
  if (event.status === 'completed') return 'completed'
  const diff = daysUntil(event.due_date, today ?? new Date())
  if (diff < 0) return 'overdue'
  if (diff <= AMBER_WINDOW_DAYS) return 'due_soon'
  return 'upcoming'
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
