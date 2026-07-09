// Google Gemini — used as the free-tier AI provider (aistudio.google.com).
// Chat and embeddings (lib/ai/embeddings.ts) share one GEMINI_API_KEY.

const CHAT_MODEL = 'gemini-2.5-flash'
const GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent`

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY ?? ''
  return key.length > 0 && !key.includes('your-gemini-api-key-here')
}

export async function chat(params: {
  system?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
}): Promise<string> {
  const res = await fetch(`${GENERATE_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: params.system ? { parts: [{ text: params.system }] } : undefined,
      contents: params.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: params.maxTokens ?? 1024 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini generateContent request failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  return text
}
