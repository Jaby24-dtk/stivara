// Singapore-only compliance rules (Stivara-Build-Brief.md, Section 7).
// Other jurisdictions (MY, PH, KR) are out of scope for Phase 0.

export type ComplianceEventDraft = {
  type: string
  due_date: string // ISO date
}

// Adds calendar months to an ISO date (YYYY-MM-DD) using UTC arithmetic so
// local timezone never shifts the day, and clamps to the target month's last
// day so e.g. Dec 31 + 6 months lands on Jun 30, not Jul 1 (JS Date's
// setMonth silently overflows short months otherwise).
function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const totalMonths = month - 1 + months
  const targetYear = year + Math.floor(totalMonths / 12)
  const targetMonth0 = ((totalMonths % 12) + 12) % 12
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth0 + 1, 0)).getUTCDate()
  const targetDay = Math.min(day, daysInTargetMonth)
  return new Date(Date.UTC(targetYear, targetMonth0, targetDay)).toISOString().slice(0, 10)
}

/**
 * Generates the two MVP Singapore statutory deadlines for a company, both
 * anchored to financial year end (FYE):
 *  - AGM: within 6 months of FYE
 *  - Annual Return (via BizFile+): within 7 months of FYE
 */
export function generateSgComplianceEvents(fye: string): ComplianceEventDraft[] {
  return [
    { type: 'AGM', due_date: addMonths(fye, 6) },
    { type: 'Annual Return (BizFile+)', due_date: addMonths(fye, 7) },
  ]
}

export function generateComplianceEvents(jurisdiction: string, fye: string): ComplianceEventDraft[] {
  if (jurisdiction === 'SG') return generateSgComplianceEvents(fye)
  // MY/PH/KR rule sets are Phase 2+ — no events generated yet.
  return []
}
