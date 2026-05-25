import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAllowedEmail } from '@/lib/auth'

/**
 * OAuth callback. Supabase redirects here after Google completes the OAuth
 * flow. We exchange the `code` for a session, verify the email is on an
 * @wgu.edu account, then redirect to the originating page (which may live
 * on a different wgu.tools subdomain — see the `auth_next` cookie set by
 * /login).
 *
 * Provider errors come back as ?error=...&error_description=... instead of
 * a code; we log the description and surface it on /login.
 */

function getSafeCookieDomain(host: string | null | undefined): string | undefined {
  const env = process.env.AUTH_COOKIE_DOMAIN
  if (!env || !host) return undefined
  const target = env.replace(/^\./, '').toLowerCase()
  const h = host.toLowerCase()
  return h === target || h.endsWith('.' + target) ? env : undefined
}

/**
 * Resolve the next destination into a safe absolute URL. Allows the
 * wgu.tools apex, any of its subdomains, the request's own origin, and
 * any *.vercel.app for preview deployments. Anything else falls back
 * to "/" so a tampered cookie can't be used as an open redirect.
 */
function resolveSafeNext(nextRaw: string | null, origin: string): URL {
  const fallback = new URL('/', origin)
  if (!nextRaw) return fallback
  let candidate: URL
  try {
    candidate = new URL(nextRaw, origin)
  } catch {
    return fallback
  }
  const host = candidate.host.toLowerCase()
  const ok =
    host === new URL(origin).host ||
    host === 'wgu.tools' ||
    host.endsWith('.wgu.tools') ||
    host.endsWith('.vercel.app')
  return ok ? candidate : fallback
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const providerError = url.searchParams.get('error')
  const providerErrorDescription = url.searchParams.get('error_description')

  if (providerError) {
    console.error('[oauth callback] provider error:', providerError, providerErrorDescription)
    const loginUrl = new URL('/login', url.origin)
    loginUrl.searchParams.set('error', 'oauth')
    if (providerErrorDescription) loginUrl.searchParams.set('detail', providerErrorDescription)
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth', url.origin))
  }

  const supabase = await createSupabaseServerClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('[oauth callback] exchange error:', exchangeError.message)
    const loginUrl = new URL('/login', url.origin)
    loginUrl.searchParams.set('error', 'exchange')
    loginUrl.searchParams.set('detail', exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!isAllowedEmail(user?.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=domain', url.origin))
  }

  // Read the originating URL from the auth_next cookie that /login set
  // before the OAuth round-trip; fall back to query param, then to "/".
  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('auth_next')?.value
  const queryNext = url.searchParams.get('next')
  const nextRaw = cookieNext ? decodeURIComponent(cookieNext) : queryNext

  const target = resolveSafeNext(nextRaw, url.origin)
  const response = NextResponse.redirect(target)
  // Clear the auth_next cookie now that we've used it.
  response.cookies.set('auth_next', '', {
    maxAge: 0,
    path: '/',
    domain: getSafeCookieDomain(url.host),
  })
  return response
}
