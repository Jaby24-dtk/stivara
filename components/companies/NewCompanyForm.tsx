'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewCompanyForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [jurisdiction, setJurisdiction] = useState('SG')
  const [entityType, setEntityType] = useState('')
  const [fye, setFye] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jurisdiction, entityType, fye }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to create company')
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input className="input-field" placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} required />
      <select className="input-field" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
        <option value="SG">Singapore</option>
        <option value="MY">Malaysia</option>
        <option value="PH">Philippines</option>
        <option value="KR">South Korea</option>
      </select>
      <input className="input-field" placeholder="Entity type (e.g. Private Limited)" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
      <label className="text-xs text-slate-500 -mb-2">Financial year end</label>
      <input className="input-field" type="date" value={fye} onChange={(e) => setFye(e.target.value)} required />
      {jurisdiction !== 'SG' && (
        <p className="text-xs text-amber-600">
          Compliance calendar generation is Singapore-only in this build — other jurisdictions won&apos;t get auto-created deadlines yet.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary justify-center" type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create company'}
      </button>
    </form>
  )
}
