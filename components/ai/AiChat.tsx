'use client'

import { useState } from 'react'
import type { Company } from '@/lib/types'

type Message = { role: 'user' | 'assistant'; content: string }

export function AiChat({ companies }: { companies: Company[] }) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !companyId) return
    setError(null)
    const question = query
    setMessages((m) => [...m, { role: 'user', content: question }])
    setQuery('')
    setLoading(true)

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, query: question }),
    })
    const body = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(body.error ?? 'Something went wrong')
      return
    }
    setMessages((m) => [...m, { role: 'assistant', content: body.answer }])
  }

  if (companies.length === 0) {
    return <p className="text-sm text-slate-500">Add a company first to use the AI Assistant.</p>
  }

  return (
    <div className="card p-6 flex flex-col gap-4 flex-1">
      <select className="input-field max-w-xs" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[300px]">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Ask something like &quot;when is our next AGM due?&quot;</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm p-3 rounded-lg max-w-2xl ${m.role === 'user' ? 'bg-slate-100 self-end' : 'bg-teal-50 self-start'}`}>
            {m.content}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input-field"
          placeholder="Ask the AI Company Secretary…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>
    </div>
  )
}
