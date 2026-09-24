import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { AddUserButton } from '@/components/users/AddUserButton'
import { EditUserButton } from '@/components/users/EditUserButton'
import { PLATFORM_ROLE_LABELS, RETIRED_ROLES, assignableRoles, canManageUser, canManageUsers, rolePermissions } from '@/lib/users/permissions'
import type { UserRow } from '@/lib/types'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: org } = await supabase.from('organizations').select('*').eq('id', user.organization_id).single()
  const { data: members } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('organization_id', user.organization_id)
    .order('created_at')

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
      <div className="card p-6 flex flex-col gap-3 max-w-lg">
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
          <p className="text-slate-900 font-medium">{PLATFORM_ROLE_LABELS[user.role]}</p>
        </div>
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Users</h2>
          {canManageUsers(user.role) && <AddUserButton roles={assignableRoles(user.role)} />}
        </div>
        <ul className="flex flex-col divide-y divide-slate-100">
          {(members as Pick<UserRow, 'id' | 'name' | 'email' | 'role'>[] | null)?.map((m) => (
            <li key={m.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-slate-900 font-medium truncate">{m.name}{m.id === user.id && ' (you)'}</p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {rolePermissions(m.role).map((p) => (
                    <li key={p} className="text-xs text-slate-600">• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="badge badge-gray">{PLATFORM_ROLE_LABELS[m.role]}</span>
                {canManageUser(user, m) && <EditUserButton member={m} roles={assignableRoles(user.role)} />}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-slate-900">Roles &amp; permissions</h2>
        <div className="flex flex-col gap-4">
          {(Object.keys(PLATFORM_ROLE_LABELS) as UserRow['role'][])
            .filter((r) => !RETIRED_ROLES.includes(r))
            .map((r) => (
              <div key={r}>
                <p className="text-slate-900 font-medium">{PLATFORM_ROLE_LABELS[r]}</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {rolePermissions(r).map((p) => (
                    <li key={p} className="text-sm text-slate-600">• {p}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
