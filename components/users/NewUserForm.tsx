'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRow } from '@/lib/types'
import { PLATFORM_ROLE_LABELS } from '@/lib/users/permissions'

type PlatformRole = UserRow['role']

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  const bytes = crypto.getRandomValues(new Uint32Array(14))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export function NewUserForm({ roles, onDone }: { roles: PlatformRole[]; onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<PlatformRole>(roles.includes('client_user') ? 'client_user' : roles[0])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to add user')
      return
    }
    router.refresh()
    setCreated({ email, password })
  }

  if (created) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-700">
          User added. Share these sign-in details with them securely — the password won&apos;t be shown again.
        </p>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm font-mono break-all">
          <p>Email: {created.email}</p>
          <p>Password: {created.password}</p>
        </div>
        <button className="btn-primary justify-center" onClick={onDone}>Done</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input className="input-field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label className="text-xs text-slate-500 -mb-2">Role</label>
      <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as PlatformRole)}>
        {roles.map((r) => (
          <option key={r} value={r}>{PLATFORM_ROLE_LABELS[r]}</option>
        ))}
      </select>
      <label className="text-xs text-slate-500 -mb-2">Temporary password (min 8 characters)</label>
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          type="text"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <button type="button" className="btn-secondary btn-sm" onClick={() => setPassword(generatePassword())}>
          Generate
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary justify-center" type="submit" disabled={loading}>
        {loading ? 'Adding…' : 'Add user'}
      </button>
    </form>
  )
}
