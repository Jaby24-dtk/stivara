import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// Ends a role assignment (e.g. a director resigning) by setting end_date —
// the person and history stay on record, they just stop showing as current.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { endDate } = await request.json()

  const supabase = await createClient()
  // RLS scopes this update to role assignments whose company belongs to the caller's org.
  const { data: roleAssignment, error } = await supabase
    .from('role_assignments')
    .update({ end_date: endDate || new Date().toISOString().slice(0, 10) })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!roleAssignment) return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 })
  return NextResponse.json({ roleAssignment })
}
