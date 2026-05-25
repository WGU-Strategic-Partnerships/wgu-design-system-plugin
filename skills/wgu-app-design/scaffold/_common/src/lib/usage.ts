import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Server-only helpers for reading usage_events. Uses the service-role
 * client because the table has RLS enabled and only the service role
 * is allowed to read it.
 */

let cached: ReturnType<typeof createClient> | null = null
function admin() {
  if (cached) return cached
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  return cached
}

export type UsageEvent = {
  id: number
  user_email: string
  user_name: string | null
  app_slug: string
  path: string
  event_type: 'view' | 'heartbeat' | 'unload'
  session_id: string
  duration_ms: number | null
  created_at: string
}

export type PerUserStats = {
  email: string
  name: string | null
  totalMs: number
  views: number
  sessions: number
  lastSeen: string | null
  perApp: Record<string, number> // app_slug -> ms
}

export type PerAppStats = {
  app: string
  totalMs: number
  views: number
  uniqueUsers: number
}

export async function getRecentEvents(limit = 50): Promise<UsageEvent[]> {
  const { data } = await admin()
    .from('usage_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as UsageEvent[]
}

/**
 * Roll up usage for the last `days` days (default 30) per user.
 */
export async function getPerUserStats(days = 30): Promise<PerUserStats[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin()
    .from('usage_events')
    .select('user_email, user_name, app_slug, event_type, session_id, duration_ms, created_at')
    .gte('created_at', since)
    .limit(50_000)

  const rows = (data ?? []) as Pick<UsageEvent,
    'user_email' | 'user_name' | 'app_slug' | 'event_type' | 'session_id' | 'duration_ms' | 'created_at'
  >[]
  const byEmail = new Map<string, PerUserStats>()
  for (const r of rows) {
    const key = r.user_email
    let s = byEmail.get(key)
    if (!s) {
      s = { email: key, name: r.user_name, totalMs: 0, views: 0, sessions: 0, lastSeen: null, perApp: {} }
      byEmail.set(key, s)
    }
    if (!s.name && r.user_name) s.name = r.user_name
    if (r.event_type === 'view') s.views += 1
    if ((r.event_type === 'heartbeat' || r.event_type === 'unload') && r.duration_ms) {
      s.totalMs += r.duration_ms
      s.perApp[r.app_slug] = (s.perApp[r.app_slug] ?? 0) + r.duration_ms
    }
    if (!s.lastSeen || r.created_at > s.lastSeen) s.lastSeen = r.created_at
  }
  // Count unique sessions per user via a second pass
  const sessionsByEmail = new Map<string, Set<string>>()
  for (const r of rows) {
    const set = sessionsByEmail.get(r.user_email) ?? new Set()
    set.add(r.session_id)
    sessionsByEmail.set(r.user_email, set)
  }
  for (const [email, set] of sessionsByEmail) {
    const s = byEmail.get(email)
    if (s) s.sessions = set.size
  }
  return Array.from(byEmail.values()).sort((a, b) => b.totalMs - a.totalMs)
}

export async function getPerAppStats(days = 30): Promise<PerAppStats[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin()
    .from('usage_events')
    .select('user_email, app_slug, event_type, duration_ms')
    .gte('created_at', since)
    .limit(50_000)
  const rows = (data ?? []) as Pick<UsageEvent, 'user_email' | 'app_slug' | 'event_type' | 'duration_ms'>[]
  const byApp = new Map<string, PerAppStats>()
  const usersByApp = new Map<string, Set<string>>()
  for (const r of rows) {
    let s = byApp.get(r.app_slug)
    if (!s) {
      s = { app: r.app_slug, totalMs: 0, views: 0, uniqueUsers: 0 }
      byApp.set(r.app_slug, s)
    }
    if (r.event_type === 'view') s.views += 1
    if ((r.event_type === 'heartbeat' || r.event_type === 'unload') && r.duration_ms) {
      s.totalMs += r.duration_ms
    }
    const set = usersByApp.get(r.app_slug) ?? new Set()
    set.add(r.user_email)
    usersByApp.set(r.app_slug, set)
  }
  for (const [app, set] of usersByApp) {
    const s = byApp.get(app)
    if (s) s.uniqueUsers = set.size
  }
  return Array.from(byApp.values()).sort((a, b) => b.totalMs - a.totalMs)
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`
}
