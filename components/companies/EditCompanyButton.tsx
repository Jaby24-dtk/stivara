'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import type { Company } from '@/lib/types'

export function EditCompanyButton({ company }: { company: Company }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(company.name)
  const [jurisdiction, setJurisdiction] = useState<string>(company.jurisdiction)
  const [entityType, setEntityType] = useState(company.entity_type ?? '')
  const [fye, setFye] = useState(company.fye)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, jurisdiction, entityType, fye }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to update company')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <Pencil size={14} />
        Edit
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit company</h2>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center justify-end gap-2 mt-1">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
