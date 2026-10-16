'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode =
  | { kind: 'loading' }
  | { kind: 'verify'; factorId: string }
  | { kind: 'enroll'; factorId: string; qr: string; secret: string }
  | { kind: 'error'; message: string }

// Second sign-in step. Everyone needs an authenticator-app code: people with
// no factor yet scan a QR code once; after that they type the 6-digit code.
function MfaStep() {
  const router = useRouter()
  const params = useSearchParams()
  const nextParam = params.get('next') || '/dashboard'
  const nextUrl = /^\/(?![\/\\])/.test(nextParam) ? nextParam : '/dashboard'

  const [mode, setMode] = useState<Mode>({ kind: 'loading' })
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // enroll once, even under StrictMode's double effect
    started.current = true
    const supabase = createClient()
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) return setMode({ kind: 'error', message: error.message })
      const verified = data.totp.find((f) => f.status === 'verified')
      if (verified) return setMode({ kind: 'verify', factorId: verified.id })

      // Clear any half-finished setup (QR shown but never confirmed) before starting fresh.
      for (const f of data.all.filter((f) => f.status === 'unverified')) {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
      const enrolled = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Stivara',
        friendlyName: 'Authenticator app',
      })
      if (enrolled.error) return setMode({ kind: 'error', message: enrolled.error.message })
      setMode({ kind: 'enroll', factorId: enrolled.data.id, qr: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret })
    })()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (mode.kind !== 'verify' && mode.kind !== 'enroll') return
    setBusy(true)
    setError(null)
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: mode.factorId, code: code.replace(/\s/g, '') })
    if (error) {
      setBusy(false)
      setError("That code didn't work. Check the time on your phone and try the newest code.")
      return
    }
    // Full page load, not router.replace: the client router has cached the
    // pre-2FA redirect (dashboard → /mfa) and would bounce straight back here.
    window.location.assign(nextUrl)
  }

  async function signOut() {
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="card w-full max-w-md p-6 sm:p-7">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Two-step sign-in</h1>
      <p className="text-sm text-slate-500 mb-4">Stivara needs a code from your phone as well as your password.</p>

      {mode.kind === 'loading' && <p className="text-sm text-slate-500">Loading…</p>}
      {mode.kind === 'error' && <p className="text-sm text-red-600">{mode.message}</p>}

      {mode.kind === 'enroll' && (
        <div className="mb-4 space-y-3 text-sm">
          <p className="font-semibold text-slate-900">Set up two-step sign-in (one time)</p>
          <div className="flex flex-wrap items-center gap-4">
            <ol className="list-decimal space-y-1 pl-5 text-[13px] text-slate-500 flex-1 min-w-[170px]">
              <li>Open an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password…).</li>
              <li>Scan this QR code.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mode.qr} alt="QR code for your authenticator app" className="mx-auto h-36 w-36 shrink-0 rounded-lg bg-white p-1.5" />
          </div>
          <details className="text-[12px] text-slate-500">
            <summary className="cursor-pointer font-semibold text-teal-700">Setup key (for manual entry, or for STIV&apos;s saved login)</summary>
            <code className="mt-1 block break-all rounded bg-slate-100 px-2 py-1 font-mono text-slate-900">{mode.secret}</code>
          </details>
        </div>
      )}

      {mode.kind === 'verify' && <p className="mb-4 text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>}

      {(mode.kind === 'enroll' || mode.kind === 'verify') && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            className="input-field text-center font-mono text-lg tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-primary justify-center" type="submit" disabled={busy}>
            {busy ? 'Checking…' : mode.kind === 'enroll' ? 'Turn on and continue' : 'Verify'}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Lost your phone? Ask an admin to reset your two-step login.{' '}
        <button onClick={signOut} className="font-medium text-teal-700">Sign out</button>
      </p>
    </div>
  )
}

export default function MfaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-6">
      <Suspense fallback={null}>
        <MfaStep />
      </Suspense>
    </div>
  )
}
