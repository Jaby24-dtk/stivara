// Google Gemini embeddings — shares GEMINI_API_KEY with lib/ai/gemini.ts.
// Fixed at 768 dimensions to match the doc_chunks.embedding column (see
// supabase/schema.sql) — gemini-embedding-001 supports truncating its native
// output down to 768/1536/3072 via outputDimensionality.

const EMBED_MODEL = 'gemini-embedding-001'
const BATCH_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents`
export const EMBEDDING_DIMENSIONS = 768

export function isEmbeddingsConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY ?? ''
  return key.length > 0 && !key.includes('your-gemini-api-key-here')
}

export async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${BATCH_EMBED_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })),
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini batchEmbedContents request failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { embeddings: { values: number[] }[] }
  return data.embeddings.map((e) => e.values)
}
