'use client'

import { useMemo } from 'react'
import { Cpu, type LucideIcon } from 'lucide-react'
import { APPS, type AppTile } from '@/lib/apps'
import { CATEGORY_ACCENT, TILE_ICON, useLauncher } from './AppLauncher'

/**
 * "All tools" grid — every app the signed-in user can see, laid out at
 * 5 across on desktop with the app's name + a one-line description.
 * Category accent is the left-edge stripe + category label color.
 * Click → record the visit and navigate.
 */
export function AppChipRow() {
  const { visibleApps, recordVisit } = useLauncher()

  // Hidden apps (e.g. internal tools) are excluded from the directory
  // even when granted — they show up only via the bento featured tile
  // if recently opened, or by typing the URL directly. The admin grid
  // still surfaces them so explicit grants can be issued.
  const visible = useMemo(
    () => APPS.filter((a) => visibleApps.has(a.id) && !a.hidden),
    [visibleApps],
  )

  if (!visible.length) return null

  return (
    <nav className="chip-row" aria-label="All tools">
      {visible.map((app) => (
        <AppChip key={app.id} app={app} onVisit={() => recordVisit(app.id)} />
      ))}
    </nav>
  )
}

function AppChip({ app, onVisit }: { app: AppTile; onVisit: () => void }) {
  const Icon: LucideIcon = TILE_ICON[app.icon] ?? Cpu
  const accent = CATEGORY_ACCENT[app.category]
  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onVisit}
      className="chip"
      style={{ '--chip-accent': accent } as React.CSSProperties}
    >
      <div className="chip-head">
        <span className="chip-icon" aria-hidden>
          <Icon size={18} />
        </span>
        <span className="chip-meta">{app.category}</span>
      </div>
      <div className="chip-name">{app.name}</div>
      <div className="chip-desc">{app.description}</div>
    </a>
  )
}
