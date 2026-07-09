import { format } from 'date-fns'
import { chat, isGeminiConfigured } from '@/lib/ai/gemini'

const DISCLAIMER =
  'DRAFT — this summary has not been reviewed by a licensed corporate secretary and does not submit anything to ACRA. Use it to prepare your BizFile+ filing, not as a substitute for it.'

const SYSTEM_PROMPT = `You are the Stivara AI Company Secretary, preparing an Annual Return filing
summary for a Singapore private limited company ahead of their BizFile+ submission. Rules:

1. Write a short, plain-English summary of what this specific company needs to check and
   prepare before filing — confirm the AGM/exemption status, confirm financial statements
   and XBRL readiness, verify company particulars (registered address, officers, share
   capital) are current on BizFile+, and note the filing deadline.
2. Reference the directors/officers listed in the company context by name if given —
   never invent a name that wasn't provided.
3. Do not claim to file anything yourself — you are preparing the human for what to do
   on BizFile+, not submitting on their behalf (Stivara does not have ACRA filing
   integration).
4. Structure it with a **section header** for each of: Filing deadline, AGM status,
   Financial statements, Company particulars to verify, Next steps.
5. End with this exact line on its own: "${DISCLAIMER}"

Keep the tone plain and practical — this is a working checklist, not a legal document.`

function staticFallback(params: { companyName: string; dueDate: string }): string {
  const formattedDate = format(new Date(params.dueDate), 'd MMMM yyyy')
  return `**ANNUAL RETURN FILING SUMMARY**

**${params.companyName.toUpperCase()}**

**Filing deadline**
${formattedDate}

**Before you file on BizFile+, confirm:**
1. The AGM has been held (or an exemption applies).
2. Financial statements (and XBRL filing, if applicable) are finalized.
3. Company particulars on BizFile+ are current — registered address, officers, share capital.

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
