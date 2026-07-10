import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: companyId } = await params
  const { issuedShareCapital, paidUpShareCapital } = await request.json()
  if (issuedShareCapital == null && paidUpShareCapital == null) {
    return NextResponse.json({ error: 'issuedShareCapital or paidUpShareCapital is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const updates: Record<string, number> = {}
  if (issuedShareCapital != null) updates.issued_share_capital = issuedShareCapital
  if (paidUpShareCapital != null) updates.paid_up_share_capital = paidUpShareCapital

  // RLS scopes this update to companies in the caller's org.
  const { data: company, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  return NextResponse.json({ company })
}
