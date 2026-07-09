import { format } from 'date-fns'
import { chat, isGeminiConfigured } from '@/lib/ai/gemini'

const DISCLAIMER =
  'DRAFT — this notice has not been reviewed by a licensed corporate secretary or lawyer. Confirm the statutory notice period, time, and venue before sending to members.'

const SYSTEM_PROMPT = `You are the Stivara AI Company Secretary, drafting a full Notice of Annual
General Meeting for a Singapore private limited company, in the standard form a corporate
secretarial firm actually produces — not an abbreviated summary. Every time, include:

1. **Header block**: "NOTICE OF ANNUAL GENERAL MEETING" in caps, then the company name in
   caps, "(Company Registration No. [UEN — to be inserted])", and
   "(Incorporated in the Republic of Singapore)" on their own lines.
2. **Opening**: "NOTICE IS HEREBY GIVEN that the Annual General Meeting of the Company will
   be held at [venue — e.g. the registered office, to be inserted] on [date] at [time — to
   be inserted] for the following purposes:"
3. **ORDINARY BUSINESS** — numbered as "Ordinary Resolution 1", "Ordinary Resolution 2" etc.,
   each with the FULL resolution text, not just a description:
   - To receive and adopt the Directors' Report and Audited Financial Statements for the
     financial year ended [FYE], together with the Auditors' Report.
   - To re-elect the director(s) retiring by rotation. If specific directors are in the
     company context, name them explicitly and state they retire and, being eligible, offer
     themselves for re-election. If none are on record, say plainly that director details
     need to be added before finalizing, in NOTES — do not invent a name.
   - To re-appoint the Auditors and authorize the Directors to fix their remuneration.
   - To transact any other ordinary business.
4. **NOTES section** covering, in plain language: (a) a member entitled to attend and vote
   may appoint a proxy who need not also be a member, (b) the instrument appointing a proxy
   must be lodged at the registered office not less than 48 hours before the meeting (state
   this is the common default and should be confirmed against the company's constitution),
   (c) where the AGM is dispensed with or exempted under s175A, this notice would not apply
   — only include this note if the context doesn't confirm an AGM is actually being held.
5. **Sign-off**: "By Order of the Board", then a blank signature line, "[Name]", "Company
   Secretary", the company name, and "Singapore, [date of notice — to be inserted]".
6. **NOTES ON DRAFTING** (separate from the notice's own Notes section): flag anything you
   couldn't fill in with real data (venue, time, company secretary's name, notice date).
7. End with this exact line on its own: "${DISCLAIMER}"

Use **bold** for the header block and section labels only. Formal, precise tone — this should
read like a real firm produced it, not a summary of one.`

function staticFallback(params: { companyName: string; agmDate: string }): string {
  const formattedDate = format(new Date(params.agmDate), 'd MMMM yyyy')
  return `**NOTICE OF ANNUAL GENERAL MEETING**

**${params.companyName.toUpperCase()}**
(Company Registration No. [UEN — to be inserted])
(Incorporated in the Republic of Singapore)

NOTICE IS HEREBY GIVEN that the Annual General Meeting of the Company will be held at [venue — to be inserted] on ${formattedDate} at [time — to be inserted] for the following purposes:

**ORDINARY BUSINESS**

Ordinary Resolution 1
To receive and adopt the Directors' Report and Audited Financial Statements for the financial year, together with the Auditors' Report.

Ordinary Resolution 2
To re-elect the director(s) retiring by rotation.

Ordinary Resolution 3
To re-appoint the Auditors and authorize the Directors to fix their remuneration.

Ordinary Resolution 4
To transact any other ordinary business of the Company.

**NOTES**
A member entitled to attend and vote is entitled to appoint a proxy who need not also be a member. The instrument appointing a proxy must be lodged at the registered office not less than 48 hours before the meeting (confirm this against the Company's constitution).

By Order of the Board

_________________________
[Name]
Company Secretary
${params.companyName}
Singapore, [date of notice — to be inserted]

${DISCLAIMER}`
}

export async function generateAgmNotice(params: {
  companyName: string
  jurisdiction: string
  agmDate: string
  directors: string[]
}): Promise<string> {
  if (!isGeminiConfigured()) return staticFallback(params)

  const formattedDate = format(new Date(params.agmDate), 'd MMMM yyyy')
  const directorContext = params.directors.length > 0
    ? params.directors.join(', ')
    : '(no directors on record for this company yet)'

  const userMessage = `Company: ${params.companyName} (${params.jurisdiction})
AGM date: ${formattedDate}
Current directors on record: ${directorContext}`

  try {
    const draft = await chat({ system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage }], maxTokens: 2048 })
    return draft || staticFallback(params)
  } catch (err) {
    console.error('AGM notice generation failed, using static fallback:', err)
    return staticFallback(params)
  }
}
