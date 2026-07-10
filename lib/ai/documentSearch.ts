import { createAdminClient } from '@/lib/supabase/admin'
import { chat } from '@/lib/ai/gemini'
import { embed } from '@/lib/ai/embeddings'

const CHUNK_SIZE = 1500 // chars, roughly ~350 tokens
const CHUNK_OVERLAP = 200

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start = end - CHUNK_OVERLAP
  }
  return chunks
}

/** Chunks a document's extracted text, embeds each chunk, and stores them. */
export async function indexDocument(params: {
  documentId: string
  companyId: string
  text: string
}): Promise<void> {
  const chunks = chunkText(params.text)
  if (chunks.length === 0) return

  const embeddings = await embed(chunks)
  const admin = createAdminClient()

  const rows = chunks.map((content, i) => ({
    document_id: params.documentId,
    company_id: params.companyId,
    chunk_index: i,
    content,
    embedding: embeddings[i],
  }))

  const { error } = await admin.from('doc_chunks').insert(rows)
  if (error) throw error
}

export type SearchResult = {
  answer: string
  citations: { documentId: string; chunkIndex: number; excerpt: string }[]
}

/**
 * RAG query: embed the question, find similar chunks scoped to a company,
 * ask Gemini to answer using both those excerpts and the company's real
 * structured facts (companyContext — directors, filings, cross-company
 * roles), and cite document sources where used.
 */
export async function search(companyId: string, query: string, companyContext: string): Promise<SearchResult> {
  const [queryEmbedding] = await embed([query])
  const admin = createAdminClient()

  const { data: matches, error } = await admin.rpc('match_doc_chunks', {
    query_embedding: queryEmbedding,
    match_company_id: companyId,
    match_count: 6,
  })
  if (error) throw error

  const chunks = (matches ?? []) as { document_id: string; chunk_index: number; content: string }[]

  const docContext = chunks.length > 0
    ? chunks.map((c, i) => `[${i + 1}] (doc ${c.document_id}, chunk ${c.chunk_index})\n${c.content}`).join('\n\n')
    : '(no indexed documents matched this question)'

  const answer = await chat({
    system:
      'You are the Stivara AI Company Secretary. Answer using the company facts and document excerpts below. ' +
      'The company facts are structured data straight from Stivara\'s own records — treat them as ground truth. ' +
      'Cite document excerpts inline using [1], [2], etc. matching their numbers. If neither the facts nor the ' +
      'excerpts answer the question, say so clearly instead of guessing.',
    messages: [
      { role: 'user', content: `Question: ${query}\n\nCompany facts:\n${companyContext}\n\nDocument excerpts:\n${docContext}` },
    ],
  })

  return {
    answer,
    citations: chunks.map((c) => ({
      documentId: c.document_id,
      chunkIndex: c.chunk_index,
      excerpt: c.content.slice(0, 200),
    })),
  }
}
