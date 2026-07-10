'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

export function EditShareholdingButton({
  roleAssignmentId,
  personName,
  shareCount,
  shareClass,
}: {
  roleAssignmentId: string
  personName: string
  shareCount: number | null
  shareClass: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(shareCount?.toString() ?? '')
  const [shareClassInput, setShareClassInput] = useState(shareClass ?? 'ordinary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/role-assignments/${roleAssignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareCount: count === '' ? null : Number(count), shareClass: shareClassInput || null }),
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
      <button className="text-xs text-slate-400 hover:text-teal-700" onClick={() => setOpen(true)}>
        <Pencil size={12} />
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Edit shareholding</h2>
            <p className="text-sm text-slate-500 mb-4">{personName}</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-xs text-slate-500 -mb-2">Share count</label>
              <input className="input-field" type="number" min="0" value={count} onChange={(e) => setCount(e.target.value)} />
              <label className="text-xs text-slate-500 -mb-2">Share class</label>
              <input className="input-field" value={shareClassInput} onChange={(e) => setShareClassInput(e.target.value)} placeholder="ordinary" />
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
