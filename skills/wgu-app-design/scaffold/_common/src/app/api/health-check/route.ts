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
