import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { isGeminiConfigured, isGeminiRateLimitError, GEMINI_RATE_LIMIT_MESSAGE, chat } from '@/lib/ai/gemini'
import { buildCompanyContext } from '@/lib/ai/companyContext'

const SYSTEM_PROMPT =
  'You are a corporate secretarial assistant generating discussion points, not advice. Given the company facts ' +
  'below, suggest up to 5 things worth reviewing (e.g. FYE timing, GST registration threshold, share structure, ' +
  'policy gaps) — one short sentence each, one per line, no numbering or markdown. Base every suggestion strictly ' +
  'on the facts given; never invent figures, dates, or legal thresholds not present in the facts. These are ' +
  'starting points for a human to verify with a qualified professional, not conclusions — do not state anything ' +
  'as settled fact or give a definitive recommendation to act.'

// User-triggered only (button click), never automatic — see lib/ai/gemini.ts,
// the free-tier quota is 20 requests/day shared across the whole app.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: 'AI Assistant is not configured. Add GEMINI_API_KEY to .env.local.' }, { status: 503 })
  }

  const { companyId } = await request.json()
  if (!companyId) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  try {
    const companyContext = await buildCompanyContext(companyId)
    const text = await chat({ system: SYSTEM_PROMPT, messages: [{ role: 'user', content: companyContext }], maxTokens: 512 })
    const suggestions = text.split('\n').map((line) => line.trim()).filter(Boolean)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('AI suggestions failed:', err)
    if (isGeminiRateLimitError(err)) {
      return NextResponse.json({ error: GEMINI_RATE_LIMIT_MESSAGE }, { status: 429 })
    }
    return NextResponse.json({ error: 'The AI Assistant hit an error generating suggestions. Please try again.' }, { status: 502 })
  }
}
