import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

const VALID_CATEGORIES = ['legal', 'growth', 'other']

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: companyId } = await params
  const { category, title, description, eventDate } = await request.json()
  if (!VALID_CATEGORIES.includes(category) || !title || !eventDate) {
    return NextResponse.json({ error: 'a valid category (legal, growth, other), title, and eventDate are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: milestone, error } = await supabase
    .from('milestones')
    .insert({ company_id: companyId, category, title, description: description || null, event_date: eventDate })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ milestone })
}
