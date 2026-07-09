'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadTextButton } from '@/components/documents/DownloadTextButton'

export function ResolutionGenerator({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter()
  const [request, setRequest] = useState('')
  const [draft, setDraft] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)
    const res = await fetch('/api/resolutions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, request }),
    })
    const body = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(body.error ?? 'Drafting failed')
      return
    }
    setDraft(body.draft)
  }

  async function handleSaveAsDocument() {
    if (!draft) return
    setSaving(true)
    const file = new File([draft], `resolution-draft-${Date.now()}.txt`, { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('companyId', companyId)
    const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <textarea
          className="input-field min-h-[80px]"
          placeholder={`e.g. "Appoint a new director" or "Approve opening a bank account with DBS"`}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary self-start" type="submit" disabled={loading}>
          {loading ? 'Drafting…' : 'Draft resolution'}
        </button>
      </form>

      {draft && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">
              Draft for {companyName} — review before use.
            </p>
            <div className="flex items-center gap-2">
              <DownloadTextButton filename="resolution-draft.txt" content={draft} />
              <button className="btn-secondary btn-sm" onClick={handleSaveAsDocument} disabled={saving || saved}>
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save as document'}
              </button>
            </div>
          </div>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-4 border border-slate-100">{draft}</pre>
        </div>
      )}
    </div>
  )
}
