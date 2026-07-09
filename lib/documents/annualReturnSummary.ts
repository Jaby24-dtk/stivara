import { format } from 'date-fns'
import { chat, isGeminiConfigured } from '@/lib/ai/gemini'

const DISCLAIMER =
  'DRAFT — this summary has not been reviewed by a licensed corporate secretary and does not submit anything to ACRA. Use it to prepare your BizFile+ filing, not as a substitute for it.'

const SYSTEM_PROMPT = `You are the Stivara AI Company Secretary, preparing an Annual Return filing
summary for a Singapore private limited company ahead of their BizFile+ submission. Base this
on ACRA's actual requirements, not generic assumptions:

1. Filing deadline: 7 months after financial year end (standard private company; flag if the
   company keeps a branch register outside Singapore, which extends this to 8 months, but only
   if that's indicated in the context).
2. AGM status: the Annual Return must declare whether an AGM was held, is exempt, or was
   dispensed with under s175A (all members passed a resolution to dispense with AGMs). Note
   that even when dispensed with, a member can still demand an AGM within 14 days of receiving
   the financial statements.
3. Financial statements: must be filed in XBRL format, or PDF with an alphanumeric-only
   filename (no spaces/special characters) if XBRL-exempt.
4. Particulars to verify on BizFile+ before filing: registered office address; business
   activities (primary and secondary); details of directors and company secretary; shareholder
   and share information (number of shares, issued capital, paid-up capital); any registered
   charges or loans; Register of Registrable Controllers (RORC) is up to date; Register of
   Nominee Directors / Nominee Shareholders is up to date, if applicable.
5. Reference the directors/officers listed in the company context by name if given —
   never invent a name that wasn't provided.
6. Do not claim to file anything yourself — you are preparing the human for what to do
   on BizFile+, not submitting on their behalf (Stivara does not have ACRA filing
   integration).
7. Structure it with a **section header** for each of: Filing deadline, AGM status,
   Financial statements, Particulars to verify, Next steps.
8. End with this exact line on its own: "${DISCLAIMER}"

Keep the tone plain and practical — this is a working checklist, not a legal document.`

function staticFallback(params: { companyName: string; dueDate: string }): string {
  const formattedDate = format(new Date(params.dueDate), 'd MMMM yyyy')
  return `**ANNUAL RETURN FILING SUMMARY**

**${params.companyName.toUpperCase()}**

**Filing deadline**
${formattedDate}

**Before you file on BizFile+, confirm:**
1. AGM status — held, exempt, or dispensed with under s175A (declare this on the Annual Return).
2. Financial statements are ready in XBRL format (or PDF with an alphanumeric-only filename if XBRL-exempt).
3. Registered office address is current.
4. Business activities (primary and secondary) are current.
5. Director and company secretary details are current.
6. Shareholder and share information (number of shares, issued capital, paid-up capital) is current.
7. Any registered charges or loans are recorded.
8. Register of Registrable Controllers (RORC) is up to date.

${DISCLAIMER}`
}

export async function generateAnnualReturnSummary(params: {
  companyName: string
  jurisdiction: string
  dueDate: string
  fye: string
  people: { name: string; role: string }[]
}): Promise<string> {
  if (!isGeminiConfigured()) return staticFallback(params)

  const formattedDate = format(new Date(params.dueDate), 'd MMMM yyyy')
  const peopleContext = params.people.length > 0
    ? params.people.map((p) => `- ${p.name} (${p.role})`).join('\n')
    : '(no directors/officers on record for this company yet)'

  const userMessage = `Company: ${params.companyName} (${params.jurisdiction})
Financial year end: ${params.fye}
Annual Return filing deadline: ${formattedDate}

Current directors/officers on record:
${peopleContext}`

  try {
    const draft = await chat({ system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage }], maxTokens: 1024 })
    return draft || staticFallback(params)
  } catch (err) {
    console.error('Annual Return summary generation failed, using static fallback:', err)
    return staticFallback(params)
  }
}
