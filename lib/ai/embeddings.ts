// Voyage AI embeddings — Anthropic's recommended embedding partner, matching
// the "Claude primary, provider-agnostic AI Actions layer" intent in the
// build brief (Section 9). No official Node SDK, so this calls the REST API
// directly to avoid an extra dependency.

const VOYAGE_EMBED_URL = 'https://api.voyageai.com/v1/embeddings'
const MODEL = 'voyage-3'

export function isEmbeddingsConfigured(): boolean {
  const key = process.env.VOYAGE_API_KEY ?? ''
  return key.length > 0 && !key.includes('your-voyage-api-key-here')
}

export async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: MODEL }),
  })

  if (!res.ok) {
    throw new Error(`Voyage embeddings request failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] }
  return data.data.map((d) => d.embedding)
}
