# Deploy

## Target

Vercel is the canonical deploy target for both WGU.tools reference apps. The plugin does not strictly enforce Vercel — any Node host that supports Next.js 15 SSR will work — but the env-var table, OAuth-callback URLs, and cron configuration below all assume Vercel conventions. If you use a different host, translate accordingly.

## `vercel.json`

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/vercel.json -->
```json
{
  "crons": [
    {
      "path": "/api/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This file registers one cron job: Vercel invokes `GET /api/health-check` every 5 minutes. When the cron fires, Vercel injects an `Authorization: Bearer <CRON_SECRET>` header so the route can reject requests that didn't originate from Vercel. There are no other Vercel-specific settings here; routing, rewrites, and build configuration all defer to Next.js defaults.

## `next.config.ts`

Full contents are documented in [stack.md](./stack.md). Two settings are deploy-relevant:

- **`experimental.serverActions.bodySizeLimit: '4mb'`** — raises the Server Actions body limit above the Next.js default of 1 MB. Avatar uploads use a multipart form that would otherwise exceed the default. If your deploy platform enforces its own request-size limit (e.g., a reverse proxy with a 1 MB cap), you must raise that limit as well.
- **`headers()`** — attaches security headers (`HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) to every route. These are response headers only; no platform-level configuration is required.

No `serverExternalPackages` settings are present; all dependencies bundle normally.

## Required env vars

| Name | Scope | Source | Missing behavior |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase dashboard → Project Settings → API | Supabase client fails to instantiate; auth and all data calls throw at startup |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Supabase dashboard → Project Settings → API | Supabase client fails to instantiate; auth and all data calls throw at startup |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase dashboard → Project Settings → API | Any route that bypasses RLS (health-check, track, admin writes) returns 500 |
| `AUTH_COOKIE_DOMAIN` | Server only (optional) | Vercel project settings | Auth cookie scopes to the current host; cross-subdomain SSO does not work. See `getSafeCookieDomain` in [auth.md](./auth.md) |
| `SMARTSHEET_API_TOKEN` | Server only | Smartsheet → Account → Personal Settings → API Access | Master-roster reads return 401; any feature that pulls partner or enrollment data from Smartsheet breaks |
| `CRON_SECRET` | Server only | Vercel project settings | `/api/health-check` accepts all requests without validating the caller; if absent the route treats every call as authorized (see `authorized()` logic in the route) |

## `/api/health-check` contract

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/app/api/health-check/route.ts -->
```ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { APPS } from '@/lib/apps'

/**
 * Cron-triggered health monitor. Pings every app in APPS in parallel with
 * a hard 4s timeout. Classifies the result and appends a row to
 * public.app_health in Supabase.
 *
 * Schedule via vercel.json — Vercel injects an Authorization header with
 * the CRON_SECRET env var so we can reject unauthenticated callers.
 *
 *   up        — 2xx/3xx response within 2.5s
 *   degraded  — 2xx/3xx but >2.5s
 *   down      — non-2xx/3xx, fetch error, or timeout
 *
 * Apps with `status: 'local'` in apps.ts are skipped — they don't have a
 * public URL yet, so probing them would be noise.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 4_000
const DEGRADED_AT_MS = 2_500

type CheckResult = {
  app_slug: string
  status: 'up' | 'degraded' | 'down'
  status_code: number | null
  latency_ms: number
  error: string | null
}

async function probe(app_slug: string, url: string): Promise<CheckResult> {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'wgu-tools-health-monitor/1.0' },
      signal: controller.signal,
      cache: 'no-store',
    })
    const latency = Date.now() - started
    const ok = (res.status >= 200 && res.status < 400)
    const status: CheckResult['status'] = !ok
      ? 'down'
      : latency > DEGRADED_AT_MS
        ? 'degraded'
        : 'up'
    return {
      app_slug,
      status,
      status_code: res.status,
      latency_ms: latency,
      error: ok ? null : `HTTP ${res.status}`,
    }
  } catch (err) {
    const latency = Date.now() - started
    return {
      app_slug,
      status: 'down',
      status_code: null,
      latency_ms: latency,
      error: err instanceof Error ? err.message.slice(0, 200) : 'unknown error',
    }
  } finally {
    clearTimeout(timer)
  }
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.get('authorization')
  return header === `Bearer ${secret}`
}

async function runChecks(): Promise<CheckResult[]> {
  const targets = APPS.filter((a) => a.status !== 'local')
  return Promise.all(targets.map((a) => probe(a.id, a.url)))
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const results = await runChecks()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const rows = results.map((r) => ({
    app_slug: r.app_slug,
    status: r.status,
    status_code: r.status_code,
    latency_ms: r.latency_ms,
    error: r.error,
  }))

  const { error } = await supabase.from('app_health').insert(rows)
  if (error) {
    console.error('[health-check] insert failed:', error)
    return NextResponse.json(
      { ok: false, error: error.message, results },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, results, checked_at: new Date().toISOString() })
}
```

This route is the app's uptime monitor. On each invocation it probes every non-local app in the `APPS` registry in parallel, enforcing a 4-second hard timeout per request and classifying responses as `up` (2xx/3xx within 2.5s), `degraded` (2xx/3xx but slow), or `down` (error or timeout). Results are written to the `app_health` Supabase table via the service-role client. The `authorized()` helper checks `Authorization: Bearer <CRON_SECRET>` — if `CRON_SECRET` is unset the check is skipped and all callers are accepted, so setting this var in production is strongly recommended.

## `/api/track` contract

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/app/api/track/route.ts -->
```ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Usage event sink. Every WGU.tools app posts here via /track.js — once
 * on page view, every 30s as a heartbeat, and once on page unload.
 * Writes go through the service-role Supabase client so RLS is bypassed.
 *
 * CORS is wide-open because the script is loaded cross-subdomain on
 * every wgu.tools app. The endpoint is unauthenticated — anyone who
 * knows the URL can fire events. That's acceptable for internal usage
 * telemetry: an attacker could spam events but can't read anything
 * back, and even spammed events are quickly filtered out of the admin
 * dashboard by date range / known-user matching.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const VALID_TYPES = new Set(['view', 'heartbeat', 'unload'])

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string
      name?: string | null
      app?: string
      path?: string
      type?: string
      session?: string
      duration_ms?: number | null
    }

    const email = body.email?.toLowerCase().trim()
    const app = body.app?.trim()
    const type = body.type?.trim()
    const sessionId = body.session?.trim()
    const path = body.path?.slice(0, 1024) ?? '/'
    if (!email || !app || !sessionId || !type || !VALID_TYPES.has(type)) {
      return new NextResponse(null, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    await supabase.from('usage_events').insert({
      user_email: email,
      user_name: body.name ?? null,
      app_slug: app,
      path,
      event_type: type,
      session_id: sessionId,
      duration_ms:
        typeof body.duration_ms === 'number' && body.duration_ms > 0 && body.duration_ms < 5 * 60 * 1000
          ? Math.round(body.duration_ms)
          : null,
    })

    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  } catch (err) {
    console.error('[track] failed:', err)
    return new NextResponse(null, { status: 400, headers: CORS_HEADERS })
  }
}
```

This is the usage-event sink for the entire WGU.tools platform. Every app posts `view`, `heartbeat`, and `unload` events to this endpoint via the `UsageTracker` component (documented in [archetypes-launcher.md](./archetypes-launcher.md)). The endpoint is unauthenticated and CORS-open so it can accept cross-subdomain requests; it uses the service-role Supabase client to write directly to `usage_events` bypassing RLS. The call is fire-and-forget from the client side.

## Deploy gates

Run these commands in order before every deploy. A failure at any step means the build must not be promoted.

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

- `pnpm install` — ensures the lockfile is satisfied and no phantom packages sneak through; fails if `pnpm-lock.yaml` is out of sync with `package.json`.
- `pnpm typecheck` — runs `tsc --noEmit`; confirms there are no TypeScript errors that Next.js's dev server may have silently swallowed.
- `pnpm lint` — runs ESLint with the project's Next.js ruleset; catches unused imports, accessibility violations, and style drift before they land.
- `pnpm build` — runs `next build`; confirms SSR pages can be compiled and static output is valid. This is the definitive gate — if it passes, Vercel's build will pass.

## Google OAuth client setup

These steps must be completed manually in external dashboards; the plugin does not automate them.

- Create an OAuth 2.0 client in Google Cloud Console (Application type: **Web application**).
- Under **Authorized JavaScript origins**, add `https://<vercel-prod-url>`, `https://<vercel-preview-url>`, and `http://localhost:3000`.
- Under **Authorized redirect URIs**, add `https://<supabase-project>.supabase.co/auth/v1/callback`.
- Copy the Client ID and Client Secret into the Supabase dashboard → **Authentication** → **Providers** → **Google**.
- In Supabase Auth settings, set the email domain allowlist to `@wgu.edu` to restrict sign-in to WGU accounts.

## Monorepo note

If the new app lives inside a larger monorepo, set Vercel's **Root Directory** to the app subfolder before the first deploy. Vercel reads `vercel.json`, `next.config.ts`, and `package.json` relative to that root. If the app is a standalone repo, leave Root Directory at its default.

## `.env.local.example`

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/.env.local.example -->
```sh
# Supabase project — share with the rest of the wgu-tools subdomain apps
# so a single Google sign-in covers everything.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Note: this example only includes the two public Supabase vars. The remaining vars (`SUPABASE_SERVICE_ROLE_KEY`, `AUTH_COOKIE_DOMAIN`, `SMARTSHEET_API_TOKEN`, `CRON_SECRET`) must be added to `.env.local` manually and should never be committed to source.

---

See also: [stack.md](./stack.md) for the pinned versions Vercel builds against, [auth.md](./auth.md) for the OAuth callback setup and `AUTH_COOKIE_DOMAIN` safe-fallback, [data-layer.md](./data-layer.md) for the per-data-source env vars.
