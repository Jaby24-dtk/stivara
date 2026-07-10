'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

export function EditCapitalButton({
  companyId,
  issuedShareCapital,
  paidUpShareCapital,
}: {
  companyId: string
  issuedShareCapital: number | null
  paidUpShareCapital: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [issued, setIssued] = useState(issuedShareCapital?.toString() ?? '')
  const [paidUp, setPaidUp] = useState(paidUpShareCapital?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}/capital`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuedShareCapital: issued === '' ? null : Number(issued),
        paidUpShareCapital: paidUp === '' ? null : Number(paidUp),
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Update failed')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <Pencil size={14} />
        Edit capital
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit share capital</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-xs text-slate-500 -mb-2">Issued share capital</label>
              <input className="input-field" type="number" min="0" step="0.01" value={issued} onChange={(e) => setIssued(e.target.value)} />
              <label className="text-xs text-slate-500 -mb-2">Paid-up share capital</label>
              <input className="input-field" type="number" min="0" step="0.01" value={paidUp} onChange={(e) => setPaidUp(e.target.value)} />
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
