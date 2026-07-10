'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewPersonForm({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('director')
  const [shareCount, setShareCount] = useState('')
  const [shareClass, setShareClass] = useState('ordinary')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        name,
        email: email || null,
        role,
        shareCount: role === 'shareholder' && shareCount !== '' ? Number(shareCount) : undefined,
        shareClass: role === 'shareholder' ? shareClass : undefined,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to add person')
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input className="input-field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input-field" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="director">Director</option>
        <option value="shareholder">Shareholder</option>
        <option value="officer">Officer</option>
        <option value="beneficial_owner">Beneficial owner</option>
      </select>
      {role === 'shareholder' && (
        <div className="flex gap-2">
          <input
            className="input-field"
            type="number"
            min="0"
            placeholder="Share count (optional)"
            value={shareCount}
            onChange={(e) => setShareCount(e.target.value)}
          />
          <input
            className="input-field w-32"
            placeholder="Share class"
            value={shareClass}
            onChange={(e) => setShareClass(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary justify-center" type="submit" disabled={loading}>
        {loading ? 'Adding…' : 'Add person'}
      </button>
    </form>
  )
}
