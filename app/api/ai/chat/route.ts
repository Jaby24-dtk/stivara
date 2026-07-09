import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { isGeminiConfigured, isGeminiRateLimitError, GEMINI_RATE_LIMIT_MESSAGE } from '@/lib/ai/gemini'
import { isEmbeddingsConfigured } from '@/lib/ai/embeddings'
import { search } from '@/lib/ai/documentSearch'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isGeminiConfigured() || !isEmbeddingsConfigured()) {
    return NextResponse.json(
      { error: 'AI Assistant is not configured. Add GEMINI_API_KEY to .env.local.' },
      { status: 503 }
    )
  }

  const { companyId, query } = await request.json()
  if (!companyId || !query) {
    return NextResponse.json({ error: 'companyId and query are required' }, { status: 400 })
  }

  // documentSearch uses the service-role client and bypasses RLS, so verify
  // the requester's org actually owns this company before running the query.
  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  try {
    const result = await search(companyId, query)
    return NextResponse.json(result)
  } catch (err) {
    console.error('AI Assistant search failed:', err)
    if (isGeminiRateLimitError(err)) {
      return NextResponse.json({ error: GEMINI_RATE_LIMIT_MESSAGE }, { status: 429 })
    }
    return NextResponse.json({ error: 'The AI Assistant hit an error answering that. Please try again.' }, { status: 502 })
  }
}
