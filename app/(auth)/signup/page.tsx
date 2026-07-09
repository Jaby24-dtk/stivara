'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState<'self_serve' | 'firm'>('self_serve')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isSupabaseConfigured()) {
    return (
      <Centered>
        <p className="text-sm text-slate-500">
          Supabase isn&apos;t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> to enable signup.
        </p>
      </Centered>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, organizationName, organizationType }),
    })
    const body = await res.json()
    if (!res.ok) {
      setLoading(false)
      setError(body.error ?? 'Signup failed')
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Centered>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Create your Stivara workspace</h1>
      <p className="text-sm text-slate-500 mb-6">For corporate secretarial firms and self-serve companies.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="input-field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <input className="input-field" placeholder="Organization name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
        <select className="input-field" value={organizationType} onChange={(e) => setOrganizationType(e.target.value as 'self_serve' | 'firm')}>
          <option value="self_serve">Self-serve company</option>
          <option value="firm">Corporate secretarial firm</option>
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary justify-center" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create workspace'}
        </button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Already have an account? <Link href="/login" className="text-teal-700 font-medium">Sign in</Link>
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
