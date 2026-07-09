'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { DownloadTextButton } from '@/components/documents/DownloadTextButton'
import { DocumentPreview } from '@/components/documents/DocumentPreview'

type Result = {
  document: string
  task: { id: string; title: string; due_date: string | null }
  person: { name: string }
}

export function DirectorAppointmentWizard({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch(`/api/companies/${companyId}/appoint-director`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || null, effectiveDate }),
    })
    const body = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(body.error ?? 'Appointment failed')
      return
    }
    setResult(body)
    router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setResult(null)
    setName('')
    setEmail('')
    setError(null)
  }

  return (
    <>
      <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <UserPlus size={14} />
        Appoint director
      </button>
      {open && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-box p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {!result ? (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Appoint a director</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Adds the person, drafts the consent-to-act and board resolution, and creates the ACRA filing deadline — all in one step.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input className="input-field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                  <input className="input-field" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <label className="text-xs text-slate-500 -mb-2">Effective date</label>
                  <input className="input-field" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button className="btn-primary justify-center" type="submit" disabled={loading}>
                    {loading ? 'Preparing appointment pack…' : 'Appoint director'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">✓ {result.person.name} appointed</h2>
                  <p className="text-sm text-slate-500">
                    Filing task created:{' '}
                    <Link href={`/tasks/${result.task.id}`} className="text-teal-700 font-medium hover:underline" onClick={handleClose}>
                      {result.task.title}
                    </Link>
                    {result.task.due_date && ` — due ${result.task.due_date}`}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <DownloadTextButton filename={`${result.person.name}-director-appointment-pack.txt`} content={result.document} />
                </div>
                <div className="max-h-[50vh] overflow-y-auto">
                  <DocumentPreview content={result.document} />
                </div>
                <button className="btn-secondary justify-center" onClick={handleClose}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
