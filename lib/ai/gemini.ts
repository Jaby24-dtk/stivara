import { GoogleGenAI } from '@google/genai'

// Google Gemini — used as the free-tier AI provider (aistudio.google.com).
// Chat and embeddings (lib/ai/embeddings.ts) share one GEMINI_API_KEY.

const CHAT_MODEL = 'gemini-2.5-flash'

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY ?? ''
  return key.length > 0 && !key.includes('your-gemini-api-key-here')
}

let client: GoogleGenAI | null = null
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return client
}

export async function chat(params: {
  system?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
}): Promise<string> {
  const response = await getClient().models.generateContent({
    model: CHAT_MODEL,
    contents: params.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: params.system,
      // maxOutputTokens is a shared budget across thinking + the visible
      // answer — a small cap can let thinking eat the whole budget and
      // truncate the actual response, so cap thinking separately and give
      // the visible output its own headroom on top.
      thinkingConfig: { thinkingBudget: 512 },
      maxOutputTokens: (params.maxTokens ?? 1024) + 512,
    },
  })

  return response.text ?? ''
}

// Gemini's free tier caps gemini-2.5-flash at 20 requests/day (a hard quota,
// not a transient blip) — surface that distinctly so a 429 doesn't read the
// same as a generic failure the user might retry expecting a different result.
export function isGeminiRateLimitError(err: unknown): boolean {
  return (err as { status?: number })?.status === 429
}

export const GEMINI_RATE_LIMIT_MESSAGE =
  "Gemini's free-tier daily limit (20 requests/day) has been hit. Try again once it resets, or switch to a paid key for unlimited use."
