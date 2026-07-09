import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { isGeminiConfigured, isGeminiRateLimitError, GEMINI_RATE_LIMIT_MESSAGE } from '@/lib/ai/gemini'
import { generateResolution } from '@/lib/ai/resolutionGenerator'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: 'AI drafting is not configured. Add GEMINI_API_KEY to .env.local.' },
      { status: 503 }
    )
  }

  const { companyId, request: draftRequest } = await request.json()
  if (!companyId || !draftRequest) {
    return NextResponse.json({ error: 'companyId and request are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, jurisdiction')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select('role, people(name)')
    .eq('company_id', companyId)
    .is('end_date', null)

  const people = (roleAssignments ?? []).map((r) => ({
    name: (r.people as unknown as { name: string } | null)?.name ?? 'Unknown',
    role: r.role as string,
  }))

  try {
    const draft = await generateResolution({
      companyName: company.name,
      jurisdiction: company.jurisdiction,
      people,
      request: draftRequest,
    })
    return NextResponse.json({ draft })
  } catch (err) {
    console.error('Resolution generation failed:', err)
    if (isGeminiRateLimitError(err)) {
      return NextResponse.json({ error: GEMINI_RATE_LIMIT_MESSAGE }, { status: 429 })
    }
    return NextResponse.json({ error: 'Drafting failed. Please try again.' }, { status: 502 })
  }
}
