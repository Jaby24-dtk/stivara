import { chat } from '@/lib/ai/gemini'

// AI Resolution Generator (build brief Section 5) — drafts a board or
// shareholder resolution from a plain-English request, grounded in the
// company's actual directors/officers so it doesn't invent names.

const SYSTEM_PROMPT = `You are the Stivara AI Company Secretary, drafting a board or shareholder
resolution for a Singapore private limited company. Rules:

1. Start by stating clearly whether this should be a BOARD RESOLUTION or a
   SHAREHOLDERS' RESOLUTION (ordinary or special), and why, based on what is
   being resolved.
2. Use standard resolution language ("RESOLVED THAT...", "RESOLVED FURTHER
   THAT..." for multiple clauses).
3. Reference directors/officers by name only if they are listed in the
   company context provided — never invent a name that wasn't given to you.
4. If the request is ambiguous or missing information you'd need (e.g. an
   effective date, a share count, an appointee's name), draft your best
   version and clearly flag what's missing in a "NOTES" section at the end
   rather than inventing details.
5. End with this exact line on its own:
   "DRAFT — this resolution has not been reviewed by a licensed corporate secretary or lawyer."

Keep the tone formal and precise, matching how a Singapore corporate secretary would draft it.`

export async function generateResolution(params: {
  companyName: string
  jurisdiction: string
  people: { name: string; role: string }[]
  request: string
}): Promise<string> {
  const peopleContext = params.people.length > 0
    ? params.people.map((p) => `- ${p.name} (${p.role})`).join('\n')
    : '(no directors/officers on record for this company yet)'

  const userMessage = `Company: ${params.companyName} (${params.jurisdiction})

Current directors/officers on record:
${peopleContext}

Request: ${params.request}`

  return chat({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 1024,
  })
}
