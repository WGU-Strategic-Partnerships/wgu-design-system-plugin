import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

/**
 * Only apply AUTH_COOKIE_DOMAIN when the request's host actually falls
 * under it. When the app is served from a different host (e.g.
 * wgu-tools.vercel.app while AUTH_COOKIE_DOMAIN=.wgu.tools), setting
 * Domain to a non-matching host would cause browsers to silently drop
 * the cookie. Falling back to undefined makes the cookie scope to the
 * current host, which works in both environments.
 */
function getSafeCookieDomain(host: string | null | undefined): string | undefined {
  const env = process.env.AUTH_COOKIE_DOMAIN
  if (!env || !host) return undefined
  const target = env.replace(/^\./, '').toLowerCase()
  const h = host.toLowerCase()
  return h === target || h.endsWith('.' + target) ? env : undefined
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const h = await headers()
  const cookieDomain = getSafeCookieDomain(h.get('host'))

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, domain: cookieDomain }),
            )
          } catch {
            // setAll called from a Server Component — the proxy refreshes
            // the session cookie on the next request.
          }
        },
      },
    },
  )
}
