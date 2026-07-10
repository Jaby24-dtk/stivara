import { describe, expect, it } from 'vitest'
import { computeCompanyHealth, computeMissionControl, daysUntil, deriveEventStatus } from './health'

// Constructed as a local date (not a UTC ISO string) so its local Y/M/D is
// unambiguously 2026-07-10 regardless of which timezone the tests run in —
// daysUntil reads today's local calendar date, not its raw timestamp.
const TODAY = new Date(2026, 6, 10)

describe('daysUntil', () => {
  it('is positive for a future date', () => {
    expect(daysUntil('2026-07-15', TODAY)).toBe(5)
  })

  it('is exactly 1 for tomorrow, regardless of the runtime timezone', () => {
    // Regression case: daysUntil used to parse the due date as UTC midnight
    // then truncate to *local* midnight, which silently rounded this down
    // to 0 in any timezone behind UTC (e.g. the Americas).
    expect(daysUntil('2026-07-11', TODAY)).toBe(1)
  })

  it('is negative for a past date', () => {
    expect(daysUntil('2026-07-01', TODAY)).toBe(-9)
  })

  it('is zero for today', () => {
    expect(daysUntil('2026-07-10', TODAY)).toBe(0)
  })
})

describe('computeCompanyHealth', () => {
  it('is green with no events, tasks, or director gaps', () => {
    const result = computeCompanyHealth({ events: [], tasks: [], directorCount: 1, today: TODAY })
    expect(result.status).toBe('green')
    expect(result.reasons).toEqual([])
  })

  it('is amber when a compliance event is due soon', () => {
    const result = computeCompanyHealth({
      events: [{ type: 'AGM', due_date: '2026-07-20', status: 'upcoming' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.status).toBe('amber')
    expect(result.reasons).toEqual([{ severity: 'amber', message: 'AGM is due in 10 days' }])
  })

  it('is red when a compliance event is overdue', () => {
    const result = computeCompanyHealth({
      events: [{ type: 'Annual Return (BizFile+)', due_date: '2026-07-01', status: 'upcoming' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.status).toBe('red')
    expect(result.reasons).toEqual([{ severity: 'red', message: 'Annual Return (BizFile+) is overdue by 9 days' }])
  })

  it('ignores completed events', () => {
    const result = computeCompanyHealth({
      events: [{ type: 'AGM', due_date: '2026-07-01', status: 'completed' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.status).toBe('green')
  })

  it('flags a missing director as amber', () => {
    const result = computeCompanyHealth({ events: [], tasks: [], directorCount: 0, today: TODAY })
    expect(result.status).toBe('amber')
    expect(result.reasons).toEqual([{ severity: 'amber', message: 'No directors on record' }])
  })

  it('flags an overdue task as red and ignores done/undated tasks', () => {
    const result = computeCompanyHealth({
      events: [],
      tasks: [
        { title: 'File AGM notice', due_date: '2026-07-01', status: 'todo' },
        { title: 'Done already', due_date: '2026-07-01', status: 'done' },
        { title: 'No due date', due_date: null, status: 'todo' },
      ],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.status).toBe('red')
    expect(result.reasons).toEqual([{ severity: 'red', message: 'Task "File AGM notice" is overdue by 9 days' }])
  })

  it('sorts red reasons before amber', () => {
    const result = computeCompanyHealth({
      events: [{ type: 'AGM', due_date: '2026-07-01', status: 'upcoming' }],
      tasks: [],
      directorCount: 0,
      today: TODAY,
    })
    expect(result.reasons.map((r) => r.severity)).toEqual(['red', 'amber'])
  })
})

describe('deriveEventStatus', () => {
  it('is completed when the stored status says so, regardless of due date', () => {
    expect(deriveEventStatus({ due_date: '2020-01-01', status: 'completed' }, TODAY)).toBe('completed')
  })

  it('is overdue when the due date has passed', () => {
    expect(deriveEventStatus({ due_date: '2026-07-01', status: 'upcoming' }, TODAY)).toBe('overdue')
  })

  it('is due_soon within the 30-day amber window', () => {
    expect(deriveEventStatus({ due_date: '2026-07-20', status: 'upcoming' }, TODAY)).toBe('due_soon')
  })

  it('is upcoming beyond the 30-day window, ignoring a stale stored status', () => {
    expect(deriveEventStatus({ due_date: '2026-12-01', status: 'due_soon' }, TODAY)).toBe('upcoming')
  })
})

describe('computeMissionControl', () => {
  it('scores a clean company at 100 with LOW risk', () => {
    const result = computeMissionControl({ events: [], tasks: [], directorCount: 1, today: TODAY })
    expect(result).toMatchObject({ trustScore: 100, governanceScore: 100, riskLevel: 'LOW' })
  })

  it('penalizes governanceScore by 40 for no directors, leaves trustScore in sync when no other issues', () => {
    const result = computeMissionControl({ events: [], tasks: [], directorCount: 0, today: TODAY })
    expect(result.governanceScore).toBe(60)
    expect(result.trustScore).toBe(60)
    expect(result.riskLevel).toBe('MEDIUM')
  })

  it('penalizes governanceScore by 15 per overdue event and flags HIGH risk', () => {
    const result = computeMissionControl({
      events: [{ type: 'AGM', due_date: '2026-07-01', status: 'upcoming' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.governanceScore).toBe(85)
    expect(result.trustScore).toBe(85)
    expect(result.riskLevel).toBe('HIGH')
  })

  it('penalizes governanceScore by 6 per due-soon event', () => {
    const result = computeMissionControl({
      events: [{ type: 'AGM', due_date: '2026-07-20', status: 'upcoming' }],
      tasks: [],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.governanceScore).toBe(94)
    expect(result.riskLevel).toBe('MEDIUM')
  })

  it('subtracts overdue task penalties from trustScore but not governanceScore', () => {
    const result = computeMissionControl({
      events: [],
      tasks: [{ title: 'Overdue task', due_date: '2026-07-01', status: 'todo' }],
      directorCount: 1,
      today: TODAY,
    })
    expect(result.governanceScore).toBe(100)
    expect(result.trustScore).toBe(90)
  })

  it('floors both scores at 0 instead of going negative', () => {
    const result = computeMissionControl({
      events: [
        { type: 'AGM', due_date: '2026-06-01', status: 'upcoming' },
        { type: 'Annual Return (BizFile+)', due_date: '2026-06-01', status: 'upcoming' },
        { type: 'Other filing', due_date: '2026-06-01', status: 'upcoming' },
        { type: 'Another filing', due_date: '2026-06-01', status: 'upcoming' },
        { type: 'Yet another filing', due_date: '2026-06-01', status: 'upcoming' },
        { type: 'One more filing', due_date: '2026-06-01', status: 'upcoming' },
        { type: 'Last filing', due_date: '2026-06-01', status: 'upcoming' },
      ],
      tasks: [],
      directorCount: 0,
      today: TODAY,
    })
    expect(result.governanceScore).toBe(0)
    expect(result.trustScore).toBe(0)
  })
})
