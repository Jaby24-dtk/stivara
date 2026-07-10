'use client'

import { useState } from 'react'

export function AiSuggestions({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)

  async function handleGenerate() {
    setError(null)
    setLoading(true)
    const res = await fetch('/api/ai/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    const body = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(body.error ?? 'Failed to generate suggestions')
      return
    }
    setSuggestions(body.suggestions)
  }

  return (
    <div className="card p-6" style={{ borderColor: '#FDE68A', borderWidth: 1.5 }}>
      <h2 className="text-lg font-bold text-slate-900 mb-1">AI Suggestions</h2>
      <p className="text-sm text-slate-500 mb-4">
        Discussion points generated from this company&apos;s real data — not verified facts, and not a recommendation to
        act. Review each one with a qualified professional before doing anything about it.
      </p>

      {!suggestions && (
        <button className="btn-secondary btn-sm" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate AI suggestions'}
        </button>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {suggestions && (
        <div>
          <div className="rounded-lg px-3 py-2 mb-3 text-xs font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>
            AI-generated — review with a professional before acting on any of these.
          </div>
          {suggestions.length === 0 ? (
            <p className="text-sm text-slate-500">No suggestions came back — try again.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {suggestions.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span style={{ color: '#B45309' }}>•</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
          <button className="btn-secondary btn-sm mt-4" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating…' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  )
}
