import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: org } = await supabase.from('organizations').select('*').eq('id', user.organization_id).single()

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <div className="card p-6 flex flex-col gap-3">
        <div>
          <p className="text-xs text-slate-500">Organization</p>
          <p className="text-slate-900 font-medium">{org?.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Type</p>
          <p className="text-slate-900 font-medium">{org?.type === 'firm' ? 'Corporate secretarial firm' : 'Self-serve company'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="text-slate-900 font-medium">{user.name} ({user.email})</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Role</p>
          <p className="text-slate-900 font-medium">{user.role.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  )
}
