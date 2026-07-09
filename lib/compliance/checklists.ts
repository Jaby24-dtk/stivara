// Rule-based prep checklists per Singapore compliance event type (build brief
// Section 4.5/5 "AI AGM Checklist" — this is the rule-based MVP version, no
// AI call needed since the steps are the same for every SG private company).

const AGM_CHECKLIST = [
  'Finalize financial statements for the year',
  "Prepare the directors' report",
  'Draft and send the AGM notice to all members (statutory minimum notice period applies)',
  'Prepare proxy forms for members who cannot attend',
  'Draft the AGM agenda',
  'Prepare a draft minutes template for the meeting',
  'Hold the AGM and record attendance and resolutions passed',
]

const ANNUAL_RETURN_CHECKLIST = [
  'Confirm the AGM has been held (if required) or an AGM exemption applies',
  'Confirm financial statements (and XBRL filing, if applicable) are ready',
  'Verify company particulars on BizFile+ are current (registered address, officers, share capital)',
  'Submit the Annual Return via BizFile+',
]

export function getChecklist(eventType: string): string[] {
  if (eventType === 'AGM') return AGM_CHECKLIST
  if (eventType === 'Annual Return (BizFile+)') return ANNUAL_RETURN_CHECKLIST
  return []
}
