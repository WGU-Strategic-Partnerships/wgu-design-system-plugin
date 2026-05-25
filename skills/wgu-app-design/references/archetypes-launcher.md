# Archetype: launcher

## When to choose launcher

Use the launcher archetype when a team owns three or more small, distinct tools that share the same audience and the same Google SSO. Rather than giving users separate bookmarks, the launcher is a single portal — one door — that aggregates every tool. Each tool is a separate Vercel deployment; the launcher's job is to present them, enforce per-user visibility, and provide navigation shortcuts (chip row, ⌘K palette). WGU.tools is the canonical example: it hosts a growing catalog of SP tools — from Weekly Tactical to Portfolio Calculator — behind one `@wgu.edu` sign-in.

## Decision rule

Ask the user: "Do you have 3+ small tools to consolidate, or are you building one focused tool?" 3+ small = launcher; one focused = [deep app](./archetypes-deep-app.md).

## Home page anatomy

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/app/page.tsx -->

```tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { APPS } from '@/lib/apps'
import { getLatestHealth } from '@/lib/health'
import { AppShell } from '@/components/AppShell'
import { LauncherProvider } from '@/components/AppLauncher'
import { HomeBento } from '@/components/HomeBento'
import { CommandPalette } from '@/components/CommandPalette'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.isMember) redirect('/no-access')

  const firstName = user.name?.split(' ')[0] ?? null
  const visibleApps = user.isAdmin
    ? APPS
    : APPS.filter((a) => user.accessibleApps.has(a.id as never))
  const healthByApp = await getLatestHealth()

  return (
    <AppShell user={user}>
      <LauncherProvider
        accessibleApps={Array.from(user.accessibleApps)}
        showAll={user.isAdmin}
        healthByApp={healthByApp}
      >
        <main className="page page-wide">
          <HomeBento
            firstName={firstName}
            userFullName={user.name}
            currentEmail={user.email}
            visibleApps={visibleApps}
            healthByApp={healthByApp}
          />

          <CommandPalette visibleApps={visibleApps} />
        </main>

        <footer className="footer">
          <div className="footer-inner">
            <span>&copy; {new Date().getFullYear()} WGU Strategic Partnership Operations.</span>
            <span>One door for every WGU tool.</span>
          </div>
        </footer>
      </LauncherProvider>
    </AppShell>
  )
}
```

Bento layout (what `HomeBento` actually renders — greeting + status, then bento section, then chip row, then personal activity):

```
┌── greeting block (h1 + system-status pulse) ─────────────────────────────┐
│  Good morning, Bentley.   ● all 12 tools operational                      │
└───────────────────────────────────────────────────────────────────────────┘
┌── FeaturedAppTile (bento-featured) ──┐  ┌── StatusCard ─┐  ┌── StatusCard ─┐
│                                       │  │ (priority 1)  │  │ (priority 2)  │
│  Pick up where you left off · Exec   │  └───────────────┘  └───────────────┘
│  Portfolio Calculator                 │  ┌── StatusCard ─┐  ┌── StatusCard ─┐
│  Classify partner accounts…          │  │ (priority 3)  │  │ (priority 4)  │
│  Open Portfolio Calculator →         │  └───────────────┘  └───────────────┘
└───────────────────────────────────────┘
┌── "All tools" heading + ⌘K hint ─────────────────────────────────────────┐
│  chip  chip  chip  chip  chip  (AppChipRow — 5 across)                   │
└───────────────────────────────────────────────────────────────────────────┘
┌── PersonalActivity ───────────────────────────────────────────────────────┐
│  Your recent activity                                                      │
│  ● Portfolio Calculator · opened   2m ago                                  │
│  ● Weekly Tactical · opened        1h ago                                  │
└───────────────────────────────────────────────────────────────────────────┘
```

The `bento` CSS class uses `bento-cards-{n}` (n = min(cards, 4)) to adapt the grid when fewer than 4 status cards are available.

## `HomeBento.tsx`

Two-column bento grid that composes the home page's panels: greeting/status header, featured tile + status cards, chip row, and personal activity strip.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/HomeBento.tsx -->

```tsx
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
 * Composes the new home-page layout:
 *   - greeting + one-line system status
 *   - bento: large featured tile + up to 4 status cards (right 2x2)
 *   - "All tools" chip row of every app the user can see
 *   - "Your recent activity" (personal only — team activity moved to
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
  // Server-rendered, picks a time-of-day greeting from the server's
  // local clock. Close enough for our team's working hours.
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
```

## `AppChipRow.tsx`

Horizontal grid (5 across on desktop) of every app the signed-in user can access. Hidden apps are excluded even when granted. Clicking a chip records the visit in `LauncherContext` and opens the app in a new tab.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/AppChipRow.tsx -->

```tsx
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

  // Hidden apps (e.g. Hiring Studio) are excluded from the directory
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
```

## `FeaturedAppTile.tsx`

Hero tile that occupies the large left cell of the bento. On first visit it shows a "Start here" tile for the first visible app; after any navigation it shows "Pick up where you left off" for the most recently visited app the user still has access to. Category accent drives the gradient and corner glow.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/FeaturedAppTile.tsx -->

```tsx
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
```

## `CommandPalette.tsx`

⌘K / Ctrl+K modal overlay for jumping to any visible app by name, description, or category. Bound at the app root so it works from any page. Launcher-only — deep apps do not include a command palette.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/CommandPalette.tsx -->

```tsx
'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { type AppTile } from '@/lib/apps'
import { CATEGORY_ACCENT } from './AppLauncher'

type Item = {
  id: string
  label: string
  hint: string
  group: string
  accent: string
  onSelect: () => void
}

/**
 * ⌘K / Ctrl+K command palette. Modal overlay with a search input, a
 * filtered list of jump-to-app actions, and keyboard navigation.
 * Renders globally — bound at the app root so it works on any page.
 */
export function CommandPalette({ visibleApps }: { visibleApps: readonly AppTile[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
        setActive(0)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const items = useMemo<Item[]>(
    () =>
      visibleApps.map((app) => ({
        id: app.id,
        label: app.name,
        hint: app.description,
        group: app.category,
        accent: CATEGORY_ACCENT[app.category],
        onSelect: () => {
          window.open(app.url, '_blank', 'noopener,noreferrer')
        },
      })),
    [visibleApps],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.hint.toLowerCase().includes(q) ||
        it.group.toLowerCase().includes(q),
    )
  }, [items, query])

  const onQueryChange = useCallback((next: string) => {
    setQuery(next)
    setActive(0)
  }, [])

  const close = useCallback(() => setOpen(false), [])
  const select = useCallback(
    (i: number) => {
      const item = filtered[i]
      if (item) {
        item.onSelect()
        close()
      }
    },
    [filtered, close],
  )

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(active)
    }
  }

  if (!open) return null

  return (
    <div className="cmdk-overlay" onClick={close}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()} onKeyDown={onListKey}>
        <div className="cmdk-input-row">
          <Search size={16} color="var(--fg-3)" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Jump to a tool…"
            className="cmdk-input"
            aria-label="Command palette"
          />
          <button type="button" className="cmdk-close" aria-label="Close" onClick={close}>
            <X size={14} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="cmdk-empty">No matches for &ldquo;{query}&rdquo;.</div>
        ) : (
          <ul className="cmdk-list" role="listbox">
            {filtered.map((item, i) => (
              <li
                key={item.id}
                role="option"
                aria-selected={i === active}
                className={`cmdk-item ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(i)}
              >
                <span className="cmdk-item-dot" style={{ background: item.accent }} aria-hidden />
                <div className="cmdk-item-text">
                  <div className="cmdk-item-label">{item.label}</div>
                  <div className="cmdk-item-hint">{item.hint}</div>
                </div>
                <span className="cmdk-item-group">{item.group}</span>
                <ArrowRight size={14} className="cmdk-item-arrow" />
              </li>
            ))}
          </ul>
        )}

        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to open</span>
          <span><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}
```

## `UsageTracker.tsx`

Client-side helper injected into every WGU sub-app that sets `window.__wgu_tools_ctx` and lazy-loads `https://wgu.tools/track.js`. The script wires `pushState`/`popstate` listeners so all SPA navigations are captured automatically; it only needs to be loaded once per session. The events feed the `/admin/usage` dashboard.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/UsageTracker.tsx -->

```tsx
'use client'

import { useEffect } from 'react'

/**
 * Drops the WGU.tools usage tracker into every WGU app. Sets the
 * window context so /track.js knows who and which app, then injects
 * the script tag if it isn't already on the page. Client component so
 * it works inside both server- and client-rendered headers.
 *
 * The track.js script itself wires up popstate / pushState listeners,
 * so it only needs to load once per session — SPA navigations are
 * picked up automatically.
 */
export function UsageTracker({
  app,
  email,
  name,
}: {
  app: string
  email: string | null | undefined
  name: string | null | undefined
}) {
  useEffect(() => {
    if (!email) return
    ;(window as unknown as { __wgu_tools_ctx?: object }).__wgu_tools_ctx = {
      app,
      email,
      name: name ?? null,
    }
    const SRC = 'https://wgu.tools/track.js'
    if (document.querySelector(`script[src="${SRC}"]`)) return
    const s = document.createElement('script')
    s.src = SRC
    s.async = true
    document.head.appendChild(s)
  }, [app, email, name])

  return null
}
```

## `AppLauncher.tsx`

React context provider (`LauncherProvider`) that holds the client-side launcher state: the set of visible app IDs, favorites and recents (both persisted in `localStorage`), visit recording, and latest health data. Also exports `CATEGORY_ACCENT`, `TILE_ICON`, `useLauncher`, `SearchBar`, `AppSections`, and the `Tile` sub-component that renders each app card in the full-directory view.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/AppLauncher.tsx -->

```tsx
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Cpu,
  FileText,
  GraduationCap,
  LayoutTemplate,
  PieChart,
  Search,
  SearchX,
  Star,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'

export const TILE_ICON: Record<string, LucideIcon> = {
  'cpu': Cpu,
  'users': Users,
  'calendar-check': CalendarCheck,
  'bar-chart-3': BarChart3,
  'pie-chart': PieChart,
  'ticket': Ticket,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'layout-template': LayoutTemplate,
  'book-open': BookOpen,
}
import { APPS, CATEGORY_ORDER, type AppCategory, type AppTile } from '@/lib/apps'
import type { AppHealth } from '@/lib/health'

const STORAGE_KEYS = {
  favorites: 'wgu.tools.favorites.v1',
  recents:   'wgu.tools.recents.v1',
}
const MAX_RECENTS = 4

export const CATEGORY_ACCENT: Record<AppCategory, string> = {
  Executive:   'var(--cat-executive)',
  Leadership:  'var(--cat-leadership)',
  'Ops Team':  'var(--cat-ops-team)',
  'Field Team': 'var(--cat-field-team)',
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent('wgu-tools:storage', { detail: { key } }))
  } catch { /* quota exceeded — silent */ }
}

function useLocalArray(key: string): [string[], (next: string[]) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    const onStorage = (e: StorageEvent) => { if (e.key === key) onChange() }
    const onLocal = (e: Event) => {
      const ev = e as CustomEvent<{ key: string }>
      if (ev.detail?.key === key) onChange()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('wgu-tools:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('wgu-tools:storage', onLocal as EventListener)
    }
  }, [key])

  const getSnapshot = useCallback((): string => {
    if (typeof window === 'undefined') return '[]'
    return window.localStorage.getItem(key) ?? '[]'
  }, [key])
  const getServerSnapshot = useCallback((): string => '[]', [])

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const value = useMemo<string[]>(() => {
    try { return JSON.parse(raw) as string[] } catch { return [] }
  }, [raw])

  const setValue = useCallback((next: string[]) => saveJSON(key, next), [key])
  return [value, setValue]
}

type LauncherState = {
  query: string
  setQuery: (q: string) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  recents: string[]
  recordVisit: (id: string) => void
  /** App IDs the signed-in user is allowed to see. */
  visibleApps: ReadonlySet<string>
  /** Latest health probe per app, keyed by slug. Empty until cron runs. */
  healthByApp: Readonly<Record<string, AppHealth>>
}

const LauncherContext = createContext<LauncherState | null>(null)

export function useLauncher(): LauncherState {
  const ctx = useContext(LauncherContext)
  if (!ctx) throw new Error('useLauncher must be used inside <LauncherProvider>')
  return ctx
}

export function LauncherProvider({
  children,
  accessibleApps,
  showAll = false,
  healthByApp = {},
}: {
  children: ReactNode
  /** App IDs the user has been granted. Ignored when showAll is true. */
  accessibleApps: readonly string[]
  /** Admins see every tile regardless of grants. */
  showAll?: boolean
  /** Latest health row per app slug (server-fetched). */
  healthByApp?: Readonly<Record<string, AppHealth>>
}) {
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useLocalArray(STORAGE_KEYS.favorites)
  const [recents, setRecents] = useLocalArray(STORAGE_KEYS.recents)

  const visibleApps = useMemo(
    () => (showAll ? new Set(APPS.map((a) => a.id)) : new Set(accessibleApps)),
    [accessibleApps, showAll],
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement
      const inField = active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
      if (e.key === '/' && !inField) {
        e.preventDefault()
        const input = document.getElementById('search-input') as HTMLInputElement | null
        input?.focus()
        input?.select()
      }
      if (e.key === 'Escape' && active?.id === 'search-input') setQuery('')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites(favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id])
    },
    [favorites, setFavorites],
  )

  const recordVisit = useCallback(
    (id: string) => {
      setRecents([id, ...recents.filter((x) => x !== id)].slice(0, MAX_RECENTS))
    },
    [recents, setRecents],
  )

  const value = useMemo<LauncherState>(
    () => ({ query, setQuery, favorites, toggleFavorite, recents, recordVisit, visibleApps, healthByApp }),
    [query, favorites, toggleFavorite, recents, recordVisit, visibleApps, healthByApp],
  )

  return <LauncherContext.Provider value={value}>{children}</LauncherContext.Provider>
}

export function SearchBar() {
  const { query, setQuery } = useLauncher()
  return (
    <div
      role="search"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-surface)',
        border: '1px solid var(--rule-strong-1)',
        borderRadius: 'var(--radius-pill)',
        padding: '10px 16px 10px 14px',
        boxShadow: 'var(--shadow-sm)',
        maxWidth: 560,
        transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      }}
    >
      <Search size={16} color="var(--fg-3)" aria-hidden />
      <input
        id="search-input"
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search tools (try 'tickets' or 'rubric')…"
        aria-label="Search tools"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 0,
          outline: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--fg-1)',
        }}
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery('')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 999,
            background: 'var(--bg-muted)',
            color: 'var(--fg-2)',
          }}
        >
          <X size={14} />
        </button>
      ) : (
        <span
          style={{
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--bg-muted)',
            color: 'var(--fg-3)',
            border: '1px solid var(--rule-strong-1)',
            lineHeight: 1.4,
          }}
        >
          /
        </span>
      )}
    </div>
  )
}

type TileHealth = {
  /** Class suffix for .tile-status-dot--{live|degraded|down|local|beta} */
  dotKind: 'live' | 'degraded' | 'down' | 'local' | 'beta'
  label: string
  /** Optional tooltip text — surfaced as a title attribute */
  detail: string | null
}

function resolveTileHealth(app: AppTile, health: AppHealth | undefined): TileHealth {
  if (app.status === 'local') return { dotKind: 'local', label: 'Local', detail: null }
  if (app.status === 'beta') return { dotKind: 'beta', label: 'Beta', detail: null }

  if (!health) return { dotKind: 'live', label: 'Live', detail: 'No check yet' }

  const ago = relativeTime(new Date(health.checked_at))
  const latency = `${health.latency_ms}ms`
  if (health.status === 'up') {
    return { dotKind: 'live', label: 'Live', detail: `${latency} · checked ${ago}` }
  }
  if (health.status === 'degraded') {
    return { dotKind: 'degraded', label: 'Slow', detail: `${latency} · checked ${ago}` }
  }
  return {
    dotKind: 'down',
    label: 'Down',
    detail: `${health.error ?? 'unreachable'} · checked ${ago}`,
  }
}

function relativeTime(d: Date): string {
  const secs = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function AppSections() {
  const { query, favorites, toggleFavorite, recents, recordVisit, visibleApps, healthByApp } = useLauncher()

  const visible = useMemo(() => APPS.filter((a) => visibleApps.has(a.id)), [visibleApps])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return visible
    return visible.filter((app) =>
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q),
    )
  }, [query, visible])

  const favSet = useMemo(() => new Set(favorites), [favorites])

  if (!visible.length) {
    return (
      <div className="empty-state">
        <h2 className="empty-state-title">No tools yet</h2>
        <p className="empty-state-body">
          You don&rsquo;t have access to any tools in WGU.tools yet. Reach out to
          Bentley to request access.
        </p>
      </div>
    )
  }

  const favApps = filtered.filter((a) => favSet.has(a.id))
  const recentApps = recents
    .map((id) => filtered.find((a) => a.id === id))
    .filter((a): a is AppTile => !!a && !favSet.has(a.id))
  const groupedApps = CATEGORY_ORDER.map((category) => ({
    category,
    apps: filtered.filter(
      (a) => a.category === category && !favSet.has(a.id) && !recentApps.includes(a),
    ),
  })).filter((g) => g.apps.length)

  if (query && !filtered.length) {
    return (
      <div className="empty-state">
        <SearchX size={28} color="var(--fg-3)" aria-hidden />
        <h2 className="empty-state-title">No tools match &quot;{query}&quot;</h2>
        <p className="empty-state-body">
          Try a different keyword, or clear the search to see everything.
        </p>
      </div>
    )
  }

  return (
    <>
      <Section
        title="Favorites"
        accent="var(--cat-favorites)"
        apps={favApps}
        favSet={favSet}
        onFavorite={toggleFavorite}
        onVisit={recordVisit}
        healthByApp={healthByApp}
      />
      <Section
        title="Recently opened"
        accent="var(--cat-recent)"
        apps={recentApps}
        favSet={favSet}
        onFavorite={toggleFavorite}
        onVisit={recordVisit}
        healthByApp={healthByApp}
      />
      {groupedApps.map(({ category, apps }) => (
        <Section
          key={category}
          title={category}
          accent={CATEGORY_ACCENT[category]}
          apps={apps}
          favSet={favSet}
          onFavorite={toggleFavorite}
          onVisit={recordVisit}
          healthByApp={healthByApp}
        />
      ))}
    </>
  )
}

type SectionProps = {
  title: string
  accent: string
  apps: readonly AppTile[]
  favSet: Set<string>
  onFavorite: (id: string) => void
  onVisit: (id: string) => void
  healthByApp: Readonly<Record<string, AppHealth>>
}

function Section({ title, accent, apps, favSet, onFavorite, onVisit, healthByApp }: SectionProps) {
  if (!apps.length) return null
  return (
    <section className="section">
      <div className="section-head" style={{ '--section-accent': accent } as React.CSSProperties}>
        <h2 className="section-title">
          <span className="section-bar" aria-hidden />
          {title}
        </h2>
        <span className="section-count">
          {apps.length} {apps.length === 1 ? 'tool' : 'tools'}
        </span>
      </div>
      <div className="grid">
        {apps.map((app) => (
          <Tile
            key={app.id}
            app={app}
            accent={accent}
            isFav={favSet.has(app.id)}
            onFavorite={onFavorite}
            onVisit={onVisit}
            health={healthByApp[app.id]}
          />
        ))}
      </div>
    </section>
  )
}

function Tile({
  app,
  accent,
  isFav,
  onFavorite,
  onVisit,
  health,
}: {
  app: AppTile
  accent: string
  isFav: boolean
  onFavorite: (id: string) => void
  onVisit: (id: string) => void
  health?: AppHealth
}) {
  const Icon = TILE_ICON[app.icon] ?? Cpu
  const tileAccent = CATEGORY_ACCENT[app.category] ?? accent
  const tileHealth = resolveTileHealth(app, health)
  return (
    <a
      className="card card-tappable tile"
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onVisit(app.id)}
      style={{ '--tile-accent': tileAccent } as React.CSSProperties}
    >
      <button
        type="button"
        className={`tile-fav ${isFav ? 'is-on' : ''}`}
        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFav}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onFavorite(app.id)
        }}
      >
        <Star size={16} />
      </button>

      <div className="tile-icon-circle" aria-hidden>
        <Icon size={20} />
      </div>

      <div className="tile-content">
        <p className="tile-eyebrow">{app.category}</p>
        <h3 className="tile-name">{app.name}</h3>
        <p className="tile-desc">{app.description}</p>

        <div className="tile-footer">
          <span
            className="tile-status-line"
            title={tileHealth.detail ?? undefined}
          >
            <span className={`tile-status-dot tile-status-dot--${tileHealth.dotKind}`} />
            <span className="tile-status-text">{tileHealth.label}</span>
          </span>
          <span className="tile-open">
            Open
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </a>
  )
}
```

## `PersonalActivity.tsx`

Server component that fetches the last 120 usage events, filters to the signed-in user's `view` events, collapses same-app navigations within 10 minutes, and renders up to 6 recent entries as a timestamped list. Team-wide activity lives on `/admin/usage`.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/PersonalActivity.tsx -->

```tsx
import 'server-only'
import { Clock } from 'lucide-react'
import { APPS } from '@/lib/apps'
import { CATEGORY_ACCENT } from './AppLauncher'
import { getRecentEvents } from '@/lib/usage'

/**
 * "Your recent activity" strip on the home page. Filtered to the
 * signed-in user only — the team-wide activity stream lives on
 * /admin/usage now.
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
```

## App registry: `lib/apps.ts`

Source of truth for what apps exist. Each `AppTile` carries an `id` (slug), `name`, `url`, `description`, `category`, `icon`, `status`, and optional `hidden` flag. Per-app access is gated by `user.accessibleApps: Set<AppSlug>` on `CurrentUser` (see [auth.md](./auth.md)); admins bypass the check and see everything. The exported `APPS` array is pre-sorted by `CATEGORY_ORDER` so every consumer (chip row, admin grid, command palette) renders apps in the same grouping automatically.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/lib/apps.ts -->

```ts
export type AppStatus = 'live' | 'local' | 'beta'
export type AppCategory = 'Executive' | 'Leadership' | 'Ops Team' | 'Field Team'

export type AppTile = {
  id: string
  name: string
  url: string
  description: string
  category: AppCategory
  /** Any lucide-react icon name, e.g. 'cpu', 'users'. */
  icon: string
  status: AppStatus
  /** Hidden apps never appear in role defaults and are filtered out
   *  of the public app directory. They still show up in the admin grid
   *  so explicit grants can be issued. */
  hidden?: boolean
}

export const CATEGORY_ORDER: readonly AppCategory[] = [
  'Executive',
  'Leadership',
  'Ops Team',
  'Field Team',
]

/**
 * Raw app list. Source order doesn't matter — the public `APPS` export
 * sorts these by CATEGORY_ORDER so every consumer (chip row, admin
 * grid, command palette, header dropdowns) renders apps grouped
 * consistently.
 */
const RAW_APPS: readonly AppTile[] = [
  {
    id: 'hiring',
    name: 'Hiring Studio',
    url: 'https://hiring-studio.vercel.app',
    description: 'Candidate intake, rubric scoring, and interview transcript analysis.',
    category: 'Ops Team',
    icon: 'users',
    status: 'live',
    hidden: true,
  },
  {
    id: 'ai-strategy',
    name: 'AI Strategy Tracker',
    url: 'https://ai-strategy-tracker.vercel.app',
    description: 'Action items, owners, and status for the AI Strategy meeting.',
    category: 'Executive',
    icon: 'cpu',
    status: 'live',
  },
  {
    id: 'weekly',
    name: 'Weekly Tactical',
    url: 'https://weekly-tactical-mu.vercel.app',
    description: 'Agenda, action items, facilitator rotation, and anonymous kudos.',
    category: 'Ops Team',
    icon: 'calendar-check',
    status: 'live',
  },
  {
    id: 'mbr',
    name: 'MBR Builder',
    url: 'https://mbr-builder.vercel.app',
    description: 'Manager Monthly Business Review portal for PSM, PE, and Pod roles.',
    category: 'Leadership',
    icon: 'bar-chart-3',
    status: 'live',
  },
  {
    id: 'portfolio',
    name: 'Portfolio Calculator',
    url: 'https://portfolio-calculator-six.vercel.app',
    description: 'Classify partner accounts into AP, GP, MP, WP and project FY27 targets.',
    category: 'Executive',
    icon: 'pie-chart',
    status: 'live',
  },
  {
    id: 'tickets',
    name: 'Ops Support Tickets',
    url: 'https://wgu-ticket-portal.vercel.app',
    description: 'Customer-facing portal for Partnership Ops support tickets.',
    category: 'Field Team',
    icon: 'ticket',
    status: 'live',
  },
  {
    id: 'sop',
    name: 'SOP Builder',
    url: 'https://sop-builder.vercel.app',
    description: 'Author Standard Operating Procedures that render to Word and agent markdown.',
    category: 'Ops Team',
    icon: 'file-text',
    status: 'live',
  },
  {
    id: 'data-quality',
    name: 'Data Quality',
    url: 'https://wgu-dq-webapp.vercel.app',
    description: 'Salesforce data quality detection + apply agent. Author rules, triage findings, approve fixes with sandbox-first safety.',
    category: 'Ops Team',
    icon: 'shield-check',
    status: 'live',
  },
  {
    id: 'field-training',
    name: 'Field Training',
    url: 'https://wgu-field-training.vercel.app',
    description: 'Claude-powered Q&A over WGU Program Charters and Kits for field reps.',
    category: 'Field Team',
    icon: 'graduation-cap',
    status: 'live',
  },
  {
    id: 'templates',
    name: 'Template Builder',
    url: 'https://postcard-builder.vercel.app',
    description: 'Self-service branded postcards, flyers, and ABRs for partner events.',
    category: 'Field Team',
    icon: 'layout-template',
    status: 'live',
  },
  {
    id: 'rewired',
    name: 'Rewired Leadership',
    url: 'https://rewired-leadership.vercel.app',
    description: 'Leadership training on the Rewired playbook for Strategic Partnerships.',
    category: 'Executive',
    icon: 'book-open',
    status: 'live',
  },
  {
    id: 'portfolio-docs',
    name: 'Portfolio Automation Docs',
    url: 'https://portfolio-automation-docs.vercel.app',
    description: 'Reference docs for the four-quadrant portfolio classification system in Salesforce.',
    category: 'Ops Team',
    icon: 'library',
    status: 'live',
  },
  {
    id: 'sf-building-projects',
    name: 'Salesforce Building Projects',
    url: 'https://eda-removal-tracker.vercel.app',
    description: 'Source of truth for every sandbox build ready for release to sage. Tracks phases, components, deploy plans, and status.',
    category: 'Ops Team',
    icon: 'cloud-cog',
    status: 'live',
  },
  {
    id: 'sp-claude-training',
    name: 'Claude Training',
    url: 'https://sp-claude-training.vercel.app',
    description: 'Self-paced training on Claude for Strategic Partnerships. Leadership and Ops tracks across 17 modules.',
    category: 'Field Team',
    icon: 'graduation-cap',
    status: 'live',
  },
]

/**
 * Apps sorted by CATEGORY_ORDER. Stable within each category, so within
 * a category they keep their order from RAW_APPS above. Every UI that
 * iterates APPS gets the same grouping automatically — changing an
 * app's category re-orders it on the next deploy without any other
 * code change.
 */
export const APPS: readonly AppTile[] = [...RAW_APPS].sort((a, b) => {
  return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
})

/**
 * Lucide icon name per category. Used in the header dropdown trigger and
 * other category-flagged UI.
 */
export const CATEGORY_ICON: Record<AppCategory, string> = {
  Executive:   'briefcase',
  Leadership:  'crown',
  'Ops Team':  'wrench',
  'Field Team': 'compass',
}

/**
 * Roles assignable to a member from the admin page. Determines that
 * member's default app access; the admin can still customize per-app
 * checkboxes after the role is applied.
 */
export const MEMBER_ROLES = ['Admin', 'Director', 'Manager', 'Ops Team', 'SPM'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

/** Categories a given role gets default access to. Hidden apps are
 *  never in any role's defaults — they're admin-grant only.
 *
 *  Note: Field Team (SPM) gets every category by default. The Field Team
 *  is the broadest user base and Bentley wants them defaulted into every
 *  tool. Per-app removal can still be done from the admin grid. */
const ROLE_CATEGORIES: Record<MemberRole, ReadonlySet<AppCategory>> = {
  Admin:      new Set<AppCategory>(['Executive', 'Leadership', 'Ops Team', 'Field Team']),
  Director:   new Set<AppCategory>(['Executive', 'Leadership', 'Field Team']),
  Manager:    new Set<AppCategory>(['Leadership', 'Field Team']),
  'Ops Team': new Set<AppCategory>(['Ops Team', 'Field Team']),
  SPM:        new Set<AppCategory>(['Executive', 'Leadership', 'Ops Team', 'Field Team']),
}

/**
 * Compute the set of app slugs a role gets by default. Used to
 * pre-populate the admin checkbox grid when a member's role is set
 * or changed. Hidden apps are always excluded.
 */
export function getDefaultAccessForRole(role: MemberRole): Set<string> {
  const allowed = ROLE_CATEGORIES[role]
  const result = new Set<string>()
  for (const app of APPS) {
    if (app.hidden) continue
    if (allowed.has(app.category)) result.add(app.id)
  }
  return result
}
```

## Dashboard cards: `lib/dashboard-cards.ts`

Drives the up-to-4 status cards in the bento right column. Each `CandidateCard` is tied to a required app slug (skipped if the user lacks access), a priority, and an async fetcher that returns a `DashboardCard` or `null`. Today most fetchers use deterministic mock data; each has a `TODO` comment naming the exact Smartsheet sheet and column to wire in for real.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/lib/dashboard-cards.ts -->

```ts
import 'server-only'
import type { AppSlug } from './sheets'
import {
  readCell,
  readContactEmails,
  smartsheetFetch,
  type SheetGetResponse,
} from './smartsheet'

// ----- Source-sheet column IDs (mirrored from each app's own
//       smartsheet-types.ts; kept local so wgu-tools doesn't
//       depend on the other repos at build time) -----

const TICKETS = {
  sheetIdEnv: 'SMARTSHEET_TICKETS_SHEET_ID',
  AssignedTo: 1244878484049796,
  Status: 6874378018262916,
  /** Status values considered "closed" for this card. */
  CLOSED: new Set(['Completed', 'Cancelled']),
} as const

const WEEKLY_ITEMS = {
  sheetIdEnv: 'SMARTSHEET_WEEKLY_ITEMS_SHEET_ID',
  Owner: 5217716301762436,
  Status: 714116674391940,
  TargetDate: 1840016581234564,
  DONE: 'Done',
} as const

/**
 * Status cards for the home-page bento. Each card is personal — it
 * shows work waiting on the signed-in user. The home page picks up to
 * 4 cards in priority order, filtered to apps the user can access. A
 * user with access to fewer source apps simply sees fewer cards; the
 * bento grid adapts.
 *
 * Today the fetchers return personal-aware MOCK data so the structure
 * and design can be evaluated without each app's Smartsheet schema
 * being plumbed in. Every fetcher has a TODO comment naming the exact
 * sheet + column it should query when wired for real.
 */

export type CardTone = 'pos' | 'amber' | 'neg'

export type DashboardCard = {
  /** Stable key for React. */
  key: string
  /** Source app — used to inherit category accent + href + access. */
  appSlug: AppSlug
  /** Lucide icon. */
  icon: 'users' | 'ticket' | 'calendar-check' | 'pie-chart' | 'check-square' | 'bar-chart-3' | 'file-text'
  /** Big headline ("3", "Wed 9 AM", "Due Friday"). */
  primary: string
  /** Subtitle copy. */
  meta: string
  /** Optional urgency callout that renders inline with the meta. */
  highlight?: { text: string; tone: CardTone }
  /** Optional href override (defaults to the source app's URL). */
  href?: string
}

type CardContext = {
  userEmail: string
  /** Display name from auth metadata. Used as a fallback match for
   *  sheets that store assignees as a name instead of an email. */
  userName: string | null
  accessibleAppIds: ReadonlySet<string>
}

type CandidateCard = {
  /** Required app the user must be able to access for this card to show. */
  requiresApp: AppSlug
  /** Higher = more important; we keep the top 4. */
  priority: number
  /** Returns the card data, or null when there's nothing meaningful to show. */
  fetch: (ctx: CardContext) => Promise<DashboardCard | null>
}

/**
 * Top-level: returns up to 4 cards the signed-in user should see, in
 * priority order. Cards drop out when the user lacks access to the
 * source app or when the fetcher returns null (e.g., empty zero-state
 * we'd rather hide).
 */
export async function getDashboardCards(ctx: CardContext): Promise<DashboardCard[]> {
  const eligible = CANDIDATES.filter((c) => ctx.accessibleAppIds.has(c.requiresApp))

  const results = await Promise.all(
    eligible.map(async (c) => ({
      priority: c.priority,
      card: await c.fetch(ctx).catch((err) => {
        console.error(`[dashboard-cards] ${c.requiresApp} fetcher failed:`, err)
        return null
      }),
    })),
  )

  return results
    .filter((r): r is { priority: number; card: DashboardCard } => r.card !== null)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((r) => r.card)
}

// ============================================================================
// Candidate cards. Each fetcher takes the current user and returns the
// card or null. Mock data today; replace per the TODO inside each.
// ============================================================================

const CANDIDATES: CandidateCard[] = [
  // ----- Tickets assigned to me -------------------------------------------
  {
    requiresApp: 'tickets',
    priority: 100,
    async fetch({ userEmail, userName }) {
      const sheetId = process.env[TICKETS.sheetIdEnv]
      if (!sheetId) return null

      const sheet = await smartsheetFetch<SheetGetResponse>(`/sheets/${sheetId}`)

      // AssignedTo is a plain text column on this sheet, populated with
      // either an email or a display name. Match both ways, case-insensitive.
      const candidates = [userEmail.toLowerCase()]
      if (userName) candidates.push(userName.toLowerCase().trim())

      const mine = sheet.rows.filter((row) => {
        const status = readCell(row, TICKETS.Status)
        if (status && TICKETS.CLOSED.has(status)) return false
        const assignedTo = readCell(row, TICKETS.AssignedTo)?.toLowerCase().trim()
        if (!assignedTo) return false
        return candidates.some((c) => c && assignedTo.includes(c))
      })

      const open = mine.length
      if (open === 0) {
        return {
          key: 'tickets',
          appSlug: 'tickets',
          icon: 'ticket',
          primary: 'Clear',
          meta: 'no tickets assigned to you',
        }
      }
      return {
        key: 'tickets',
        appSlug: 'tickets',
        icon: 'ticket',
        primary: String(open),
        meta: open === 1 ? 'ticket assigned to you' : 'tickets assigned to you',
      }
    },
  },

  // ----- My action items (AI Strategy + Weekly Tactical combined) ---------
  // We render two separate candidate cards (one per source) so users with
  // access to only one app still get a focused card. The bento picks the
  // top 4 across all candidates so users with both end up with two action
  // cards, which is fine — they're distinct workstreams.
  {
    requiresApp: 'weekly',
    priority: 90,
    async fetch({ userEmail }) {
      const sheetId = process.env[WEEKLY_ITEMS.sheetIdEnv]
      if (!sheetId) return null

      const sheet = await smartsheetFetch<SheetGetResponse>(`/sheets/${sheetId}`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayMs = today.getTime()

      let open = 0
      let overdue = 0
      for (const row of sheet.rows) {
        const status = readCell(row, WEEKLY_ITEMS.Status)
        if (status === WEEKLY_ITEMS.DONE) continue
        const owners = readContactEmails(row, WEEKLY_ITEMS.Owner)
        if (!owners.includes(userEmail.toLowerCase())) continue
        open += 1
        const target = readCell(row, WEEKLY_ITEMS.TargetDate)
        if (target) {
          const t = new Date(target).getTime()
          if (!Number.isNaN(t) && t < todayMs) overdue += 1
        }
      }

      if (open === 0) return null // hide rather than render an empty row

      return {
        key: 'weekly-items',
        appSlug: 'weekly',
        icon: 'check-square',
        primary: String(open),
        meta: open === 1 ? 'tactical action item' : 'tactical action items',
        highlight: overdue > 0
          ? { text: `${overdue} overdue`, tone: 'neg' }
          : undefined,
      }
    },
  },

  {
    requiresApp: 'ai-strategy',
    priority: 85,
    async fetch({ userEmail }) {
      // TODO: query AI Strategy Action Items sheet
      // (env: SMARTSHEET_AI_STRATEGY_ITEMS_SHEET_ID). Same shape as
      // Weekly Tactical — filter by Owner == userEmail and Status != Done.
      const open = mockCount(userEmail, 'ai-items', 0, 4)
      if (open === 0) return null

      return {
        key: 'ai-items',
        appSlug: 'ai-strategy',
        icon: 'check-square',
        primary: String(open),
        meta: open === 1 ? 'AI Strategy action item' : 'AI Strategy action items',
      }
    },
  },

  // ----- Next meeting + agenda -------------------------------------------
  {
    requiresApp: 'weekly',
    priority: 80,
    async fetch() {
      // TODO: query Weekly Tactical Meetings sheet
      // (env: SMARTSHEET_WEEKLY_MEETINGS_SHEET_ID). Find row where Date is
      // the next upcoming. Pull the agenda count via the related Action
      // Items sheet, scoped to "next meeting" rows.
      const next = nextWeeklyMockMeeting()
      return {
        key: 'weekly-meeting',
        appSlug: 'weekly',
        icon: 'calendar-check',
        primary: next.label,
        meta: `${next.agendaCount} on the agenda`,
        href: 'https://tactical.wgu.tools/agenda',
      }
    },
  },

  // ----- This month's MBR -------------------------------------------------
  {
    requiresApp: 'mbr',
    priority: 70,
    async fetch({ userEmail }) {
      // TODO: query the MBR Submissions sheet
      // (env: SMARTSHEET_MBR_SUBMISSIONS_SHEET_ID). Find the row where
      // Manager Email == userEmail and Month == current month. Return
      // status (Not started / Draft / Submitted) and due date.
      const state = mockMbrState(userEmail)
      const toneMap: Record<typeof state.status, CardTone | undefined> = {
        'Not started': 'amber',
        'Draft': 'amber',
        'Submitted': 'pos',
      }
      return {
        key: 'mbr-this-month',
        appSlug: 'mbr',
        icon: 'bar-chart-3',
        primary: state.status,
        meta: state.detail,
        highlight: state.status !== 'Submitted'
          ? { text: state.dueLabel, tone: toneMap[state.status] ?? 'amber' }
          : undefined,
      }
    },
  },

  // ----- Portfolio: my verticals (for directors) -------------------------
  {
    requiresApp: 'portfolio',
    priority: 60,
    async fetch() {
      // TODO: read Portfolio Members for this user's Vertical Assignments,
      // then query the Accounts sheet, filter by partner type ∈ verticals,
      // count rows where Projected Target > Volume Trigger.
      return {
        key: 'portfolio',
        appSlug: 'portfolio',
        icon: 'pie-chart',
        primary: 'FY27',
        meta: '12 accounts above target in your verticals',
      }
    },
  },

  // ----- Hiring: candidates in panel (mostly relevant for Bentley) -------
  {
    requiresApp: 'hiring',
    priority: 50,
    async fetch() {
      // TODO: query HS - Applications. Count Stage == Panel.
      return {
        key: 'hiring',
        appSlug: 'hiring',
        icon: 'users',
        primary: '3',
        meta: 'candidates in panel stage',
      }
    },
  },
]

// ============================================================================
// Mock helpers — replace each callsite with the real Smartsheet query.
// ============================================================================

/** Deterministic per-user "count" so different testers see different numbers
 *  without us needing real data plumbed in. Same email → same number. */
function mockCount(email: string, salt: string, min: number, max: number): number {
  let h = 0
  for (const c of `${email}|${salt}`) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return min + (h % (max - min + 1))
}

function nextWeeklyMockMeeting(): { label: string; agendaCount: number } {
  // TODO: pull from Weekly Tactical Meetings sheet.
  const now = new Date()
  const daysUntilWed = (3 - now.getDay() + 7) % 7 || 7
  const next = new Date(now)
  next.setDate(now.getDate() + daysUntilWed)
  const weekday = next.toLocaleDateString('en-US', { weekday: 'short' })
  return { label: `${weekday} 9 AM`, agendaCount: 4 }
}

type MbrState = {
  status: 'Not started' | 'Draft' | 'Submitted'
  detail: string
  dueLabel: string
}

function mockMbrState(email: string): MbrState {
  // TODO: real status from MBR Submissions sheet.
  const r = mockCount(email, 'mbr', 0, 2)
  if (r === 0) return { status: 'Not started', detail: 'this month's review', dueLabel: 'due Friday' }
  if (r === 1) return { status: 'Draft',       detail: 'saved 2 hours ago',       dueLabel: 'due Friday' }
  return                  { status: 'Submitted', detail: 'reviewed by leadership', dueLabel: '' }
}
```

## Admin pages

- `/admin/page.tsx` — admin landing; renders `AdminClient` with the full member roster, per-app access checkboxes, and a role-selector dropdown. Gated to `isAdmin` users.
- `/admin/usage/page.tsx` — team-wide usage dashboard fed by the `UsageTracker` events stored in Supabase; accessible via a "View usage" link on the admin landing.

Note: there is no separate `/admin/admins/` route. The `Is Admin` flag and per-app grants are managed from the single `/admin` matrix page.

## Sub-app contract

Each app in the WGU.tools catalog is a fully independent Vercel deployment — it is not a sub-route inside WGU.tools. The launcher controls visibility only: non-admin users see the chip and the featured tile only for apps where `user.accessibleApps.has(appId)` is true (gated server-side in `src/app/page.tsx`). Once the user clicks through, they land on the external app's own domain. That external app handles its own auth (same Google SSO, same `@wgu.edu` restriction) and its own `AppShell` — see [app-shell.md](./app-shell.md) for the shell convention. The `UsageTracker` component, embedded in each sub-app's `AppShell`, pings back to `https://wgu.tools/track.js` so the admin usage dashboard has cross-app visibility.

---

See also: [app-shell.md](./app-shell.md), [auth.md](./auth.md) for the `accessibleApps` gating, [archetypes-deep-app.md](./archetypes-deep-app.md) for the alternative archetype, [design-primitives.md](./design-primitives.md) for the UI primitives composed here.
