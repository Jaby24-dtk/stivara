'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JurisdictionSelect } from './JurisdictionSelect'
import { EntityTypeSelect } from './EntityTypeSelect'

export function NewCompanyForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [jurisdiction, setJurisdiction] = useState('SG')
  const [jurisdictionOther, setJurisdictionOther] = useState('')
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
      body: JSON.stringify({ name, jurisdiction, jurisdictionOther, entityType, fye }),
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
      <JurisdictionSelect
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
        otherCountry={jurisdictionOther}
        onOtherCountryChange={setJurisdictionOther}
      />
      <EntityTypeSelect value={entityType} onChange={setEntityType} />
      <label className="text-xs text-slate-500 -mb-2">Financial year end</label>
      <input className="input-field" type="date" value={fye} onChange={(e) => setFye(e.target.value)} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary justify-center" type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create company'}
      </button>
    </form>
  )
}
