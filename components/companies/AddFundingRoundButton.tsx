'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export function AddFundingRoundButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [roundType, setRoundType] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('SGD')
  const [investor, setInvestor] = useState('')
  const [closedDate, setClosedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}/funding-rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundType, amount: Number(amount), currency, investor: investor || null, closedDate }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Failed to add funding round')
      return
    }
    setOpen(false)
    setRoundType('')
    setAmount('')
    setInvestor('')
    router.refresh()
  }

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Add funding round
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add funding round</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input className="input-field" placeholder="Round type (e.g. Seed, Series A)" value={roundType} onChange={(e) => setRoundType(e.target.value)} required />
              <div className="flex gap-2">
                <input className="input-field" type="number" min="0" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <input className="input-field w-24" placeholder="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
              </div>
              <input className="input-field" placeholder="Investor (optional)" value={investor} onChange={(e) => setInvestor(e.target.value)} />
              <label className="text-xs text-slate-500 -mb-2">Closed date</label>
              <input className="input-field" type="date" value={closedDate} onChange={(e) => setClosedDate(e.target.value)} required />
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
