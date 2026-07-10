import { describe, expect, it } from 'vitest'
import { buildDailyBriefing } from './briefing'

describe('buildDailyBriefing', () => {
  it('reports no overdue filings and the trust score when everything is clean', () => {
    const text = buildDailyBriefing({ items: [], trustScore: 100, riskLevel: 'LOW' })
    expect(text).toBe('No overdue filings across your portfolio. Corporate Trust Score is 100 — low risk.')
  })

  it('singularizes a single overdue item', () => {
    const text = buildDailyBriefing({
      items: [{ companyName: 'STIV Pte Ltd', severity: 'red', message: 'AGM is overdue by 3 days' }],
      trustScore: 60,
      riskLevel: 'HIGH',
    })
    expect(text).toContain('1 overdue item needs attention: AGM is overdue by 3 days (STIV Pte Ltd).')
    expect(text).toContain('Corporate Trust Score is 60 — high risk.')
  })

  it('pluralizes multiple overdue items and joins them', () => {
    const text = buildDailyBriefing({
      items: [
        { companyName: 'STIV Pte Ltd', severity: 'red', message: 'AGM is overdue by 3 days' },
        { companyName: 'I-BG', severity: 'red', message: 'Annual Return is overdue by 1 day' },
      ],
      trustScore: 40,
      riskLevel: 'HIGH',
    })
    expect(text).toContain(
      '2 overdue items need attention: AGM is overdue by 3 days (STIV Pte Ltd); Annual Return is overdue by 1 day (I-BG).'
    )
  })

  it('adds a due-soon sentence only when there are due-soon items', () => {
    const withDueSoon = buildDailyBriefing({
      items: [{ companyName: 'STIV Pte Ltd', severity: 'amber', message: 'No directors on record' }],
      trustScore: 80,
      riskLevel: 'MEDIUM',
    })
    expect(withDueSoon).toBe(
      'No overdue filings across your portfolio. 1 item due soon: No directors on record (STIV Pte Ltd). Corporate Trust Score is 80 — medium risk.'
    )

    const withoutDueSoon = buildDailyBriefing({ items: [], trustScore: 100, riskLevel: 'LOW' })
    expect(withoutDueSoon).not.toContain('due soon')
  })
})
