import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { isEmbeddingsConfigured } from '@/lib/ai/embeddings'
import { indexDocument } from '@/lib/ai/documentSearch'
import { logAudit } from '@/lib/audit/log'

// Only text-like files are indexed for AI search in this scaffold — full
// OCR/PDF-text-extraction is a Phase 1+ integration (brief Section 10).
const INDEXABLE_TYPES = ['text/plain', 'text/markdown', 'application/json']

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const companyId = formData.get('companyId') as string | null
  if (!file || !companyId) {
    return NextResponse.json({ error: 'file and companyId are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const storagePath = `${user.organization_id}/${companyId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type || undefined })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      company_id: companyId,
      name: file.name,
      storage_path: storagePath,
      content_type: file.type || null,
      uploaded_by: user.id,
    })
    .select()
    .single()
  if (docError) return NextResponse.json({ error: docError.message }, { status: 400 })

  await logAudit({
    supabase,
    organizationId: user.organization_id,
    actorUserId: user.id,
    tableName: 'documents',
    recordId: doc.id,
    action: 'create',
    newValue: doc,
    request,
  })

  // Indexing is best-effort: a Gemini outage or bad key shouldn't fail the
  // upload itself, since the document is already safely stored.
  let indexed = false
  if (isEmbeddingsConfigured() && INDEXABLE_TYPES.includes(file.type)) {
    try {
      const text = await file.text()
      await indexDocument({ documentId: doc.id, companyId, text })
      indexed = true
    } catch (err) {
      console.error('Document indexing failed:', err)
    }
  }

  return NextResponse.json({ document: doc, indexed })
}
