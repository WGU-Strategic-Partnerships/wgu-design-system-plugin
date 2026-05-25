import { createClient } from '@supabase/supabase-js'

export type HealthStatus = 'up' | 'degraded' | 'down'

export type AppHealth = {
  app_slug: string
  status: HealthStatus
  status_code: number | null
  latency_ms: number
  error: string | null
  checked_at: string
}

export async function getLatestHealth(): Promise<Record<string, AppHealth>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {}
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('app_health')
    .select('app_slug, status, status_code, latency_ms, error, checked_at')
    .gte('checked_at', since)
    .order('checked_at', { ascending: false })
    .limit(500)
  if (error || !data) return {}
  const byApp: Record<string, AppHealth> = {}
  for (const row of data as AppHealth[]) {
    if (!byApp[row.app_slug]) byApp[row.app_slug] = row
  }
  return byApp
}
