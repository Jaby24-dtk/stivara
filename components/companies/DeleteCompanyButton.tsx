'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to delete company')
      return
    }
    router.push('/companies')
    router.refresh()
  }

  return (
    <>
      <button
        className="btn-secondary btn-sm"
        style={{ color: '#B91C1C', borderColor: '#FCA5A5' }}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={14} />
        Delete
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Delete {companyName}</h2>
            <p className="text-sm text-slate-500 mb-4">
              This permanently deletes {companyName} and everything on record for it — directors, shareholders,
              documents, tasks, compliance events, funding rounds, and milestones. This can&apos;t be undone.
            </p>
            <label className="text-xs text-slate-500 mb-1 block">
              Type <span className="font-semibold text-slate-700">{companyName}</span> to confirm
            </label>
            <input
              className="input-field mb-3"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={companyName}
            />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="btn-primary"
                style={{ background: '#B91C1C', boxShadow: 'none' }}
                disabled={confirmText !== companyName || loading}
                onClick={handleDelete}
              >
                {loading ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
