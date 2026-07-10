import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, jurisdiction, entityType, incorporationDate, fye } = await request.json()

  const updates: Record<string, string | null> = {}
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    updates.name = name
  }
  if (jurisdiction !== undefined) updates.jurisdiction = jurisdiction
  if (entityType !== undefined) updates.entity_type = entityType || null
  if (incorporationDate !== undefined) updates.incorporation_date = incorporationDate || null
  if (fye !== undefined) updates.fye = fye

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = await createClient()
  // RLS scopes this update to companies in the caller's org.
  const { data: company, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  return NextResponse.json({ company })
}

// Cascades to role_assignments, documents, doc_chunks, compliance_events,
// tasks, funding_rounds, and milestones via `on delete cascade` FKs (see
// supabase/schema.sql) — this is a real, irreversible delete, not a soft one.
// Uploaded files in Storage are not cleaned up by this cascade; they're left
// orphaned rather than risk deleting the wrong path.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  // Verify org ownership explicitly so a company outside the caller's org
  // reports 404 instead of RLS silently deleting zero rows.
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
