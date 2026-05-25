/**
 * __APP_NAME__: replace with your own submission history / record-list logic.
 *
 * For the full MBR Builder reference implementation, see:
 *   `skills/wgu-app-design/references/archetypes-deep-app.md`
 *
 * This stub provides the minimum auth + layout pattern so the scaffold
 * typechecks. Build your real history list on top.
 *
 * Original imports that were removed (MBR-specific, not part of scaffold):
 *   - listMineAllRoles  from @/app/actions  (MBR Smartsheet read)
 *   - ROLE_ACCENT       from @/lib/mbr-sheets
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/app-shell'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // TODO: __APP_NAME__: replace with your own data fetch.
  // In MBR Builder: const rows = await listMineAllRoles()
  const rows: Array<{ id: string; label: string; status: string; updatedAt: string }> = []

  return (
    <AppShell user={user} currentPath="/history">
      <main className="page">
        <div className="page-header-row">
          <div>
            <div className="page-eyebrow">__APP_NAME__</div>
            <h1 className="page-title">My Submissions</h1>
            <p className="page-sub" style={{ margin: 0 }}>
              {rows.length === 0
                ? 'Nothing here yet — get started from home.'
                : `${rows.length} submission${rows.length === 1 ? '' : 's'}.`}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-title">No submissions yet</div>
              <p className="empty-state-body">
                Return to <Link href="/">home</Link> to get started.
              </p>
            </div>
          </div>
        ) : (
          /* TODO: __APP_NAME__: replace with your own record table.
             In MBR Builder this is a .board table with role chip, month,
             status pill, last-updated date, and open/preview links. */
          <div className="board">
            <table className="board-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 160 }}>Last updated</th>
                  <th style={{ width: 200 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.label}</td>
                    <td>
                      <span className={`pill pill-${row.status}`}>{row.status}</span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      <Link href={`/role/${row.id}`} className="btn btn-primary btn-sm">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AppShell>
  )
}
