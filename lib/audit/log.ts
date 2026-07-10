import type { createClient } from '@/lib/supabase/server'

type AuditAction = 'create' | 'update' | 'delete' | 'view_sensitive'

type LogAuditInput = {
  supabase: Awaited<ReturnType<typeof createClient>>
  organizationId: string
  actorUserId: string
  tableName: string
  recordId: string | null
  action: AuditAction
  oldValue?: unknown
  newValue?: unknown
  request?: Request
}

// Best-effort, same as document indexing in app/api/documents/upload/route.ts —
// an audit-log hiccup must never block the underlying mutation in a live
// prod app. Insert goes through the request-scoped (anon + session) client,
// not the admin client, so RLS verifies organizationId/actorUserId are the
// caller's real, session-backed identity rather than values the server
// trusts blindly.
export async function logAudit(input: LogAuditInput): Promise<void> {
  const { supabase, organizationId, actorUserId, tableName, recordId, action, oldValue, newValue, request } = input

  try {
    await supabase.from('audit_logs').insert({
      organization_id: organizationId,
      actor_user_id: actorUserId,
      table_name: tableName,
      record_id: recordId,
      action,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
      ip_address: request?.headers.get('x-forwarded-for') ?? null,
      user_agent: request?.headers.get('user-agent') ?? null,
    })
  } catch (err) {
    console.error('Audit log write failed:', err)
  }
}
