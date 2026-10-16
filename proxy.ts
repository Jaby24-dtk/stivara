import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_OPTIONS } from './lib/supabase/config'

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured = supabaseUrl.length > 0 && !supabaseUrl.includes('your-project-ref')

  // Skip auth protection when Supabase isn't connected yet
  if (!configured) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — critical for token rotation
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login'
  const isRoot = pathname === '/'
  const isPublicPage = pathname === '/trust'
  const isApiRoute = pathname.startsWith('/api/')
  // The STIV SSO bridge lands here unauthenticated — it establishes the
  // session client-side via setSession() using tokens minted by STIV, so it
  // must be reachable before a session cookie exists.
  const isSsoBridge = pathname === '/sso'

  // Two-step sign-in is required for everyone: a password-only (aal1)
  // session can't use the app or its API. No factor yet → set one up at
  // /mfa; factor on file → enter the code there. (Read from the JWT, no
  // network call.)
  const isMfaPage = pathname === '/mfa'
  if (user && !isMfaPage && !isSsoBridge && !isPublicPage) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel !== 'aal2') {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Two-step verification required' }, { status: 401 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/mfa'
      url.search = ''
      if (!isAuthPage && !isRoot) url.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }
  if (!user && isMfaPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // API routes handle their own auth (401 JSON) — never redirect them to a page
  if (isApiRoute) return response

  // Redirect unauthenticated users to /login
  if (!user && !isAuthPage && !isRoot && !isPublicPage && !isSsoBridge && !isMfaPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
