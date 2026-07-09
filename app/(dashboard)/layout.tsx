import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-slate-900 mb-2">Supabase not configured</h1>
          <p className="text-sm text-slate-500">
            Add your Supabase project credentials to <code>.env.local</code> and run{' '}
            <code>supabase/schema.sql</code> to enable the dashboard.
          </p>
        </div>
      </div>
    )
  }

  const user = await getCurrentUser()
  let orgName = ''
  if (user) {
    const supabase = await createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .single()
    orgName = org?.name ?? ''
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar userName={user?.name ?? ''} orgName={orgName} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
