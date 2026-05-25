# App shell

The WGU.tools app shell is the persistent chrome that wraps every authenticated page: impersonation banner (conditional), header bar, and page content. Five components compose it: `AppShell`, `HeaderNav`, `UserMenu`, `UserAvatar`, and `ImpersonationBanner`.

---

## Anatomy at a glance

```
┌──────────────────────────────────────────────────────────┐
│ ImpersonationBanner (conditional, when viewing as user)  │
├──────────────────────────────────────────────────────────┤
│ HeaderNav  │ logo │ nav links │            │ UserMenu     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  page content (children)                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## AppShell.tsx

`AppShell` is the async server component that wraps the whole authenticated app. It resolves `navApps` from the user's access set (admins see every app; members see only what they can reach), fetches the `MasterProfile`, conditionally renders `ImpersonationBanner` when `user.impersonator` is non-null, then renders the `header` row followed by `children`.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/AppShell.tsx -->
```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { CurrentUser } from '@/lib/auth'
import { APPS, type AppTile } from '@/lib/apps'
import type { AppSlug } from '@/lib/sheets'
import { getMasterProfile } from '@/lib/master-profile'
import { UserMenu } from './UserMenu'
import { HeaderNav } from './HeaderNav'
import { UsageTracker } from './UsageTracker'
import { ImpersonationBanner } from './ImpersonationBanner'

/**
 * Shared page chrome for authenticated screens. Mirrors mbr-builder's
 * AppShell so every tool in the WGU.tools suite carries the same header:
 * WGU corporate logo, product name, category dropdowns, user menu.
 */
export async function AppShell({
  user,
  children,
  visibleApps,
}: {
  user: CurrentUser
  children: React.ReactNode
  /** Apps to surface in the category dropdowns. Defaults to all apps the
   *  user has access to (admins see every app). */
  visibleApps?: readonly AppTile[]
}) {
  const navApps =
    visibleApps ??
    (user.isAdmin
      ? APPS
      : APPS.filter((a) => user.accessibleApps.has(a.id as AppSlug)))

  const profile = await getMasterProfile(user.email)

  return (
    <div className="app-shell">
      <UsageTracker app="wgu-tools" email={user.email} name={user.name} />
      {user.impersonator && (
        <ImpersonationBanner
          viewingAs={{ email: user.email, name: user.name }}
          actor={user.impersonator}
        />
      )}
      <header className="app-header">
        <Link
          href="/"
          aria-label="Home"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Image
            src="/wgu-logo.png"
            alt="WGU"
            width={70}
            height={32}
            priority
            style={{ height: 32, width: 'auto', display: 'block' }}
          />
        </Link>
        <span className="header-divider" />
        <span className="product-name">
          WGU<span className="dot">.tools</span>
        </span>
        <HeaderNav visibleApps={navApps} />
        <div className="spacer" />
        <UserMenu
          name={user.name}
          email={user.email}
          profile={profile}
          isAdmin={user.isAdmin}
        />
      </header>
      {children}
    </div>
  )
}
```

---

## HeaderNav.tsx

`HeaderNav` is a `'use client'` component that renders three category dropdowns (Executive, Leadership, Ops Team, Field Team) in the center of the header. Each dropdown groups the apps belonging to that category from `visibleApps`. Dropdowns close on Escape or backdrop click. The `CurrentUser` is resolved by `AppShell` before rendering; see [auth.md](./auth.md) for the `CurrentUser` type.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/HeaderNav.tsx -->
```tsx
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
```

---

## UserMenu.tsx

`UserMenu` is the avatar button in the top-right corner of the header. It opens a dropdown with the user's display name and email, a link to `/settings/profile`, admin-only links to `/admin` and `/admin/usage` (guarded by `isAdmin`), and a sign-out button. It accepts a `MasterProfile` so the avatar mode (photo/emoji/initials) matches the user's preference set in profile settings.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/UserMenu.tsx -->
```tsx
'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Activity, LogOut, Shield, UserCog } from 'lucide-react'
import { signOut } from '@/app/actions'
import type { MasterProfile } from '@/lib/master-profile'
import UserAvatar from './UserAvatar'

type Props = {
  name: string | null
  email: string
  /** Full master profile so the header avatar matches the user's chosen
   *  mode (photo / emoji / initials). Null on first-visit users. */
  profile: MasterProfile | null
  isAdmin?: boolean
}

/**
 * Header avatar that opens a small dropdown. The "Profile settings" entry
 * navigates to /settings/profile (which replaces the old photo-only modal).
 * Sign out and admin links live in the same dropdown.
 */
export function UserMenu({ name, email, profile, isAdmin = false }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: 0,
          background: 'transparent',
          border: 0,
          borderRadius: 999,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UserAvatar profile={profile} fallbackName={name ?? email} size="md" />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9 }}
            aria-hidden
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-monday-lg)',
              minWidth: 240,
              padding: 12,
              zIndex: 10,
              fontFamily: 'var(--font-body)',
            }}
          >
            <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--divider-soft)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg-1)' }}>
                {profile?.displayName ?? name ?? email}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{email}</div>
            </div>
            <div style={{ paddingTop: 8 }}>
              <Link
                href="/settings/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                style={menuItem('var(--fg-2)')}
              >
                <UserCog size={14} />
                <span>Profile settings</span>
              </Link>
              {isAdmin && (
                <>
                  <div style={menuDivider} aria-hidden />
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    style={menuItem('var(--wgu-blue)')}
                  >
                    <Shield size={14} />
                    <span>Manage access</span>
                  </Link>
                  <Link
                    href="/admin/usage"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    style={menuItem('var(--wgu-blue)')}
                  >
                    <Activity size={14} />
                    <span>Usage dashboard</span>
                  </Link>
                  <div style={menuDivider} aria-hidden />
                </>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => startTransition(() => signOut())}
                disabled={pending}
                style={menuItem('var(--neg)')}
              >
                <LogOut size={14} />
                <span>{pending ? 'Signing out…' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function menuItem(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    borderRadius: 6,
    color,
    fontSize: 13,
    fontWeight: 500,
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    textDecoration: 'none',
  }
}

const menuDivider: React.CSSProperties = {
  height: 1,
  background: 'var(--divider-soft)',
  margin: '6px 0',
}
```

---

## UserAvatar.tsx

`UserAvatar` renders a user's avatar in three modes, checked in order: `photo` (renders `<img>` from `avatarUrl`), `emoji` (emoji character on a colored circle), and `initials` (first-letter initials derived via `initialsFrom()`). Falls back to the `fallbackName` (typically the email address) when `profile` is null. Used by `UserMenu` for the header button and also by the profile settings editor preview.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/UserAvatar.tsx -->
```tsx
'use client'

import { initialsFrom, type MasterProfile } from '@/lib/master-profile-shared'

type Size = 'sm' | 'md' | 'lg' | 'xl'
const PX: Record<Size, number> = { sm: 24, md: 32, lg: 64, xl: 128 }

type Props = {
  /**
   * The full master profile, OR a partial subset of avatar fields. Letting
   * callers pass a partial means the editor preview can pass its in-flight
   * draft without constructing a fake email.
   */
  profile: Pick<
    MasterProfile,
    'displayName' | 'avatarKind' | 'avatarEmoji' | 'avatarColor' | 'avatarUrl'
  > | null
  /** Fallback when profile is null or has no display name (usually the email). */
  fallbackName?: string | null
  size?: Size
  className?: string
}

/**
 * Render a user's avatar with three modes:
 *   photo (avatarUrl)  →  emoji + color  →  initials.
 *
 * Portable: also used by the header avatar and the settings preview.
 */
export default function UserAvatar({ profile, fallbackName, size = 'md', className }: Props) {
  const px = PX[size]
  const kind = profile?.avatarKind ?? 'initials'
  const cls = `user-avatar${className ? ' ' + className : ''}`
  const base: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flex: '0 0 auto',
  }

  if (kind === 'photo' && profile?.avatarUrl) {
    return (
      <span className={cls} style={base} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          width={px}
          height={px}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </span>
    )
  }

  if (kind === 'emoji' && profile?.avatarEmoji) {
    return (
      <span
        className={cls}
        style={{
          ...base,
          background: profile.avatarColor ?? 'var(--wgu-blue)',
          fontSize: Math.round(px * 0.55),
          color: '#fff',
          lineHeight: 1,
        }}
        aria-hidden
      >
        {profile.avatarEmoji}
      </span>
    )
  }

  const initials = initialsFrom(profile?.displayName ?? fallbackName ?? '?')
  return (
    <span
      className={cls}
      style={{
        ...base,
        background: profile?.avatarColor ?? 'var(--wgu-blue)',
        fontSize: Math.round(px * 0.4),
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.02em',
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
```

---

## ImpersonationBanner.tsx

`ImpersonationBanner` renders only when `currentUser.impersonator` is non-null (i.e., an admin has activated "View as"). It displays a full-width WGU-blue sticky bar: "Viewing as **\<target\>** (signed in as \<actor\>)" with a "Stop viewing" button. The button calls `adminStopViewAs()` (which clears the `wgu_view_as` cookie server-side), then pushes to `/admin` and refreshes. See [auth.md](./auth.md) for the cookie mechanic and the `impersonator` field on `CurrentUser`.

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/components/ImpersonationBanner.tsx -->
```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, X } from 'lucide-react'
import { adminStopViewAs } from '@/app/actions'

/**
 * Sticky banner shown across every wgu-tools page while an admin has
 * "View as" turned on. The actor is the real admin; the visible
 * launcher reflects the impersonated member.
 */
export function ImpersonationBanner({
  viewingAs,
  actor,
}: {
  viewingAs: { email: string; name: string | null }
  actor: { email: string; name: string | null }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const stop = () => {
    startTransition(async () => {
      await adminStopViewAs()
      router.push('/admin')
      router.refresh()
    })
  }

  const targetLabel = viewingAs.name ?? viewingAs.email.split('@')[0]
  const actorLabel = actor.name ?? actor.email.split('@')[0]

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--wgu-blue)',
        color: 'var(--wgu-white)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 13,
        letterSpacing: '0.01em',
      }}
    >
      <Eye size={14} aria-hidden />
      <span>
        Viewing as <strong style={{ fontWeight: 700 }}>{targetLabel}</strong>
        <span style={{ color: 'var(--fg-on-dark-2)', marginLeft: 8 }}>
          (signed in as {actorLabel})
        </span>
      </span>
      <button
        type="button"
        onClick={stop}
        disabled={pending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'var(--wgu-white)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.02em',
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        <X size={12} />
        <span>{pending ? 'Stopping…' : 'Stop viewing'}</span>
      </button>
    </div>
  )
}
```

---

## How a page consumes it

Every authenticated page follows this pattern. The `AppShell` receives the resolved `CurrentUser` and owns the impersonation banner, header, and nav; the page provides only its own content as `children`.

```tsx
// src/app/some-page/page.tsx  (synthetic example — not lifted from a real file)
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.isMember) redirect('/no-access')
  return (
    <AppShell user={user}>
      <h1>Some page</h1>
    </AppShell>
  )
}
```

---

## What goes in `<AppShell>` vs. what doesn't

**Yes — belongs in `AppShell`:**
- Top-level page chrome (header bar, WGU logo, product name)
- Primary category nav (rendered by `HeaderNav`)
- Identity-aware bits: user avatar, impersonation banner, `UsageTracker`

**No — goes inside `children` instead:**
- Per-page sidebars, filter panels, or secondary navigation (those are page-local concerns)

**No — not part of `AppShell` at all:**
- Command palette — that is a launcher-archetype-only overlay; see [archetypes-launcher.md](./archetypes-launcher.md)

---

See also: [auth.md](./auth.md) for the `CurrentUser` shape, [design-primitives.md](./design-primitives.md) for the `WGUMark` used in `HeaderNav`, [archetypes-launcher.md](./archetypes-launcher.md) for the `CommandPalette` overlay.
