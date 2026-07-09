// Rule-based prep checklists per Singapore compliance event type (build brief
// Section 4.5/5 "AI AGM Checklist" — this is the rule-based MVP version, no
// AI call needed since the steps are the same for every SG private company).
// Sourced from ACRA's own guidance (acra.gov.sg/how-to-guides/annual-general-meetings,
// acra.gov.sg/manage/companies/legal-requirements-common-offences/filing-annual-returns-companies).

const AGM_CHECKLIST = [
  'Finalize financial statements for the year',
  "Prepare the directors' report",
  'Confirm whether the AGM can be dispensed with (all members pass a resolution under s175A) — if so, skip to the Annual Return checklist instead',
  'Draft and send the AGM notice to all members (statutory minimum notice period applies)',
  'Prepare proxy forms for members who cannot attend',
  'Draft the AGM agenda',
  'Prepare a draft minutes template for the meeting',
  'Hold the AGM and record attendance and resolutions passed',
  'Note: even if dispensed with, a member can still demand an AGM within 14 days of receiving the financial statements',
]

const ANNUAL_RETURN_CHECKLIST = [
  'Confirm the AGM has been held, is exempt, or was dispensed with — ACRA requires this status to be declared on the Annual Return',
  'Confirm financial statements are ready, in XBRL format (or PDF with an alphanumeric-only filename if XBRL-exempt)',
  'Verify registered office address is current',
  'Verify business activities (primary and secondary) are current',
  'Verify details of company officers — directors and company secretary',
  'Verify shareholder and share information (number of shares, issued capital, paid-up capital)',
  'Verify details of any registered charges or loans',
  'Confirm the Register of Registrable Controllers (RORC) is up to date',
  'Confirm Register of Nominee Directors / Nominee Shareholders is up to date, if applicable',
  'Submit the Annual Return via BizFile+ within 7 months of FYE',
]

export function getChecklist(eventType: string): string[] {
  if (eventType === 'AGM') return AGM_CHECKLIST
  if (eventType === 'Annual Return (BizFile+)') return ANNUAL_RETURN_CHECKLIST
  return []
}
