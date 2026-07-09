import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { UserRow } from '@/lib/types'

export async function getCurrentUser(): Promise<UserRow | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
  return (data as UserRow) ?? null
}
