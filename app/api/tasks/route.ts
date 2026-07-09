import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { companyId, title, dueDate } = body
  if (!companyId || !title) {
    return NextResponse.json({ error: 'companyId and title are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ company_id: companyId, title, due_date: dueDate ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ task })
}
