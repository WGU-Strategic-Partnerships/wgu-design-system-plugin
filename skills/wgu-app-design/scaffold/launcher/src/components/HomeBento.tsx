import 'server-only'
import { APPS, type AppTile } from '@/lib/apps'
import { getDashboardCards } from '@/lib/dashboard-cards'
import type { AppHealth } from '@/lib/health'
import { FeaturedAppTile } from './FeaturedAppTile'
import { StatusCard } from './StatusCard'
import { AppChipRow } from './AppChipRow'
import { PersonalActivity } from './PersonalActivity'

const EMPTY_CARDS_LINE = 'No items waiting on you. Use the chips below or ⌘K to jump in.'

/**
 * Composes the home-page layout:
 *   - greeting + one-line system status
 *   - bento: large featured tile + up to 4 status cards (right 2x2)
 *   - "All tools" chip row of every app the user can see
 *   - "Your recent activity" (personal only — team activity is on
 *     /admin/usage)
 */
export async function HomeBento({
  firstName,
  userFullName,
  currentEmail,
  visibleApps,
  healthByApp,
}: {
  firstName: string | null
  /** Full display name used as a fallback match for ticket assignees
   *  on sheets that store the assignee as a name, not an email. */
  userFullName: string | null
  currentEmail: string
  visibleApps: readonly AppTile[]
  healthByApp: Readonly<Record<string, AppHealth>>
}) {
  const visibleIds = new Set(visibleApps.map((a) => a.id))
  const cards = await getDashboardCards({
    userEmail: currentEmail.toLowerCase(),
    userName: userFullName,
    accessibleAppIds: visibleIds,
  })

  const fallbackApp = visibleApps[0] ?? APPS[0]

  const health = summarizeHealth(visibleApps, healthByApp)

  return (
    <>
      <header className="bento-greeting-block">
        <h1 className="bento-greeting">
          <Greeting name={firstName} />
        </h1>
        <p className="bento-greeting-meta">
          <span className={`bento-pulse bento-pulse--${health.tone}`} aria-hidden />
          {health.label}
        </p>
      </header>

      <section
        className={`bento bento-cards-${Math.min(cards.length, 4)}`}
        aria-label="Workspace"
      >
        <FeaturedAppTile fallbackApp={fallbackApp} />
        {cards.length === 0 ? (
          <div className="bento-empty">{EMPTY_CARDS_LINE}</div>
        ) : (
          cards.map((card) => <StatusCard key={card.key} card={card} />)
        )}
      </section>

      <div className="section-head">
        <h2 className="section-title">
          <span className="section-bar" aria-hidden />
          All tools
        </h2>
        <span className="section-action-hint">
          <kbd>⌘</kbd><kbd>K</kbd> to jump
        </span>
      </div>
      <AppChipRow />

      <PersonalActivity currentEmail={currentEmail} />
    </>
  )
}

function Greeting({ name }: { name: string | null }) {
  // Server-rendered, picks a time-of-day greeting from the server's local clock.
  const hour = new Date().getHours()
  const phrase =
    hour < 5  ? 'Burning the late shift' :
    hour < 12 ? 'Good morning' :
    hour < 18 ? 'Good afternoon' :
                'Good evening'
  return (
    <>
      <span className="bento-greeting-leading">{phrase}</span>
      {name && (
        <>
          {', '}
          <span className="bento-greeting-name">{name}</span>
        </>
      )}
      <span className="bento-greeting-dot">.</span>
    </>
  )
}

function summarizeHealth(
  visible: readonly AppTile[],
  healthByApp: Readonly<Record<string, AppHealth>>,
): { label: string; tone: 'pos' | 'amber' | 'neg' } {
  const probed = visible.filter((a) => a.status !== 'local')
  const total = probed.length
  if (!total) return { label: `${visible.length} tools available`, tone: 'pos' }

  let down = 0
  let degraded = 0
  for (const a of probed) {
    const h = healthByApp[a.id]
    if (!h) continue
    if (h.status === 'down') down += 1
    else if (h.status === 'degraded') degraded += 1
  }

  if (down > 0) {
    return {
      label: `${down} of ${total} tools degraded or down`,
      tone: 'neg',
    }
  }
  if (degraded > 0) {
    return {
      label: `${total} tools online · ${degraded} running slow`,
      tone: 'amber',
    }
  }
  return { label: `all ${total} tools operational`, tone: 'pos' }
}
