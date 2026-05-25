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
