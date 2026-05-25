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
  ShieldCheck,
  Sparkles,
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
  'shield-check': ShieldCheck,
  'sparkles': Sparkles,
}
import { APPS, CATEGORY_ORDER, type AppCategory, type AppTile } from '@/lib/apps'
import type { AppHealth } from '@/lib/health'

// Replace '__app-name__' with your app's unique storage namespace.
const STORAGE_KEYS = {
  favorites: '__app-name__.favorites.v1',
  recents:   '__app-name__.recents.v1',
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
    window.dispatchEvent(new CustomEvent('launcher:storage', { detail: { key } }))
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
    window.addEventListener('launcher:storage', onLocal as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('launcher:storage', onLocal as EventListener)
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
        placeholder="Search tools…"
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
          You don&rsquo;t have access to any tools yet. Contact an admin to request access.
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
