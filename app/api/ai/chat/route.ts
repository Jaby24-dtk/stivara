import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { isAnthropicConfigured } from '@/lib/ai/anthropic'
import { isEmbeddingsConfigured } from '@/lib/ai/embeddings'
import { search } from '@/lib/ai/documentSearch'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isAnthropicConfigured() || !isEmbeddingsConfigured()) {
    return NextResponse.json(
      { error: 'AI Assistant is not configured. Add ANTHROPIC_API_KEY and VOYAGE_API_KEY to .env.local.' },
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

  const result = await search(companyId, query)
  return NextResponse.json(result)
}
