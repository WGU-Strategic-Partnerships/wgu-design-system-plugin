'use client'

import { ArrowRight } from 'lucide-react'
import { APPS, type AppCategory } from '@/lib/apps'
import { useLauncher } from './AppLauncher'

/**
 * Per-category accent color used for the left stripe and corner glow on
 * the featured tile. The tile itself stays on a solid navy background so
 * white body text reads cleanly regardless of category.
 */
const CATEGORY_ACCENT_HEX: Record<AppCategory, string> = {
  Executive:    '#F2A900', // amber
  Leadership:   '#7B61FF', // violet
  'Ops Team':   '#46B1EF', // bright blue
  'Field Team': '#97E152', // lime
}

/**
 * Large bento-corner "pick up where you left off" tile. Reads
 * `recents` from the launcher context and renders the most recent
 * app on a category-tinted gradient with a glow accent in the upper
 * right. Falls back to a neutral "Get started" tile when there are
 * no recents yet.
 */
export function FeaturedAppTile({
  fallbackApp,
}: {
  /** App to feature when the visitor has no recents yet. Should be
   *  an app the user has access to (typically the first visible). */
  fallbackApp: { id: string; name: string; description: string; url: string; category: AppCategory }
}) {
  const { recents, recordVisit, visibleApps } = useLauncher()

  // Find the most-recent app the user STILL has access to. If their
  // last app was removed from their access, skip it.
  const recent = recents.find((id) => visibleApps.has(id))
  const app = recent ? APPS.find((a) => a.id === recent) ?? fallbackApp : fallbackApp
  const isPickup = !!recent

  const accent = CATEGORY_ACCENT_HEX[app.category]

  return (
    <a
      className="bento-featured"
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordVisit(app.id)}
      style={{ '--featured-accent': accent } as React.CSSProperties}
    >
      <div className="bento-featured-glow" aria-hidden />
      <div className="bento-featured-content">
        <p className="bento-eyebrow">
          {isPickup ? 'Pick up where you left off' : 'Start here'} · {app.category}
        </p>
        <h2 className="bento-featured-name">{app.name}</h2>
        <p className="bento-featured-desc">{app.description}</p>
      </div>
      <span className="bento-cta">
        Open {app.name}
        <ArrowRight size={16} />
      </span>
    </a>
  )
}
