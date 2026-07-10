// Deterministic, no Gemini call — see lib/ai/gemini.ts, the free-tier quota
// is 20 requests/day shared across the whole app, and a briefing that runs
// on every dashboard load would starve the actual AI Assistant of quota.
// Same call the rule-based checklists in checklists.ts already made: this
// content doesn't need AI, it needs to be right every time.

import type { RiskLevel } from './health'

export type BriefingItem = { companyName: string; severity: 'red' | 'amber'; message: string }

export function buildDailyBriefing(params: {
  items: BriefingItem[]
  trustScore: number
  riskLevel: RiskLevel
}): string {
  const { items, trustScore, riskLevel } = params
  const overdue = items.filter((i) => i.severity === 'red')
  const dueSoon = items.filter((i) => i.severity === 'amber')

  const sentences: string[] = []

  sentences.push(
    overdue.length === 0
      ? 'No overdue filings across your portfolio.'
      : `${overdue.length} overdue item${overdue.length === 1 ? '' : 's'} need${overdue.length === 1 ? 's' : ''} attention: ${overdue
          .map((i) => `${i.message} (${i.companyName})`)
          .join('; ')}.`
  )

  if (dueSoon.length > 0) {
    sentences.push(
      `${dueSoon.length} item${dueSoon.length === 1 ? '' : 's'} due soon: ${dueSoon
        .map((i) => `${i.message} (${i.companyName})`)
        .join('; ')}.`
    )
  }

  sentences.push(`Corporate Trust Score is ${trustScore} — ${riskLevel.toLowerCase()} risk.`)

  return sentences.join(' ')
}
