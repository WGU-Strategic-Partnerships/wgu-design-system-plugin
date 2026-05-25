import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import { listGrants, listMembers } from '@/lib/master-roster'
import { AppShell } from '@/components/AppShell'
import { AdminClient } from './admin-client'

/**
 * Admin page — manages the __APP_NAME__ master roster and per-app grants.
 *
 * Gated to hard-coded super-admins (isAdmin from src/lib/auth.ts). Non-admin
 * roster users get a 404. Non-roster users have already been redirected to
 * /no-access by the home page guard.
 */
export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) notFound()

  const [members, grants] = await Promise.all([listMembers(), listGrants()])

  // Build a quick lookup: email -> Set<appSlug>
  const grantsByEmail = new Map<string, Set<string>>()
  for (const g of grants) {
    const set = grantsByEmail.get(g.memberEmail) ?? new Set<string>()
    set.add(g.appSlug)
    grantsByEmail.set(g.memberEmail, set)
  }

  const initialRows = members.map((m) => ({
    email: m.email,
    displayName: m.displayName,
    addedBy: m.addedBy,
    addedAt: m.addedAt,
    notes: m.notes,
    avatarUrl: m.avatarUrl,
    // Surface the *effective* admin status — Smartsheet flag OR hard-coded
    // ADMIN_EMAILS in auth.ts. Otherwise the founder row would look
    // non-admin in the matrix even though they always have admin access.
    isAdmin: m.isAdmin || isAdminEmail(m.email),
    isHardCodedAdmin: isAdminEmail(m.email),
    role: m.role,
    grants: Array.from(grantsByEmail.get(m.email) ?? []),
  }))

  return (
    <AppShell user={user}>
      <main className="page page-wide">
        <Link
          href="/"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 16, paddingLeft: 8 }}
        >
          <ArrowLeft size={14} />
          <span>Back to tools</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="page-eyebrow">__APP_NAME__</p>
            <h1 className="page-title">Manage access</h1>
            <p className="page-sub" style={{ marginBottom: 0 }}>
              The master roster for __APP_NAME__. Add a member to let them sign in, then
              grant access to specific apps. Removing a member revokes all grants
              and locks them out of the launcher.
            </p>
          </div>
          <Link href="/admin/usage" className="btn btn-secondary btn-sm" style={{ marginTop: 24 }}>
            <BarChart3 size={14} />
            <span>Usage analytics</span>
          </Link>
        </div>

        <div style={{ height: 28 }} />

        <AdminClient initialRows={initialRows} currentAdminEmail={user.email} />
      </main>
    </AppShell>
  )
}
