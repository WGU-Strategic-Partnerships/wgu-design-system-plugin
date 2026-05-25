'use client'

/**
 * __APP_NAME__: Home landing page client component.
 *
 * Replace the role/vertical pickers and welcome copy with your own app's
 * entry-point UI. The AppShell wrapper and auth-prop pattern are the
 * structural pieces to preserve.
 *
 * For the full MBR Builder reference implementation, see:
 *   `skills/wgu-app-design/references/archetypes-deep-app.md`
 *
 * This stub provides the minimum shell so the scaffold typechecks.
 */

import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import type { CurrentUser } from '@/lib/auth'

type HomeClientProps = {
  user: Pick<
    CurrentUser,
    | 'email'
    | 'name'
    | 'isAdmin'
    | 'isVerticalDirector'
    | 'vertical'
    | 'primaryRoles'
    | 'avatarUrl'
    | 'masterProfile'
  >
}

export default function HomeClient({ user }: HomeClientProps) {
  const firstName = user.name?.split(' ')[0]

  return (
    <AppShell user={user} currentPath="/">
      <main className="page page-narrow">
        {/* TODO: __APP_NAME__-specific content — replace below with your
            own welcome copy, navigation tiles, or entry-point widget. */}
        <div className="page-eyebrow">__APP_NAME__</div>
        <h1 className="page-title">Welcome{firstName ? `, ${firstName}` : ''}</h1>
        <p className="page-sub">
          Select an option below to get started.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/role/example" className="card card-tappable card-padded">
            <div style={{ fontWeight: 600, color: 'var(--wgu-blue)' }}>
              Example Role
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
              Replace with your own role or section links
            </div>
          </Link>
        </div>
      </main>
    </AppShell>
  )
}
