'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CORPORATE_ROLE_LABELS, CORPORATE_ROLE_GROUPS } from '@/lib/reference/corporateRoles'
import { JURISDICTIONS } from '@/lib/reference/jurisdictions'

const CATEGORY_LABELS: Record<string, string> = {
  company: 'Company',
  bank: 'Bank',
  auditor: 'Auditor',
  service_provider: 'Service provider',
  government_body: 'Government body',
  other: 'Other',
}

export function NewLegalEntityForm({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [entityCategory, setEntityCategory] = useState('company')
  const [jurisdiction, setJurisdiction] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [role, setRole] = useState('shareholder')
  const [shareCount, setShareCount] = useState('')
  const [shareClass, setShareClass] = useState('ordinary')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/legal-entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        name,
        entityCategory,
        jurisdiction: jurisdiction || null,
        registrationNumber: registrationNumber || null,
        role,
        shareCount: role === 'shareholder' && shareCount !== '' ? Number(shareCount) : undefined,
        shareClass: role === 'shareholder' ? shareClass : undefined,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to add legal entity')
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input className="input-field" placeholder="Entity name" value={name} onChange={(e) => setName(e.target.value)} required />
      <select className="input-field" value={entityCategory} onChange={(e) => setEntityCategory(e.target.value)}>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select className="input-field" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
        <option value="">Jurisdiction (optional)</option>
        {JURISDICTIONS.map((j) => (
          <option key={j.code} value={j.name}>{j.name}</option>
        ))}
      </select>
      <input
        className="input-field"
        placeholder="Registration number (optional)"
        value={registrationNumber}
        onChange={(e) => setRegistrationNumber(e.target.value)}
      />
      <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
        {CORPORATE_ROLE_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.roles.map((r) => (
              <option key={r} value={r}>{CORPORATE_ROLE_LABELS[r]}</option>
            ))}
          </optgroup>
        ))}
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
        {loading ? 'Adding…' : 'Add legal entity'}
      </button>
    </form>
  )
}
