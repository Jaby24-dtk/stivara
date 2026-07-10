import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: companyId } = await params
  const { roundType, amount, currency, investor, closedDate } = await request.json()
  if (!roundType || amount == null || amount < 0 || !closedDate) {
    return NextResponse.json({ error: 'roundType, a non-negative amount, and closedDate are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: fundingRound, error } = await supabase
    .from('funding_rounds')
    .insert({
      company_id: companyId,
      round_type: roundType,
      amount,
      currency: currency || 'SGD',
      investor: investor || null,
      closed_date: closedDate,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ fundingRound })
}
