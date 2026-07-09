import { format } from 'date-fns'
import { chat, isGeminiConfigured } from '@/lib/ai/gemini'

const DISCLAIMER =
  'DRAFT — this notice has not been reviewed by a licensed corporate secretary or lawyer. Confirm the statutory notice period for your jurisdiction before sending to members.'

const SYSTEM_PROMPT = `You are the Stivara AI Company Secretary, drafting a Notice of Annual General
Meeting for a Singapore private limited company. Rules:

1. Use the standard SG AGM notice structure: heading, "NOTICE IS HEREBY
   GIVEN...", ordinary business items (adopt financial statements/directors'
   report, re-elect directors retiring by rotation, re-appoint auditors,
   any other ordinary business), "By Order of the Board" sign-off.
2. If specific directors are listed in the company context, name the ones
   retiring by rotation explicitly rather than leaving it generic — for a
   private company with a small board, assume all listed directors are
   subject to rotation unless told otherwise, and say so.
3. If no directors are on record, say plainly that director details should
   be added before this notice is finalized — do not invent names.
4. End with this exact line on its own: "${DISCLAIMER}"

Keep the tone formal and precise, matching how a Singapore corporate secretary would draft it.
Use **bold** only for the document title and section headers.`

function staticFallback(params: { companyName: string; agmDate: string }): string {
  const formattedDate = format(new Date(params.agmDate), 'd MMMM yyyy')
  return `**NOTICE OF ANNUAL GENERAL MEETING**

**${params.companyName.toUpperCase()}**

NOTICE IS HEREBY GIVEN that the Annual General Meeting of the Company will be held on ${formattedDate} for the following purposes:

**ORDINARY BUSINESS**

1. To receive and adopt the Directors' Report and Audited Financial Statements for the financial year.
2. To re-elect Directors retiring by rotation (if applicable).
3. To re-appoint the Auditors and authorize the Directors to fix their remuneration.
4. To transact any other ordinary business of the Company.

By Order of the Board

[Name]
Company Secretary
${params.companyName}

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
    const draft = await chat({ system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage }], maxTokens: 1024 })
    return draft || staticFallback(params)
  } catch (err) {
    console.error('AGM notice generation failed, using static fallback:', err)
    return staticFallback(params)
  }
}
