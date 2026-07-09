import { format } from 'date-fns'
import { chat, isGeminiConfigured } from '@/lib/ai/gemini'

const DISCLAIMER =
  'DRAFT — these documents have not been reviewed by a licensed corporate secretary or lawyer. File the ACRA notification within 14 days of appointment.'

// One combined generation call rather than two separate ones (consent +
// resolution) — cheaper against Gemini's daily quota and matches how a
// secretarial firm actually packages an appointment: one set of paperwork,
// not two disconnected documents.
const SYSTEM_PROMPT = `You are the Stivara AI Company Secretary, preparing the full paperwork
pack for appointing a new director to a Singapore private limited company. Produce BOTH of
the following documents in one response, in this order, clearly separated by a horizontal
rule ("---") on its own line between them:

DOCUMENT 1 — Director's Consent to Act
1. Header: "**DIRECTOR'S CONSENT TO ACT**", then the company name, "(Company Registration
   No. [UEN — to be inserted])".
2. A short statement: "I, [Appointee Name], of [address — to be inserted], hereby consent to
   act as a director of [Company Name] with effect from [effective date]."
3. A statement confirming the appointee is not disqualified from acting as a director under
   the Companies Act (Cap. 50).
4. A signature line: "Signed: _________________  Name: [Appointee Name]  Date: _________________".

DOCUMENT 2 — Board Resolution appointing the director
Follow the standard Singapore written-resolution structure exactly: header block (company
name, UEN placeholder, "(the \"Company\")"), a written-means certification citing sections
184A to 184C of the Companies Act (Cap. 50), a short recital, numbered "RESOLVED THAT" /
"RESOLVED FURTHER THAT" clauses covering: the appointment itself with effective date, that
the appointee has provided written consent to act, and instruction to update the register of
directors and lodge the notification with ACRA within 14 days. Then a signature block — one
line per EXISTING director listed in the company context (not the new appointee, who signs
the Consent document instead). If no existing directors are on record, note this in the
NOTES section rather than inventing a signature line.

End the entire response with this exact line on its own, after both documents:
"${DISCLAIMER}"

Use **bold** for document titles and section headers only. Formal, precise tone.`

function staticFallback(params: { companyName: string; appointeeName: string; effectiveDate: string }): string {
  const formattedDate = format(new Date(params.effectiveDate), 'd MMMM yyyy')
  return `**DIRECTOR'S CONSENT TO ACT**

**${params.companyName.toUpperCase()}**
(Company Registration No. [UEN — to be inserted])

I, ${params.appointeeName}, of [address — to be inserted], hereby consent to act as a director of ${params.companyName} with effect from ${formattedDate}.

I confirm that I am not disqualified from acting as a director of a company under the Companies Act (Cap. 50).

Signed: _________________
Name: ${params.appointeeName}
Date: _________________

---

**WRITTEN RESOLUTION OF THE DIRECTORS OF ${params.companyName.toUpperCase()}**

**${params.companyName} (SG)**
(Company Registration No. [UEN — to be inserted])
(the "Company")

This Written Resolution is passed pursuant to sections 184A to 184C of the Companies Act (Cap. 50).

**RESOLVED THAT:**

1. ${params.appointeeName} be and is hereby appointed as a director of the Company with effect from ${formattedDate}, ${params.appointeeName} having provided written consent to act.

**RESOLVED FURTHER THAT:**

2. The register of directors be updated accordingly and the notification of appointment be lodged with ACRA via BizFile+ within 14 days of the effective date.

**NOTES**
No existing directors are on record for this company to sign this resolution — add them before finalizing.

${DISCLAIMER}`
}

export async function generateDirectorAppointmentPack(params: {
  companyName: string
  jurisdiction: string
  appointeeName: string
  effectiveDate: string
  existingDirectors: string[]
}): Promise<string> {
  if (!isGeminiConfigured()) return staticFallback(params)

  const formattedDate = format(new Date(params.effectiveDate), 'd MMMM yyyy')
  const directorContext = params.existingDirectors.length > 0
    ? params.existingDirectors.join(', ')
    : '(no existing directors on record for this company)'

  const userMessage = `Company: ${params.companyName} (${params.jurisdiction})
Appointee: ${params.appointeeName}
Effective date: ${formattedDate}
Existing directors on record: ${directorContext}`

  try {
    const draft = await chat({ system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage }], maxTokens: 2048 })
    return draft || staticFallback(params)
  } catch (err) {
    console.error('Director appointment pack generation failed, using static fallback:', err)
    return staticFallback(params)
  }
}
