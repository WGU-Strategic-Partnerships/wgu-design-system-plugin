import Image from 'next/image'
import Link from 'next/link'
import type { CurrentUser } from '@/lib/auth'
import { getMasterProfile } from '@/lib/master-profile'
import { UserMenu } from './UserMenu'
import { ImpersonationBanner } from './ImpersonationBanner'

/**
 * Shared page chrome for deep-app authenticated screens.
 *
 * This variant of AppShell is used by deep-app archetypes — it does not
 * include the multi-app category nav (which belongs to the launcher
 * archetype). Instead it renders: WGU logo, product name, user menu.
 *
 * Props:
 *   user        — CurrentUser from getCurrentUser() or getAuthState()
 *   currentPath — used to highlight the active nav item (future use)
 *   children    — page body
 *
 * __APP_NAME__: add your own nav links by extending the <nav> below.
 * For the full WGU.tools AppShell with multi-app category dropdowns, see
 * the launcher archetype's `src/components/AppShell.tsx`.
 */
export async function AppShell({
  user,
  currentPath: _currentPath,
  children,
}: {
  user: Pick<
    CurrentUser,
    | 'email'
    | 'name'
    | 'avatarUrl'
    | 'isAdmin'
  > & {
    /** Optional — pass through from CurrentUser when you need the impersonation banner. */
    impersonator?: CurrentUser['impersonator']
  }
  /** Active path — used to style nav links. Unused in the stub; wire in
   *  when you add real nav items. */
  currentPath?: string
  children: React.ReactNode
}) {
  const profile = await getMasterProfile(user.email)

  return (
    <div className="app-shell">
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
        <span className="product-name">__APP_NAME__</span>

        {/* __APP_NAME__: add role/section nav links here.
            Example:
              <nav style={{ display: 'flex', gap: 8 }}>
                <Link href="/role/manager" className="nav-link">Managers</Link>
                <Link href="/history"      className="nav-link">My History</Link>
              </nav>
        */}

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
