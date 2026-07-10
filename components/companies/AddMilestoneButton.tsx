'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const CATEGORIES = [
  { value: 'legal', label: 'Legal' },
  { value: 'growth', label: 'Growth' },
  { value: 'other', label: 'Other' },
]

export function AddMilestoneButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('legal')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, description: description || null, eventDate }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to add milestone')
      return
    }
    setOpen(false)
    setTitle('')
    setDescription('')
    router.refresh()
  }

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Add milestone
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add milestone</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input className="input-field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea className="input-field min-h-[60px]" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <label className="text-xs text-slate-500 -mb-2">Date</label>
              <input className="input-field" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center justify-end gap-2 mt-1">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
