'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isSupabaseConfigured()) {
    return (
      <Centered>
        <p className="text-sm text-slate-500">
          Supabase isn&apos;t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> to enable login.
        </p>
      </Centered>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Centered>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Sign in to Stivara</h1>
      <p className="text-sm text-slate-500 mb-6">Your corporate secretary, in software.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary justify-center" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        No account? <Link href="/signup" className="text-teal-700 font-medium">Create one</Link>
      </p>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm p-8">{children}</div>
    </div>
  )
}
