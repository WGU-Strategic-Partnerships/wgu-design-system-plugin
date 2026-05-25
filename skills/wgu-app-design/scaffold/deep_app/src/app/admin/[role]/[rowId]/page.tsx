/**
 * __APP_NAME__: replace with your own admin drill-in / detail view logic.
 *
 * For the full MBR Builder reference implementation, see:
 *   `skills/wgu-app-design/references/archetypes-deep-app.md`
 *
 * This stub provides the minimum auth + layout pattern so the scaffold
 * typechecks. Build your real detail view on top.
 *
 * Original imports that were removed (MBR-specific, not part of scaffold):
 *   - SlidePreview          from @/components/slide-preview  (MBR 3793-line component)
 *   - ROLE_ACCENT, ROLE_LABELS, ROLES, isVertical  from @/lib/mbr-sheets
 *   - readRowById, readLastNMonthsForManager        from @/lib/mbr-smartsheet
 *   - listComments          from @/app/actions
 *
 * Auth pattern preserved verbatim: admin OR vertical director required.
 * The route is: /admin/[role]/[rowId]
 */

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Comments from '@/components/comments'

// TODO: __APP_NAME__: define your own role list.
const ROLES = ['example'] as const
type Role = (typeof ROLES)[number]

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ role: string; rowId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // Admin OR vertical director — both have full read access.
  if (!user.isAdmin && !user.isVerticalDirector) redirect('/admin')

  const { role: roleParam, rowId: rowIdParam } = await params
  if (!ROLES.includes(roleParam as Role)) notFound()
  const role = roleParam as Role
  const rowId = Number(rowIdParam)
  if (!Number.isFinite(rowId)) notFound()

  // TODO: __APP_NAME__: fetch the record and comments from your own data source.
  // In MBR Builder:
  //   const row = await readRowById(role, rowId)
  //   const comments = await listComments({ role, rowId })
  //   const trajectoryRows = await readLastNMonthsForManager(role, monthKey, email, 11)
  const row = null as null | {
    rowId: number
    managerName: string | null
    managerEmail: string | null
    monthLabel: string | null
    status: string | null
    modifiedAt: string | null
    submittedAt: string | null
  }
  if (!row) notFound()

  const comments: Array<{
    discussionId: number
    commentId: number
    authorEmail: string | null
    authorRole: 'Director' | 'Manager' | null
    body: string
    createdAt: string | null
  }> = []

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background: 'var(--bg)',
        borderTop: '6px solid var(--wgu-blue)',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/admin"
            style={{
              padding: '10px 18px',
              borderRadius: 6,
              border: '1px solid var(--wgu-blue)',
              background: '#fff',
              color: 'var(--wgu-blue)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← Back to dashboard
          </Link>
          <h1
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--wgu-blue)', margin: 0, flex: 1 }}
          >
            {row.managerName ?? row.managerEmail ?? 'Unnamed'}
          </h1>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#fff',
              background: 'var(--wgu-medium-blue)',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {role}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 18 }}>
          {row.managerEmail}
          {row.modifiedAt && (
            <>
              {' · Updated '}
              {new Date(row.modifiedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </>
          )}
        </div>

        {/* TODO: __APP_NAME__: replace with your own record detail / preview.
            In MBR Builder this renders <SlidePreview> — a 3793-line component
            that shows the full exec-facing slide for a given role+data+month.
            See references/archetypes-deep-app.md for that implementation. */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 1px 4px rgba(0, 40, 85, 0.07)',
            marginBottom: 24,
          }}
        >
          <p style={{ color: 'var(--fg-2)', fontStyle: 'italic', margin: 0 }}>
            __APP_NAME__: render your record detail / preview here. See{' '}
            <code>references/archetypes-deep-app.md</code> for a full reference implementation.
          </p>
        </div>

        <Comments
          role={role}
          rowId={row.rowId}
          comments={comments}
          currentUserEmail={user.email}
          isAdmin={user.isAdmin || user.isVerticalDirector}
        />
      </div>
    </div>
  )
}
