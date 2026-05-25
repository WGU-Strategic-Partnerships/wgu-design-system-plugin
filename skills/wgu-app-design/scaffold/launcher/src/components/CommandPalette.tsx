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
