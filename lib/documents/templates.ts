// Blank, generic versions of the document formats Stivara already generates
// per-company (see lib/documents/*.ts and lib/ai/resolutionGenerator.ts).
// No AI call, no company data — just the standard Singapore corporate
// secretarial format with bracketed placeholders, for when someone just
// wants the template itself rather than a company-grounded draft.

const DISCLAIMER =
  'DRAFT — this template has not been reviewed by a licensed corporate secretary or lawyer. Confirm statutory requirements before use.'

export type DocumentTemplate = {
  id: string
  name: string
  description: string
  filename: string
  content: string
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'board-resolution',
    name: 'Board Resolution',
    description: 'Written resolution of the directors, passed under ss184A–184C of the Companies Act.',
    filename: 'board-resolution-template.txt',
    content: `**WRITTEN RESOLUTION OF THE DIRECTORS OF [COMPANY NAME]**

**[COMPANY NAME]**
(Company Registration No. [UEN])
(the "Company")

This Written Resolution is passed pursuant to sections 184A to 184C of the Companies Act (Cap. 50) without a meeting, and has been circulated to all directors entitled to vote.

**RECITAL**
[One short paragraph of context — what is being decided and why.]

**RESOLVED THAT:**

1. [First operative clause — be concrete: who is authorized, to do what, and any limits.]

**RESOLVED FURTHER THAT:**

2. [Second operative clause, if needed.]

**SIGNED BY THE DIRECTORS**

Signed: _________________  Name: [Director Name]  Date: _________________
Signed: _________________  Name: [Director Name]  Date: _________________

**RETENTION**
The signed original should be filed in the minute book and retained for at least 10 years (s184F).

${DISCLAIMER}`,
  },
  {
    id: 'agm-notice',
    name: 'Notice of Annual General Meeting',
    description: 'Standard AGM notice with ordinary business, proxy notes, and sign-off.',
    filename: 'agm-notice-template.txt',
    content: `**NOTICE OF ANNUAL GENERAL MEETING**

**[COMPANY NAME]**
(Company Registration No. [UEN])
(Incorporated in the Republic of Singapore)

NOTICE IS HEREBY GIVEN that the Annual General Meeting of the Company will be held at [venue] on [date] at [time] for the following purposes:

**ORDINARY BUSINESS**

Ordinary Resolution 1
To receive and adopt the Directors' Report and Audited Financial Statements for the financial year ended [FYE], together with the Auditors' Report.

Ordinary Resolution 2
To re-elect the director(s) retiring by rotation.

Ordinary Resolution 3
To re-appoint the Auditors and authorize the Directors to fix their remuneration.

Ordinary Resolution 4
To transact any other ordinary business of the Company.

**NOTES**
A member entitled to attend and vote is entitled to appoint a proxy who need not also be a member. The instrument appointing a proxy must be lodged at the registered office not less than 48 hours before the meeting (confirm against the Company's constitution).

By Order of the Board

_________________________
[Name]
Company Secretary
[COMPANY NAME]
Singapore, [date of notice]

${DISCLAIMER}`,
  },
  {
    id: 'directors-consent',
    name: "Director's Consent to Act",
    description: 'Consent form for a newly appointed director, paired with the appointment resolution.',
    filename: 'directors-consent-template.txt',
    content: `**DIRECTOR'S CONSENT TO ACT**

**[COMPANY NAME]**
(Company Registration No. [UEN])

I, [Appointee Name], of [address], hereby consent to act as a director of [Company Name] with effect from [effective date].

I confirm that I am not disqualified from acting as a director of a company under the Companies Act (Cap. 50).

Signed: _________________
Name: [Appointee Name]
Date: _________________

${DISCLAIMER}`,
  },
  {
    id: 'annual-return-checklist',
    name: 'Annual Return Filing Checklist',
    description: 'Working checklist of what to confirm on BizFile+ before filing the Annual Return.',
    filename: 'annual-return-checklist-template.txt',
    content: `**ANNUAL RETURN FILING SUMMARY**

**[COMPANY NAME]**

**Filing deadline**
[7 months after financial year end for a standard private company — 8 months if a branch register is kept outside Singapore]

**Before you file on BizFile+, confirm:**
1. AGM status — held, exempt, or dispensed with under s175A (declare this on the Annual Return).
2. Financial statements are ready in XBRL format (or PDF with an alphanumeric-only filename if XBRL-exempt).
3. Registered office address is current.
4. Business activities (primary and secondary) are current.
5. Director and company secretary details are current.
6. Shareholder and share information (number of shares, issued capital, paid-up capital) is current.
7. Any registered charges or loans are recorded.
8. Register of Registrable Controllers (RORC) is up to date.

DRAFT — this checklist has not been reviewed by a licensed corporate secretary and does not submit anything to ACRA. Use it to prepare your BizFile+ filing, not as a substitute for it.`,
  },
]
