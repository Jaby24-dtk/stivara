import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for privileged server-side work (embedding upserts,
// storage writes on behalf of a user). Never import this into client code.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
