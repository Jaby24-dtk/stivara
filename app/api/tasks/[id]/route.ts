import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

const VALID_STATUSES = ['todo', 'in_progress', 'done']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await request.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'status must be one of todo, in_progress, done' }, { status: 400 })
  }

  const supabase = await createClient()
  // RLS scopes this update to tasks whose company belongs to the caller's org.
  const { data: task, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json({ task })
}
