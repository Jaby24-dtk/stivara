import { describe, expect, it } from 'vitest'
import { buildTimeline } from './timeline'

describe('buildTimeline', () => {
  it('is empty when there is no dated history', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: null,
      roleAssignments: [],
      documents: [],
    })
    expect(events).toEqual([])
  })

  it('includes an incorporation event only when the date is known', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: '2024-01-15',
      roleAssignments: [],
      documents: [],
    })
    expect(events).toEqual([{ date: '2024-01-15', label: 'STIV Pte Ltd incorporated' }])
  })

  it('adds an appointment event, and a resignation event only when ended', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: null,
      roleAssignments: [
        { personName: 'Erene', role: 'director', startDate: '2025-01-01', endDate: null },
        { personName: 'Alan Lim', role: 'shareholder', startDate: '2024-06-01', endDate: '2025-06-01' },
      ],
      documents: [],
    })
    expect(events).toEqual([
      { date: '2024-06-01', label: 'Alan Lim appointed as Shareholder' },
      { date: '2025-01-01', label: 'Erene appointed as Director' },
      { date: '2025-06-01', label: 'Alan Lim ceased to be Shareholder' },
    ])
  })

  it('falls back to the raw role string for an unrecognized role', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: null,
      roleAssignments: [{ personName: 'Erene', role: 'auditor', startDate: '2025-01-01', endDate: null }],
      documents: [],
    })
    expect(events).toEqual([{ date: '2025-01-01', label: 'Erene appointed as auditor' }])
  })

  it('adds a document upload event, truncating the timestamp to a date', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: null,
      roleAssignments: [],
      documents: [{ name: 'AGM minutes.pdf', createdAt: '2025-03-04T09:30:00.000Z' }],
    })
    expect(events).toEqual([{ date: '2025-03-04', label: 'Document uploaded: AGM minutes.pdf' }])
  })

  it('sorts all events chronologically regardless of input order', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: '2024-01-15',
      roleAssignments: [{ personName: 'Erene', role: 'director', startDate: '2025-01-01', endDate: null }],
      documents: [{ name: 'AGM minutes.pdf', createdAt: '2024-06-01T00:00:00.000Z' }],
    })
    expect(events.map((e) => e.date)).toEqual(['2024-01-15', '2024-06-01', '2025-01-01'])
  })

  it('adds a funding round event, naming the investor when known', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: null,
      roleAssignments: [],
      documents: [],
      fundingRounds: [
        { roundType: 'Seed', amount: 500000, currency: 'SGD', investor: 'Acme Capital', closedDate: '2025-02-01' },
        { roundType: 'Grant', amount: 50000, currency: 'SGD', investor: null, closedDate: '2025-01-01' },
      ],
    })
    expect(events).toEqual([
      { date: '2025-01-01', label: 'Grant — SGD 50,000 raised' },
      { date: '2025-02-01', label: 'Seed — SGD 500,000 raised from Acme Capital' },
    ])
  })

  it('adds a milestone event, labeled by category', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: null,
      roleAssignments: [],
      documents: [],
      milestones: [
        { category: 'legal', title: 'Trademark filed', eventDate: '2025-04-01' },
        { category: 'growth', title: 'Vietnam subsidiary incorporated', eventDate: '2025-05-01' },
        { category: 'other', title: 'Office relocated', eventDate: '2025-06-01' },
      ],
    })
    expect(events).toEqual([
      { date: '2025-04-01', label: 'Legal: Trademark filed' },
      { date: '2025-05-01', label: 'Growth: Vietnam subsidiary incorporated' },
      { date: '2025-06-01', label: 'Milestone: Office relocated' },
    ])
  })

  it('merges funding rounds and milestones into the same chronological timeline', () => {
    const events = buildTimeline({
      companyName: 'STIV Pte Ltd',
      incorporationDate: '2024-01-15',
      roleAssignments: [{ personName: 'Erene', role: 'director', startDate: '2025-01-01', endDate: null }],
      documents: [],
      fundingRounds: [{ roundType: 'Seed', amount: 500000, currency: 'SGD', investor: null, closedDate: '2024-12-01' }],
      milestones: [{ category: 'legal', title: 'Trademark filed', eventDate: '2025-02-01' }],
    })
    expect(events.map((e) => e.date)).toEqual(['2024-01-15', '2024-12-01', '2025-01-01', '2025-02-01'])
  })
})
