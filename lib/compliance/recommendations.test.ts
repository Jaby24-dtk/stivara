import { describe, expect, it } from 'vitest'
import { buildRecommendations } from './recommendations'

const TODAY = new Date(2026, 6, 10)

describe('buildRecommendations', () => {
  it('is empty for a clean company', () => {
    expect(buildRecommendations({ events: [], tasks: [], directorCount: 1, today: TODAY })).toEqual([])
  })

  it('recommends appointing a director when there are none', () => {
    const recs = buildRecommendations({ events: [], tasks: [], directorCount: 0, today: TODAY })
    expect(recs).toEqual(['Appoint at least one director'])
  })

  it('recommends filing an overdue event immediately', () => {
    const recs = buildRecommendations({
      events: [{ type: 'AGM', due_date: '2026-07-01', status: 'upcoming' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(recs).toEqual(['File the overdue AGM immediately'])
  })

  it('recommends preparing for an upcoming event within the amber window', () => {
    const recs = buildRecommendations({
      events: [{ type: 'Annual Return (BizFile+)', due_date: '2026-07-20', status: 'upcoming' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(recs).toEqual(['Prepare for the upcoming Annual Return (BizFile+) (due 2026-07-20)'])
  })

  it('ignores events further than 30 days out and completed events', () => {
    const recs = buildRecommendations({
      events: [
        { type: 'AGM', due_date: '2026-12-01', status: 'upcoming' },
        { type: 'Annual Return (BizFile+)', due_date: '2026-07-01', status: 'completed' },
      ],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(recs).toEqual([])
  })

  it('recommends completing an overdue task, ignoring done or undated ones', () => {
    const recs = buildRecommendations({
      events: [],
      tasks: [
        { title: 'File AGM notice', due_date: '2026-07-01', status: 'todo' },
        { title: 'Already done', due_date: '2026-07-01', status: 'done' },
        { title: 'No due date', due_date: null, status: 'todo' },
      ],
      directorCount: 1,
      today: TODAY,
    })
    expect(recs).toEqual(['Complete overdue task: "File AGM notice"'])
  })

  it('combines recommendations across directors, events, and tasks', () => {
    const recs = buildRecommendations({
      events: [{ type: 'AGM', due_date: '2026-07-01', status: 'upcoming' }],
      tasks: [{ title: 'File AGM notice', due_date: '2026-07-01', status: 'todo' }],
      directorCount: 0,
      today: TODAY,
    })
    expect(recs).toEqual([
      'Appoint at least one director',
      'File the overdue AGM immediately',
      'Complete overdue task: "File AGM notice"',
    ])
  })
})
