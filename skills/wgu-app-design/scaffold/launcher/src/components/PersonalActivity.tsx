import 'server-only'
import { Clock } from 'lucide-react'
import { APPS } from '@/lib/apps'
import { CATEGORY_ACCENT } from './AppLauncher'
import { getRecentEvents } from '@/lib/usage'

/**
 * "Your recent activity" strip on the home page. Filtered to the
 * signed-in user only — the team-wide activity stream lives on
 * /admin/usage.
 */
export async function PersonalActivity({ currentEmail }: { currentEmail: string }) {
  const raw = await getRecentEvents(120)
  const events = raw.filter(
    (e) => e.event_type === 'view' && e.user_email === currentEmail.toLowerCase(),
  )

  // Collapse same-app navigations within 10 minutes.
  const items: typeof events = []
  for (const e of events) {
    const last = items[items.length - 1]
    if (
      last &&
      last.app_slug === e.app_slug &&
      new Date(last.created_at).getTime() - new Date(e.created_at).getTime() < 10 * 60_000
    ) {
      continue
    }
    items.push(e)
    if (items.length >= 6) break
  }

  if (!items.length) {
    return (
      <section className="personal-activity">
        <div className="section-head">
          <h2 className="section-title">
            <span className="section-bar" aria-hidden />
            Your recent activity
          </h2>
        </div>
        <p className="personal-activity-empty">
          Open any tool and it&rsquo;ll show up here so you can jump back in fast.
        </p>
      </section>
    )
  }

  const appById = new Map(APPS.map((a) => [a.id, a]))

  return (
    <section className="personal-activity">
      <div className="section-head">
        <h2 className="section-title">
          <span className="section-bar" aria-hidden />
          Your recent activity
        </h2>
      </div>
      <ol className="personal-activity-list">
        {items.map((e) => {
          const app = appById.get(e.app_slug)
          const accent = app ? CATEGORY_ACCENT[app.category] : 'var(--wgu-grey)'
          return (
            <li key={e.id} className="personal-activity-item">
              <span className="personal-activity-dot" style={{ background: accent }} aria-hidden />
              <a
                href={app?.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="personal-activity-link"
              >
                <span className="personal-activity-app">{app?.name ?? e.app_slug}</span>
                <span className="personal-activity-action"> · opened</span>
              </a>
              <span className="personal-activity-time">
                <Clock size={11} />
                {timeAgo(e.created_at)}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  if (ms < 60 * 60_000) return `${Math.round(ms / 60_000)}m ago`
  if (ms < 24 * 60 * 60_000) return `${Math.round(ms / (60 * 60_000))}h ago`
  return `${Math.round(ms / (24 * 60 * 60_000))}d ago`
}
