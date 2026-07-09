import { GoogleGenAI } from '@google/genai'

// Google Gemini embeddings — shares GEMINI_API_KEY with lib/ai/gemini.ts.
// Fixed at 768 dimensions to match the doc_chunks.embedding column (see
// supabase/schema.sql) — gemini-embedding-001 supports truncating its native
// output down to 768/1536/3072 via outputDimensionality.

const EMBED_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 768

export function isEmbeddingsConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY ?? ''
  return key.length > 0 && !key.includes('your-gemini-api-key-here')
}

let client: GoogleGenAI | null = null
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return client
}

export async function embed(texts: string[]): Promise<number[][]> {
  const response = await getClient().models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  })

  return (response.embeddings ?? []).map((e) => e.values ?? [])
}
