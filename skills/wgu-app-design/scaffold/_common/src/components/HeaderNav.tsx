'use client'

import { useEffect, useState } from 'react'
import {
  Briefcase,
  ChevronDown,
  Compass,
  Crown,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { CATEGORY_ORDER, type AppCategory, type AppTile } from '@/lib/apps'
import { CATEGORY_ACCENT } from './AppLauncher'

const CATEGORY_ICON: Record<AppCategory, LucideIcon> = {
  Executive: Briefcase,
  Leadership: Crown,
  'Ops Team': Wrench,
  'Field Team': Compass,
}

/**
 * Three category dropdowns in the header. Each shows apps belonging to
 * the category, filtered to ones the signed-in user can actually reach
 * (so a non-admin doesn't see tiles they can't open).
 */
export function HeaderNav({ visibleApps }: { visibleApps: readonly AppTile[] }) {
  const [openCategory, setOpenCategory] = useState<AppCategory | null>(null)

  useEffect(() => {
    if (!openCategory) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenCategory(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openCategory])

  // Group apps by category — only render dropdowns with at least one app.
  const byCategory: Partial<Record<AppCategory, AppTile[]>> = {}
  for (const app of visibleApps) {
    if (!byCategory[app.category]) byCategory[app.category] = []
    byCategory[app.category]!.push(app)
  }

  const categories = CATEGORY_ORDER.filter((c) => byCategory[c]?.length)
  if (!categories.length) return null

  return (
    <nav aria-label="Categories" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {categories.map((cat) => (
        <CategoryDropdown
          key={cat}
          category={cat}
          apps={byCategory[cat] ?? []}
          open={openCategory === cat}
          onToggle={() => setOpenCategory((c) => (c === cat ? null : cat))}
          onClose={() => setOpenCategory(null)}
        />
      ))}
    </nav>
  )
}

function CategoryDropdown({
  category,
  apps,
  open,
  onToggle,
  onClose,
}: {
  category: AppCategory
  apps: readonly AppTile[]
  open: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const Icon = CATEGORY_ICON[category]
  const accent = CATEGORY_ACCENT[category]

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 10px',
          borderRadius: 'var(--radius-md)',
          background: open ? 'var(--bg-muted)' : 'transparent',
          color: open ? 'var(--wgu-blue)' : 'var(--fg-2)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: 13,
          transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
        }}
      >
        <Icon size={14} color={accent} />
        <span>{category}</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform var(--dur-fast) var(--ease-standard)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {open && (
        <>
          <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9 }}
            aria-hidden
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-monday-lg)',
              minWidth: 280,
              padding: 8,
              zIndex: 10,
              fontFamily: 'var(--font-body)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: accent,
                padding: '6px 10px',
              }}
            >
              {category}
            </div>
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '10px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: 'var(--fg-1)',
                  transition: 'background var(--dur-fast) var(--ease-standard)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--wgu-blue)',
                  }}
                >
                  {app.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--fg-2)',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {app.description}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
