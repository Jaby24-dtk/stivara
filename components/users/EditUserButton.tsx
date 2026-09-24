'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import type { UserRow } from '@/lib/types'
import { PLATFORM_ROLE_LABELS } from '@/lib/users/permissions'

type PlatformRole = UserRow['role']
type Member = Pick<UserRow, 'id' | 'name' | 'email' | 'role'>

export function EditUserButton({ member, roles }: { member: Member; roles: PlatformRole[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(member.name)
  // A user on a retired role can't keep it, so preselect a valid one.
  const [role, setRole] = useState<PlatformRole>(roles.includes(member.role) ? member.role : 'client_user')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function close() {
    setOpen(false)
    setConfirmRemove(false)
    setError(null)
  }

  async function send(method: 'PATCH' | 'DELETE', body?: object) {
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/users/${member.id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Request failed')
      return
    }
    router.refresh()
    close()
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    send('PATCH', { name, role })
  }

  return (
    <>
      <button className="text-xs text-slate-400 hover:text-slate-700 inline-flex items-center gap-1" onClick={() => setOpen(true)}>
        <Pencil size={12} />
        Edit
      </button>
      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Edit user</h2>
            <p className="text-sm text-slate-500 mb-4">{member.email}</p>
            {confirmRemove ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-700">
                  Remove <strong>{member.name}</strong>? They will lose access immediately. Documents they uploaded are kept.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 justify-center" onClick={() => setConfirmRemove(false)} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary flex-1 justify-center !bg-red-600"
                    onClick={() => send('DELETE')}
                    disabled={loading}
                  >
                    {loading ? 'Removing…' : 'Remove user'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <label className="text-xs text-slate-500 -mb-2">Name</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                <label className="text-xs text-slate-500 -mb-2">Role</label>
                <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as PlatformRole)}>
                  {roles.map((r) => (
                    <option key={r} value={r}>{PLATFORM_ROLE_LABELS[r]}</option>
                  ))}
                </select>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button className="btn-primary justify-center" type="submit" disabled={loading}>
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline self-start"
                  onClick={() => { setError(null); setConfirmRemove(true) }}
                >
                  Remove user
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
