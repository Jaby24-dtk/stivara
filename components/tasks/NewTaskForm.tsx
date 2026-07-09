'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Company } from '@/lib/types'

export function NewTaskForm({ companies, onDone }: { companies: Pick<Company, 'id' | 'name'>[]; onDone: () => void }) {
  const router = useRouter()
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, title, dueDate: dueDate || null }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to create task')
      return
    }
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select className="input-field" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input className="input-field" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label className="text-xs text-slate-500 -mb-2">Due date (optional)</label>
      <input className="input-field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary justify-center" type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create task'}
      </button>
    </form>
  )
}
