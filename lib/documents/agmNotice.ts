import { format } from 'date-fns'

// Template-based AGM notice draft — no AI involved, just company/event data
// filled into a standard SG private-company notice format. Carries the same
// "draft, requires review" framing as the build brief's AI-generation
// guardrails (Section 5), since it's still a statutory document a human
// should check before it's sent.
export function generateAgmNotice(params: {
  companyName: string
  agmDate: string
}): string {
  const formattedDate = format(new Date(params.agmDate), 'd MMMM yyyy')

  return `NOTICE OF ANNUAL GENERAL MEETING

${params.companyName.toUpperCase()}

NOTICE IS HEREBY GIVEN that the Annual General Meeting of the Company will be held on ${formattedDate} for the following purposes:

ORDINARY BUSINESS

1. To receive and adopt the Directors' Report and Audited Financial Statements for the financial year.
2. To re-elect Directors retiring by rotation (if applicable).
3. To re-appoint the Auditors and authorize the Directors to fix their remuneration.
4. To transact any other ordinary business of the Company.

By Order of the Board

[Name]
Company Secretary
${params.companyName}

---
DRAFT — this notice is a template generated from the company's compliance
calendar and has not been reviewed by a licensed corporate secretary or
lawyer. Confirm the statutory notice period for your jurisdiction and fill
in the bracketed fields before sending to members.`
}
