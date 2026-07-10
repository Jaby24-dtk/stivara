// Powers the Corporate Doctor health check. Deterministic, same reasoning as
// lib/compliance/health.ts — recommendations are only generated from data
// this repo actually tracks (director register, SG compliance events,
// tasks). No tax/HR/licence recommendations, since there's no data source
// for those yet.

import { daysUntil } from './health'

const AMBER_WINDOW_DAYS = 30

export function buildRecommendations(params: {
  events: { type: string; due_date: string; status: string }[]
  tasks: { title: string; due_date: string | null; status: string }[]
  directorCount: number
  today?: Date
}): string[] {
  const today = params.today ?? new Date()
  const recs: string[] = []

  if (params.directorCount === 0) {
    recs.push('Appoint at least one director')
  }

  for (const e of params.events) {
    if (e.status === 'completed') continue
    const diff = daysUntil(e.due_date, today)
    if (diff < 0) recs.push(`File the overdue ${e.type} immediately`)
    else if (diff <= AMBER_WINDOW_DAYS) recs.push(`Prepare for the upcoming ${e.type} (due ${e.due_date})`)
  }

  for (const t of params.tasks) {
    if (t.status === 'done' || !t.due_date) continue
    if (daysUntil(t.due_date, today) < 0) recs.push(`Complete overdue task: "${t.title}"`)
  }

  return recs
}
