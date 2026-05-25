import Link from 'next/link'
import { ArrowLeft, Clock, Users, BarChart3 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'
import { APPS } from '@/lib/apps'
import { CATEGORY_ACCENT } from '@/components/AppLauncher'
import {
  formatDuration,
  getPerAppStats,
  getPerUserStats,
  getRecentEvents,
} from '@/lib/usage'

/**
 * Admin-only usage analytics. Reads from the usage_events table that
 * /api/track populates via tracker pings from every app in the launcher.
 *
 * Three rollups:
 *   - Per-user: total time, sessions, last seen.
 *   - Per-app: total time, unique users, view count.
 *   - Recent activity stream: last 50 raw events.
 */
export default async function UsageDashboard() {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) notFound()

  const [perUser, perApp, recent] = await Promise.all([
    getPerUserStats(30),
    getPerAppStats(30),
    getRecentEvents(40),
  ])

  const appById = new Map(APPS.map((a) => [a.id, a]))

  return (
    <AppShell user={user}>
      <main className="page page-wide">
        <Link
          href="/admin"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 16, paddingLeft: 8 }}
        >
          <ArrowLeft size={14} />
          <span>Back to admin</span>
        </Link>

        <p className="page-eyebrow">__APP_NAME__</p>
        <h1 className="page-title">Usage</h1>
        <p className="page-sub">
          Page views, time-on-page, and active sessions for every member across
          the toolset. Rolling 30-day window.
        </p>

        {/* Top stat cards */}
        <div className="usage-stat-row">
          <UsageStatCard icon={<Users size={18} />} label="Active members" value={perUser.length.toString()} />
          <UsageStatCard
            icon={<Clock size={18} />}
            label="Total time (30d)"
            value={formatDuration(perUser.reduce((a, b) => a + b.totalMs, 0))}
          />
          <UsageStatCard
            icon={<BarChart3 size={18} />}
            label="Page views (30d)"
            value={perUser.reduce((a, b) => a + b.views, 0).toString()}
          />
        </div>

        {/* Per-app rollup */}
        <section className="section">
          <div className="section-head" style={{ '--section-accent': 'var(--wgu-medium-blue)' } as React.CSSProperties}>
            <h2 className="section-title">
              <span className="section-bar" aria-hidden />
              By app
            </h2>
            <span className="section-count">{perApp.length} apps</span>
          </div>
          <div className="usage-table-wrap">
            <table className="usage-table">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Time spent</th>
                  <th>Page views</th>
                  <th>Unique users</th>
                </tr>
              </thead>
              <tbody>
                {perApp.length === 0 && (
                  <tr><td colSpan={4} className="usage-empty">No usage events yet. Sign in to a few apps and come back.</td></tr>
                )}
                {perApp.map((row) => {
                  const app = appById.get(row.app)
                  const accent = app ? CATEGORY_ACCENT[app.category] : 'var(--wgu-grey)'
                  return (
                    <tr key={row.app}>
                      <td>
                        <span className="usage-app-cell">
                          <span className="usage-app-bar" style={{ background: accent }} aria-hidden />
                          <span>{app?.name ?? row.app}</span>
                        </span>
                      </td>
                      <td className="usage-num">{formatDuration(row.totalMs)}</td>
                      <td className="usage-num">{row.views}</td>
                      <td className="usage-num">{row.uniqueUsers}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Per-user rollup */}
        <section className="section">
          <div className="section-head" style={{ '--section-accent': 'var(--wgu-sky-blue)' } as React.CSSProperties}>
            <h2 className="section-title">
              <span className="section-bar" aria-hidden />
              By member
            </h2>
            <span className="section-count">{perUser.length} active</span>
          </div>
          <div className="usage-table-wrap">
            <table className="usage-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Time spent</th>
                  <th>Page views</th>
                  <th>Sessions</th>
                  <th>Last seen</th>
                  <th>Most-used app</th>
                </tr>
              </thead>
              <tbody>
                {perUser.length === 0 && (
                  <tr><td colSpan={6} className="usage-empty">No member activity yet.</td></tr>
                )}
                {perUser.map((row) => {
                  const top = Object.entries(row.perApp).sort((a, b) => b[1] - a[1])[0]
                  const topApp = top ? appById.get(top[0])?.name ?? top[0] : '—'
                  return (
                    <tr key={row.email}>
                      <td>
                        <div className="usage-member-name">{row.name ?? row.email.split('@')[0]}</div>
                        <div className="usage-member-email">{row.email}</div>
                      </td>
                      <td className="usage-num">{formatDuration(row.totalMs)}</td>
                      <td className="usage-num">{row.views}</td>
                      <td className="usage-num">{row.sessions}</td>
                      <td className="usage-num">{row.lastSeen ? timeAgo(row.lastSeen) : '—'}</td>
                      <td>{topApp}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent activity */}
        <section className="section">
          <div className="section-head" style={{ '--section-accent': 'var(--wgu-lime)' } as React.CSSProperties}>
            <h2 className="section-title">
              <span className="section-bar" aria-hidden />
              Recent activity
            </h2>
            <span className="section-count">{recent.length}</span>
          </div>
          <div className="usage-table-wrap">
            <table className="usage-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>App</th>
                  <th>Path</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="usage-empty">No events yet.</td></tr>
                )}
                {recent.map((e) => {
                  const app = appById.get(e.app_slug)
                  return (
                    <tr key={e.id}>
                      <td className="usage-num">{timeAgo(e.created_at)}</td>
                      <td>{e.user_name ?? e.user_email.split('@')[0]}</td>
                      <td>{app?.name ?? e.app_slug}</td>
                      <td className="usage-mono">{e.path}</td>
                      <td>
                        <span className={`usage-pill usage-pill--${e.event_type}`}>{e.event_type}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

function UsageStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="usage-stat">
      <span className="usage-stat-icon">{icon}</span>
      <div>
        <div className="usage-stat-value">{value}</div>
        <div className="usage-stat-label">{label}</div>
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`
  if (ms < 60 * 60_000) return `${Math.round(ms / 60_000)}m ago`
  if (ms < 24 * 60 * 60_000) return `${Math.round(ms / (60 * 60_000))}h ago`
  return `${Math.round(ms / (24 * 60 * 60_000))}d ago`
}
