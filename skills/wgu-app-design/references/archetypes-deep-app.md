# Archetype: deep app

## When to choose deep app

A deep app takes one focused workflow and goes deep with it — multiple views, role-scoped data, a historical record, and data-display primitives layered on top of each other. It is not a hub. The entire app serves one purpose; depth comes from the layers built around that purpose. MBR Builder is the canonical example: it takes one workflow (monthly business review prep) and builds role-scoped form pages, a submission history, an admin drill-in with full slide preview, inline comments, and a full visualization primitive set — all in service of that single workflow.

## Decision rule

Ask the user: "Are you building one focused tool, or 3+ small tools to consolidate?" One focused tool = deep app; 3+ small tools = [launcher](./archetypes-launcher.md).

## Home page

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/app/page.tsx -->

The home page is a server component that gates on auth state and hands off to a client component with the profile baked in. The `HomeClient` receives the user profile so it can trim the role buttons to the user's primary roles — most managers can submit in one click.

```tsx
import { redirect } from 'next/navigation'
import { getAuthState } from '@/lib/auth'
import HomeClient from './home-client'

/**
 * Home page (server). Phase 5 routes around three signed-in states:
 *   - guest             → /login
 *   - signed in, no row → /no-access
 *   - signed in, active → render HomeClient with the profile baked in
 *
 * The profile pre-fills the vertical picker and trims the role buttons to
 * the user's primary role(s) so most managers can submit in one click.
 */
export default async function HomePage() {
  const state = await getAuthState()
  if (state.kind === 'guest') redirect('/login')
  if (state.kind === 'no-profile') redirect('/no-access')

  const { user } = state
  return (
    <HomeClient
      user={{
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isVerticalDirector: user.isVerticalDirector,
        vertical: user.vertical,
        primaryRoles: user.primaryRoles,
        avatarUrl: user.avatarUrl,
        masterProfile: user.masterProfile,
      }}
    />
  )
}
```

## Role-scoped pages: `/role/[role]`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/app/role/[role]/page.tsx -->

This is the canonical "deep" route — the main work surface. It reads `role` from the URL param, validates it against the `ROLES` constant from `mbr-sheets` (calling `notFound()` on an unrecognized role), and redirects to `/login` if there is no current user. Role-based authorization is handled by `getCurrentUser()` — there is no explicit `accessibleApps` check; access to this route implies the user is authenticated. Vertical resolution walks: existing saved row → URL `?vertical=` param → user's profile assignment, bouncing home only if nothing resolves.

```tsx
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { isVertical, ROLES, type Role, type Vertical } from '@/lib/mbr-sheets'
import { defaultMonthLabel } from '@/lib/months'
import { loadSubmission } from '@/app/actions'
import FormClient from './form-client'

export default async function RolePage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>
  searchParams: Promise<{ month?: string; vertical?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { role: roleParam } = await params
  if (!ROLES.includes(roleParam as Role)) notFound()
  const role = roleParam as Role

  const sp = await searchParams
  const monthLabel = sp.month?.trim() || defaultMonthLabel()

  // Vertical resolution order: existing/prior saved row → URL ?vertical=X
  // → user's profile assignment. Bounce home only if nothing resolves.
  const verticalFromUrl: Vertical | null = isVertical(sp.vertical) ? sp.vertical : null

  const loaded = await loadSubmission({ role, monthLabel })

  const effectiveVertical: Vertical | null =
    loaded.vertical ?? verticalFromUrl ?? user.vertical ?? null

  if (!effectiveVertical) {
    redirect('/')
  }

  return (
    <FormClient
      role={role}
      vertical={effectiveVertical}
      initialMonthLabel={monthLabel}
      defaultManagerName={user.name ?? user.email}
      initialData={loaded.data}
      initialAutoFilled={loaded.autoFilled}
      initialRowId={loaded.existingRowId}
      initialStatus={loaded.status}
      priorMonthLabel={loaded.priorMonthLabel}
      user={user}
      initialCarryoverActionItems={loaded.carryoverActionItems}
      initialLastMonthActionItems={loaded.lastMonthActionItems}
      initialLastMonthLabel={loaded.lastMonthLabel}
    />
  )
}
```

## History page

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/app/history/page.tsx -->

A chronological list of past submissions across all roles for the current user. Columns: role chip, month, status pill, last-updated date, and actions (Preview / Open). Empty state uses the shared `.empty-state` pattern. Clicking "Open" routes back to the live `/role/[role]` form; clicking "Preview" goes to a read-only preview route.

```tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listMineAllRoles } from '@/app/actions'
import { getCurrentUser } from '@/lib/auth'
import { ROLE_ACCENT } from '@/lib/mbr-sheets'
import { AppShell } from '@/components/app-shell'

/**
 * History (Monday-style redesign — phase 4). Wraps the list in <AppShell>
 * and renders submissions as a `.board` table.
 *
 * Columns: Role chip · Month · Status pill · Updated date · Actions.
 * Empty state uses the shared `.empty-state` style.
 */
export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const rows = await listMineAllRoles()

  return (
    <AppShell user={user} currentPath="/history">
      <main className="page">
        <div className="page-header-row">
          <div>
            <div className="page-eyebrow">MBR Builder</div>
            <h1 className="page-title">My Submissions</h1>
            <p className="page-sub" style={{ margin: 0 }}>
              {rows.length === 0
                ? 'Nothing here yet — pick a role from home to start this month.'
                : `${rows.length} submission${rows.length === 1 ? '' : 's'} across all months.`}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-title">No submissions yet</div>
              <p className="empty-state-body">
                Pick a role from <Link href="/">home</Link> to enter this month&rsquo;s MBR.
              </p>
            </div>
          </div>
        ) : (
          <div className="board">
            <table className="board-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Role</th>
                  <th>Month</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 160 }}>Last updated</th>
                  <th style={{ width: 200 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const accent = ROLE_ACCENT[row.role]
                  const status = row.status ?? 'Draft'
                  return (
                    <tr key={`${row.role}-${row.rowId}`}>
                      <td>
                        <span
                          className="pill no-dot"
                          style={{
                            background: accent,
                            color: 'var(--wgu-white)',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                          }}
                        >
                          {row.role}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            color: 'var(--wgu-blue)',
                          }}
                        >
                          {row.monthLabel ?? '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                          {row.managerName ?? user.name ?? user.email}
                        </div>
                      </td>
                      <td>
                        <span className={`pill pill-${status}`}>{status}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                        {row.modifiedAt
                          ? new Date(row.modifiedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Link
                            href={`/role/${row.role}/preview?month=${encodeURIComponent(row.monthLabel ?? '')}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/role/${row.role}?month=${encodeURIComponent(row.monthLabel ?? '')}`}
                            className="btn btn-primary btn-sm"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AppShell>
  )
}
```

## Admin drill-in page: `/admin/[role]/[rowId]`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/app/admin/[role]/[rowId]/page.tsx -->

> **Reality note:** The actual deep-link admin page is at `admin/[role]/[rowId]/page.tsx`, not `admin/[role]/page.tsx`. The `admin/page.tsx` is a separate dashboard listing all submissions. The drill-in page is accessible by admins **and** vertical directors (`user.isAdmin || user.isVerticalDirector`). It renders the full slide preview for a specific submission plus the inline comments thread.

```tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { listComments } from '@/app/actions'
import { getCurrentUser } from '@/lib/auth'
import Comments from '@/components/comments'
import SlidePreview from '@/components/slide-preview'
import { isVertical, ROLE_ACCENT, ROLE_LABELS, ROLES, type Role } from '@/lib/mbr-sheets'
import { readLastNMonthsForManager, readRowById } from '@/lib/mbr-smartsheet'

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

  const row = await readRowById(role, rowId)
  if (!row) notFound()
  const comments = await listComments({ role, rowId })
  // Pull last 11 months of history for the manager so the slide's YTD
  // sparkline can render. PE doesn't use this yet (Phase 7), but the cost
  // is a single sheet pull, already cached upstream.
  const trajectoryRows =
    row.managerEmail && row.monthKey
      ? await readLastNMonthsForManager(role, row.monthKey, row.managerEmail, 11)
      : []
  const trajectory = trajectoryRows.map((r) => ({
    monthKey: r.monthKey ?? '',
    monthLabel: r.monthLabel ?? '',
    data: r.data,
  }))

  const accent = ROLE_ACCENT[role]

  return (
    <div style={{ minHeight: '100vh', padding: 24, background: 'var(--bg)', borderTop: '6px solid var(--wgu-blue)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--wgu-blue)', margin: 0, flex: 1 }}>
            {row.managerName ?? row.managerEmail ?? 'Unnamed'}
          </h1>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#fff',
              background: accent,
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {role}
          </span>
          <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
            <strong style={{ color: 'var(--wgu-blue)' }}>{row.monthLabel ?? ''}</strong>
            {row.status && (
              <>
                {' · '}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    background: row.status === 'Submitted' ? 'var(--wgu-lime)' : '#F1F1F1',
                    color: row.status === 'Submitted' ? 'var(--wgu-blue)' : 'var(--fg-2)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {row.status}
                </span>
              </>
            )}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 18 }}>
          {ROLE_LABELS[role]}
          {' · '}
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

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 1px 4px rgba(0, 40, 85, 0.07)',
          }}
        >
          <SlidePreview
            role={role}
            data={row.data}
            name={row.managerName ?? row.managerEmail}
            month={row.monthLabel}
            vertical={isVertical(row.vertical) ? row.vertical : null}
            submittedAt={row.submittedAt}
            trajectory={trajectory}
          />
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
```

## `comments.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/comments.tsx -->

Inline comment thread component. Persists comments to Smartsheet via `postComment` server action (comments attach to a saved row by `rowId`). Shows a "save first" warning if `rowId` is null. Comments show author role badge (Director vs. non-director), author email, and timestamp. The compose box is disabled until the row exists and until the draft is non-empty.

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postComment, type DisplayComment } from '@/app/actions'
import type { Role } from '@/lib/mbr-sheets'

type Props = {
  role: Role
  rowId: number | null
  comments: DisplayComment[]
  currentUserEmail: string
  isAdmin: boolean
}

export default function Comments({ role, rowId, comments, currentUserEmail, isAdmin }: Props) {
  const [draft, setDraft] = useState('')
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()

  const canPost = rowId != null

  const submit = () => {
    if (!canPost) return
    const text = draft.trim()
    if (!text) return
    setErr(null)
    startTransition(async () => {
      try {
        await postComment({ role, rowId: rowId!, text })
        setDraft('')
        router.refresh()
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      }
    })
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--wgu-blue)', margin: 0 }}>
          Comments
        </h3>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {!canPost && (
        <div
          style={{
            background: '#FFF8E1',
            border: '1px solid #F0CC55',
            color: '#7A5800',
            padding: '10px 12px',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          Save the submission first, then you can post comments. Comments attach to the saved row in
          Smartsheet.
        </div>
      )}

      {comments.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px dashed var(--border-soft)',
            borderRadius: 8,
            padding: '20px 16px',
            textAlign: 'center',
            color: 'var(--fg-3)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          No comments yet. {isAdmin ? 'Ask the manager a question below.' : 'Wait for the Director to comment.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {comments.map((c) => {
            const isMe = c.authorEmail?.toLowerCase() === currentUserEmail.toLowerCase()
            const tagBg = c.authorRole === 'Director' ? 'var(--wgu-medium-blue)' : 'var(--wgu-sky-blue)'
            return (
              <div
                key={c.commentId}
                style={{
                  background: isMe ? '#F4FBE9' : '#fff',
                  border: `1px solid ${isMe ? 'var(--wgu-lime)' : 'var(--border-soft)'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {c.authorRole && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        background: tagBg,
                        color: '#fff',
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}
                    >
                      {c.authorRole}
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--wgu-blue)' }}>
                    {c.authorEmail ?? 'Unknown'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--fg-1)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {c.body}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canPost && (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            padding: 14,
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isAdmin
                ? 'Ask the manager a question, request more context…'
                : 'Reply to the Director…'
            }
            rows={3}
            disabled={pending}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-input)',
              borderRadius: 6,
              fontFamily: 'inherit',
              fontSize: 14,
              color: 'var(--wgu-blue)',
              background: '#fff',
              resize: 'vertical',
              minHeight: 70,
              lineHeight: 1.4,
            }}
          />
          {err && (
            <div
              style={{
                marginTop: 8,
                background: '#fff1f1',
                border: '1px solid #fbcaca',
                color: 'var(--status-negative)',
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {err}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
              Posting as <strong>{currentUserEmail}</strong>
              {isAdmin ? ' · Director' : ''}
              {'. '}
              {isAdmin
                ? 'The manager gets an email when you post (configured per sheet in Smartsheet).'
                : 'The Director gets an email when you reply.'}
            </span>
            <button
              onClick={submit}
              disabled={pending || !draft.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 0,
                background: 'var(--wgu-medium-blue)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: pending || !draft.trim() ? 'not-allowed' : 'pointer',
                opacity: pending || !draft.trim() ? 0.5 : 1,
              }}
            >
              {pending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

## `slide-preview.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/slide-preview.tsx -->

Renders a submission as a full editorial slide layout — DOM only, no canvas or PDF. Acts as a thin router: `SlidePreview` dispatches to `PSMSlide` or `PESlide` based on `role`. Both slide components use a shared dark-hero masthead (`SlideMasthead`), `§`-numbered section headers, a 12-column CSS grid, and the viz primitives from `components/viz/`. Data degrades gracefully — missing values render as em-dashes, sections with no usable data are dropped. This pattern is useful for any deep app that needs to preview a complex structured artifact (report, proposal, plan) as a rendered DOM view rather than a PDF export.

The component is large (3794 lines); the source-path comment below points to the full file. The excerpt above covers the public API and routing logic.

```tsx
// Public API excerpt — full source at the path below
// /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/slide-preview.tsx

export type SlideTrajectoryEntry = {
  monthKey: string
  monthLabel: string
  data: Record<string, string>
}

// Props accepted by the default export:
// role: Role
// data: Record<string, string>
// name: string | null | undefined
// month: string | null | undefined
// submittedAt?: string | null
// vertical?: Vertical | null
// trajectory?: SlideTrajectoryEntry[]

export default function SlidePreview({ role, data, name, month, submittedAt, vertical, trajectory }) {
  if (role === 'PSM') return <PSMSlide ... />
  return <PESlide ... />
}
```

## `components/viz/`

The visualization primitives that power the slide preview. These are the data-display layer that composes with the 8 generic UI primitives from [design-primitives.md](./design-primitives.md). All are pure inline-style components with no external chart dependencies. Import from the barrel (`@/components/viz`).

### `viz/index.ts`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/index.ts -->

Barrel export. Also exports `PIPELINE_STAGE_COLORS` — the canonical five-color palette for pipeline stage funnels (discovery, intake, pitch, negotiation, signing). Import from here rather than individual files.

```tsx
/**
 * Visualization library — pure-SVG / inline-style chart and tile components
 * used in the slide preview. Per MBR_V2_BUILD_SPEC.md Phase 2.
 *
 * No external chart deps. Each component takes simple data and renders.
 */

export { KpiCard, type KpiCardProps } from './kpi-card'
export { Gauge, type GaugeProps, type GaugeSize } from './gauge'
export { PacingGauge, type PacingGaugeProps } from './pacing-gauge'
export { Sparkline, type SparklineProps, type SparklineDatum } from './sparkline'
export { Funnel, type FunnelProps, type FunnelStage } from './funnel'
export { Donut, type DonutProps, type DonutSlice } from './donut'
export { ScoreTable, type ScoreTableProps, type ScoreTableColumn } from './score-table'
export { HBar, type HBarProps, type HBarItem } from './hbar'

/**
 * Pipeline stage colors per MBR_V2_BUILD_SPEC.md §4 Section II:
 *   Discovery: Medium Blue
 *   Intake: Sky Blue
 *   Pitch: purple
 *   Negotiation: light purple
 *   Signing: teal
 *
 * Importable so callers don't have to repeat the palette in every funnel.
 */
export const PIPELINE_STAGE_COLORS = {
  discovery: '#0070F0',
  intake: '#46B1EF',
  pitch: '#7B3FF2',
  negotiation: '#B07BE8',
  signing: '#0FB594',
} as const
```

### `viz/kpi-card.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/kpi-card.tsx -->

Editorial KPI tile: 2px role-accent top rule, uppercase label, large Jost-bold value, optional inline delta chip, optional sub-caption. Use anywhere a single big number belongs — slide sections, admin mini-stats, scratch dashboards. Accepts an optional `belowValue` slot for composing with a `Gauge` or `PacingGauge` directly beneath the number.

```tsx
import type { CSSProperties, ReactNode } from 'react'
import { Delta, Numeral, type DeltaTone } from '@/components/ui'

/**
 * KPI tile used at the top of every slide section. Editorial card with a
 * 2px role-accent rule on top, uppercase label, large Newsreader-italic
 * value, optional inline delta + sub label.
 *
 * Extracted from src/components/slide-preview.tsx (per MBR_V2_BUILD_SPEC.md
 * Phase 2). Reuse anywhere a single big number plus delta belongs, including
 * outside the slide preview (admin drill-in mini-stats, future scratch
 * dashboards, etc.).
 *
 * Pure SVG / inline-style. No external deps beyond shared UI atoms.
 */
export type KpiCardProps = {
  /** Uppercase label rendered above the value. */
  label: string
  /** The big number itself. Strings are passed through verbatim ("3,614", "101.7%", "—"). */
  value: ReactNode
  /** Optional delta chip rendered to the right of the value. */
  delta?: { value: string; tone: DeltaTone }
  /** Small caption under the row, e.g. "vs. last month" or "% to target". */
  sub?: string
  /** Role-accent color for the top rule. Defaults to WGU Medium Blue. */
  accent?: string
  /** Override the value font size; defaults to 56. */
  valueSize?: number
  /** Optional renderable underneath the value (e.g. a small Gauge). */
  belowValue?: ReactNode
  style?: CSSProperties
}

export function KpiCard({
  label,
  value,
  delta,
  sub,
  accent = 'var(--wgu-medium-blue)',
  valueSize = 56,
  belowValue,
  style,
}: KpiCardProps) {
  return (
    <div
      style={{
        borderTop: `2px solid ${accent}`,
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--wgu-blue)',
        }}
      >
        {label}
      </div>
      <Numeral size={valueSize} weight={700} color="var(--wgu-blue)">
        {value}
      </Numeral>
      {belowValue}
      {(delta || sub) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {delta ? <Delta value={delta.value} tone={delta.tone} /> : <span style={{ visibility: 'hidden' }}>—</span>}
          {sub && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--fg-2)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
```

### `viz/gauge.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/gauge.tsx -->

Half-circle SVG gauge with three colored zones and a triangle pointer. Three sizes (`sm`/`md`/`lg`). Default scheme is higher-is-better (red → amber → green); pass `invert` for lower-is-better metrics like days-to-close. Center value in Newsreader 600; label below in uppercase Jost 500.

```tsx
import type { CSSProperties } from 'react'

/**
 * Half-circle gauge with three colored zones and a triangle pointer.
 *
 * Per MBR_V2_BUILD_SPEC.md Phase 2:
 * - Three zones split by `thresholds: [low, mid]` so the arc reads
 *   below-target / approaching-target / on-target.
 * - Pointer rotates from -90deg (at min) to +90deg (at max) as a function
 *   of `(value - min) / (max - min)`.
 * - Center number in Newsreader 600. Label below in uppercase Jost 500.
 *
 * Default direction is "higher is better" (red -> amber -> green). Pass
 * `invert` for metrics where lower is better (e.g. Days Since Last Activity,
 * Avg Days to Close).
 */

export type GaugeSize = 'sm' | 'md' | 'lg'

export type GaugeProps = {
  value: number | string | null | undefined
  min?: number
  max: number
  thresholds: [number, number]
  size?: GaugeSize
  label?: string
  formatValue?: (v: number) => string
  invert?: boolean
  style?: CSSProperties
}

const DIM: Record<GaugeSize, { width: number; height: number; valueFs: number; labelFs: number; arcStroke: number }> = {
  sm: { width: 120, height: 78, valueFs: 18, labelFs: 9, arcStroke: 10 },
  md: { width: 180, height: 112, valueFs: 24, labelFs: 10, arcStroke: 13 },
  lg: { width: 240, height: 150, valueFs: 32, labelFs: 11, arcStroke: 16 },
}

const ZONE_GREEN = 'var(--pos)'
const ZONE_AMBER = '#D9A33B'
const ZONE_RED = 'var(--neg)'
const ZONE_BG = 'var(--rule-strong)'

function parseValue(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(/[,\s%+]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function Gauge({
  value,
  min = 0,
  max,
  thresholds,
  size = 'md',
  label,
  formatValue,
  invert = false,
  style,
}: GaugeProps) {
  const { width, height, valueFs, labelFs, arcStroke } = DIM[size]
  const numeric = parseValue(value)
  const hasValue = numeric != null

  // Geometry — center the arc inside the box. Arc occupies the top half;
  // pointer originates at center bottom.
  const cx = width / 2
  const cy = height - 18
  const radius = Math.min(width / 2, height) - arcStroke / 2 - 2

  const colors = invert
    ? [ZONE_GREEN, ZONE_AMBER, ZONE_RED]
    : [ZONE_RED, ZONE_AMBER, ZONE_GREEN]

  // Build three arc paths covering 180deg total based on thresholds.
  const t = (n: number) => Math.max(min, Math.min(max, n))
  const stops = [min, t(thresholds[0]), t(thresholds[1]), max]
  const arcs: { d: string; color: string }[] = []
  for (let i = 0; i < 3; i++) {
    const a0 = (stops[i] - min) / (max - min)
    const a1 = (stops[i + 1] - min) / (max - min)
    if (a1 - a0 <= 0) continue
    arcs.push({ d: arcPath(cx, cy, radius, a0, a1), color: colors[i] })
  }

  // Pointer angle: 0 at min (-90deg), 1 at max (+90deg).
  const fraction = hasValue ? Math.max(0, Math.min(1, (numeric! - min) / (max - min))) : 0
  const pointerAngleDeg = -90 + fraction * 180

  const display = hasValue ? (formatValue ? formatValue(numeric!) : Math.round(numeric!).toString()) : '—'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...style }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        {/* Background arc */}
        <path d={arcPath(cx, cy, radius, 0, 1)} fill="none" stroke={ZONE_BG} strokeWidth={arcStroke} strokeLinecap="butt" />
        {/* Colored zone arcs */}
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.d}
            fill="none"
            stroke={a.color}
            strokeWidth={arcStroke}
            strokeLinecap="butt"
          />
        ))}
        {/* Pointer triangle (only if a value is present) */}
        {hasValue && (
          <g transform={`rotate(${pointerAngleDeg} ${cx} ${cy})`}>
            <polygon
              points={`${cx},${cy - radius - arcStroke / 2 - 2} ${cx - 5},${cy - 4} ${cx + 5},${cy - 4}`}
              fill="var(--wgu-blue)"
            />
            <circle cx={cx} cy={cy - 1} r={3} fill="var(--wgu-blue)" />
          </g>
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontFamily="Newsreader, Georgia, serif"
          fontSize={valueFs}
          fontWeight={600}
          fill="var(--wgu-blue)"
        >
          {display}
        </text>
      </svg>
      {label && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: labelFs,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--fg-2)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

/**
 * Build an SVG arc path from `start` (0..1) to `end` (0..1) along a
 * half-circle from -90deg (left) through 0deg (top) to +90deg (right),
 * around (cx, cy) with the given radius.
 */
function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const angleStart = -Math.PI + start * Math.PI
  const angleEnd = -Math.PI + end * Math.PI
  const x0 = cx + r * Math.cos(angleStart)
  const y0 = cy + r * Math.sin(angleStart)
  const x1 = cx + r * Math.cos(angleEnd)
  const y1 = cy + r * Math.sin(angleEnd)
  const largeArc = end - start > 0.5 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`
}
```

### `viz/pacing-gauge.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/pacing-gauge.tsx -->

Horizontal banded pacing gauge — a linear track divided into three colored zones with a solid fill bar showing current value. Replaces the half-circle `Gauge` for percent-of-target metrics. Supports `invert` for lower-is-better, optional `scaleLabels`, and an optional vertical marker at the target threshold. Used for PSM new-starts pacing, cert % to target, and days-since-last-activity. Compose with `KpiCard` via the `belowValue` slot.

```tsx
import type { CSSProperties } from 'react'

/**
 * Horizontal banded pacing gauge — replaces the old half-circle Gauge for
 * percent-of-target metrics. Per the v2 design handoff (PE PSM Layouts.html
 * Chart Library §06).
 *
 * Three colored zones along a horizontal track (defaults: red 0–zoneA,
 * amber zoneA–zoneB, green zoneB–max). A solid fill bar indicates the
 * current value, optional vertical markers anchor the zone boundaries.
 *
 * Default direction is "higher is better" (red → amber → green). For
 * lower-is-better metrics (Days Since Last Activity, Avg Days to Close)
 * pass `invert` and the colors flip (green → amber → red).
 *
 * Used for: PSM New Starts pacing, PSM Cert % to Target, PSM Days-Since
 * Last Activity. Compose with KpiCard for big-number + gauge layouts.
 */

export type PacingGaugeProps = {
  value: number | string | null | undefined
  min?: number
  max: number
  thresholds: [number, number]
  invert?: boolean
  height?: number
  scaleLabels?: string[]
  fillColor?: string
  showThresholdMarker?: boolean
  style?: CSSProperties
}

const ZONE_GREEN_BG = 'rgba(46, 133, 64, 0.20)'
const ZONE_AMBER_BG = 'rgba(242, 169, 0, 0.20)'
const ZONE_RED_BG = 'rgba(181, 58, 42, 0.18)'

const FILL_GREEN = 'var(--pos)'
const FILL_AMBER = 'var(--amber)'
const FILL_RED = 'var(--neg)'

function parseValue(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(/[,\s%+]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function PacingGauge({
  value,
  min = 0,
  max,
  thresholds,
  invert = false,
  height = 28,
  scaleLabels,
  fillColor,
  showThresholdMarker = true,
  style,
}: PacingGaugeProps) {
  const numeric = parseValue(value)
  const hasValue = numeric != null

  const range = max - min
  const pctOf = (v: number) => Math.max(0, Math.min(1, (v - min) / range))

  // Zone breakpoints as percentages along the track.
  const zoneA = pctOf(thresholds[0])
  const zoneB = pctOf(thresholds[1])

  // Colors for the three bands, in display order (left → right).
  const [bgLeft, bgMid, bgRight] = invert
    ? [ZONE_GREEN_BG, ZONE_AMBER_BG, ZONE_RED_BG]
    : [ZONE_RED_BG, ZONE_AMBER_BG, ZONE_GREEN_BG]

  const trackBackground = `linear-gradient(to right, ${bgLeft} 0% ${zoneA * 100}%, ${bgMid} ${zoneA * 100}% ${zoneB * 100}%, ${bgRight} ${zoneB * 100}% 100%)`

  // Determine fill color from where the value lands.
  const computedFill = (() => {
    if (fillColor) return fillColor
    if (!hasValue) return FILL_AMBER
    const fraction = pctOf(numeric!)
    if (invert) {
      if (fraction <= zoneA) return FILL_GREEN
      if (fraction <= zoneB) return FILL_AMBER
      return FILL_RED
    }
    if (fraction >= zoneB) return FILL_GREEN
    if (fraction >= zoneA) return FILL_AMBER
    return FILL_RED
  })()

  const fillPct = hasValue ? pctOf(numeric!) * 100 : 0

  return (
    <div style={{ width: '100%', ...style }}>
      <div
        style={{
          position: 'relative',
          height,
          background: trackBackground,
          display: 'flex',
        }}
      >
        {hasValue && (
          <div
            data-pacing-fill
            style={{
              height: '100%',
              width: `${fillPct}%`,
              background: computedFill,
              transition: 'width 200ms var(--ease-standard, ease)',
            }}
          />
        )}
        {/* Threshold marker — solid line at the "target" boundary (typically 100%) */}
        {showThresholdMarker && (
          <div
            style={{
              position: 'absolute',
              left: `${zoneB * 100}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: 'var(--wgu-blue)',
              opacity: 0.5,
            }}
          />
        )}
      </div>
      {scaleLabels && scaleLabels.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-2)',
          }}
        >
          {scaleLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
```

### `viz/sparkline.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/sparkline.tsx -->

Bar sparkline for compact trajectory charts — no axes. Last bar highlighted in `--wgu-blue` (current month), earlier bars in `--wgu-sky-blue`. Handles partial data gracefully: if fewer bars than `expectedBars` are provided, renders a "n of N months" caption rather than stretching or faking bars.

```tsx
import type { CSSProperties } from 'react'

/**
 * Bar sparkline — compact trajectory chart with no axes. Used for the
 * 11-month YTD trajectory on the PSM slide; designed to live next to a
 * KPI card or pacing gauge.
 *
 * Bars sit on an implicit zero baseline. The last bar is highlighted in
 * the WGU primary blue ("pop") to anchor the eye on the current month;
 * earlier bars use the WGU sky-blue accent.
 *
 * Empty / partial-data behavior: if fewer than `expectedBars` bars are
 * provided, renders only what we have and surfaces a small "n months of
 * history" caption so the slide doesn't lie about coverage.
 */

export type SparklineDatum = {
  label?: string
  value: number
}

export type SparklineProps = {
  data: SparklineDatum[]
  expectedBars?: number
  width?: number
  height?: number
  popColor?: string
  barColor?: string
  partialCaption?: ((shown: number, expected: number) => string) | null
  style?: CSSProperties
}

const DEFAULT_PARTIAL = (shown: number, expected: number) =>
  `${shown} of ${expected} months of history`

export function Sparkline({
  data,
  expectedBars,
  width = 320,
  height = 110,
  popColor = 'var(--wgu-blue)',
  barColor = 'var(--wgu-sky-blue)',
  partialCaption = DEFAULT_PARTIAL,
  style,
}: SparklineProps) {
  const expected = expectedBars ?? data.length
  const isPartial = data.length < expected

  // Empty state — render a thin rule and a caption so the layout doesn't
  // collapse but we don't fake bars.
  if (data.length === 0) {
    return (
      <div style={{ width: '100%', ...style }}>
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            color: 'var(--fg-3)',
            fontFamily: 'var(--font-numeral)',
            fontSize: 13,
          }}
        >
          No history yet.
        </div>
      </div>
    )
  }

  // Compute bar geometry. Reserve consistent slot width so partial data
  // shows fewer bars at the right size, not stretched.
  const slotWidth = width / expected
  const gap = Math.min(4, slotWidth * 0.18)
  const barW = Math.max(4, slotWidth - gap)
  const baselineY = height - 2
  const peakY = 6
  const max = Math.max(1, ...data.map((d) => d.value))

  const bars = data.map((d, i) => {
    const valuePct = max === 0 ? 0 : d.value / max
    const barHeight = Math.max(2, valuePct * (baselineY - peakY))
    const x = i * slotWidth
    const y = baselineY - barHeight
    const isLast = i === data.length - 1
    return { x, y, barH: barHeight, value: d.value, label: d.label, isLast }
  })

  return (
    <div style={{ width: '100%', ...style }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <g data-spark-bars>
          {bars.map((b, i) => (
            <rect
              key={i}
              x={b.x + gap / 2}
              y={b.y}
              width={barW}
              height={b.barH}
              fill={b.isLast ? popColor : barColor}
            >
              {b.label && <title>{`${b.label}: ${b.value.toLocaleString()}`}</title>}
            </rect>
          ))}
        </g>
      </svg>
      {isPartial && partialCaption && (
        <div
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'var(--fg-3)',
          }}
        >
          {partialCaption(data.length, expected)}
        </div>
      )}
    </div>
  )
}
```

### `viz/donut.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/donut.tsx -->

SVG donut chart with center total and a tight legend underneath each slice. Built with stroke-dasharray arcs on a single circle element per slice. Used for exec-attended split in PSM and per-tier event mix in PE.

```tsx
import type { CSSProperties } from 'react'

/**
 * Donut chart with center total + tight legend underneath. Per
 * MBR_V2_BUILD_SPEC.md Phase 2.
 *
 * Used for: PSM exec-present split (last/this month), PE per-tier event mix.
 */

export type DonutSlice = {
  label: string
  value: number | string | null | undefined
  color: string
}

export type DonutProps = {
  label?: string
  slices: DonutSlice[]
  total?: number | string
  diameter?: number
  style?: CSSProperties
}

function parseNum(v: number | string | null | undefined): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function Donut({
  label,
  slices,
  total,
  diameter = 110,
  style,
}: DonutProps) {
  const values = slices.map((s) => parseNum(s.value))
  const sum = values.reduce((a, b) => a + b, 0)
  const totalNumber = total != null ? parseNum(total) : sum

  const r = diameter / 2 - 6
  const stroke = Math.max(10, diameter * 0.18)
  const c = 2 * Math.PI * r
  const cx = diameter / 2
  const cy = diameter / 2

  // Build stroke-dasharray + stroke-dashoffset arcs to render the donut.
  let cumulative = 0
  const arcs = slices.map((s, i) => {
    const v = values[i]
    const pct = sum > 0 ? v / sum : 0
    const dash = c * pct
    const gap = c - dash
    const offset = -cumulative * c
    cumulative += pct
    return { color: s.color, dash, gap, offset, pct }
  })

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-2)',
          }}
        >
          {label}
        </div>
      )}
      <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} aria-hidden>
        {sum === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--rule-strong)"
            strokeWidth={stroke}
          />
        ) : (
          arcs.map((a, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.dash} ${a.gap}`}
              strokeDashoffset={a.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))
        )}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontFamily="Newsreader, Georgia, serif"
          fontSize={Math.round(diameter * 0.26)}
          fontWeight={600}
          fill="var(--wgu-blue)"
        >
          {totalNumber.toLocaleString()}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: diameter }}>
        {slices.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '10px 1fr auto',
              gap: 8,
              alignItems: 'center',
              fontSize: 11,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: s.color,
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--fg-2)', fontWeight: 600, letterSpacing: '0.04em' }}>
              {s.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-numeral)',
                fontWeight: 500,
                color: 'var(--wgu-blue)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {values[i].toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### `viz/funnel.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/funnel.tsx -->

Pipeline funnel: N horizontal bars stacked vertically, each ~18% narrower than the one above, rendered as SVG rects. Stage labels appear to the right; counts appear inside each bar in white bold. Used for Total / New / Renewal / Expansion / Tier 1 pipelines (PE) and the ReNEW pipeline (Healthcare-only PE). Use `PIPELINE_STAGE_COLORS` from the barrel for the canonical five-color palette.

```tsx
import type { CSSProperties } from 'react'

/**
 * Pipeline funnel: five horizontal bars stacked vertically, each narrower
 * than the one above by ~18% so the silhouette reads as a funnel. Per
 * MBR_V2_BUILD_SPEC.md Phase 2.
 *
 * - Stage labels render right of each bar in muted Jost.
 * - Counts render inside each bar in white bold.
 * - Title sits above with the total in Newsreader 600 next to it.
 *
 * Used for: Total / New / Renewal / Expansion / Tier 1 pipelines (PE),
 * and the ReNEW pipeline (Healthcare-only PE).
 */

export type FunnelStage = {
  label: string
  count: number | string | null | undefined
  color: string
}

export type FunnelProps = {
  title: string
  total?: number | string
  stages: FunnelStage[]
  width?: number
  barHeight?: number
  style?: CSSProperties
}

const TOP_BAR_RATIO = 1.0
const STAGE_NARROW_FACTOR = 0.82 // each bar is ~18% narrower than the one above

function parseCount(v: number | string | null | undefined): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function Funnel({
  title,
  total,
  stages,
  width = 200,
  barHeight = 30,
  style,
}: FunnelProps) {
  const counts = stages.map((s) => parseCount(s.count))
  const totalNumber = total != null ? parseCount(total) : counts.reduce((a, b) => a + b, 0)
  const labelGap = 6
  const labelWidth = 92

  const svgHeight = stages.length * (barHeight + 4)

  // Bar widths shrink geometrically per stage.
  const barWidths = stages.map((_, i) => width * TOP_BAR_RATIO * Math.pow(STAGE_NARROW_FACTOR, i))

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          paddingBottom: 6,
          borderBottom: '1px solid var(--rule-strong)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--wgu-blue)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-numeral)',
            fontWeight: 600,
            fontSize: 18,
            color: 'var(--wgu-blue)',
            marginLeft: 'auto',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {totalNumber.toLocaleString()}
        </span>
      </div>
      <svg
        width={width + labelGap + labelWidth}
        height={svgHeight}
        viewBox={`0 0 ${width + labelGap + labelWidth} ${svgHeight}`}
        aria-hidden
      >
        {stages.map((stage, i) => {
          const w = barWidths[i]
          const x = (width - w) / 2
          const y = i * (barHeight + 4)
          const count = counts[i]
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barHeight} fill={stage.color} />
              {count > 0 && (
                <text
                  x={x + w / 2}
                  y={y + barHeight / 2 + 4}
                  textAnchor="middle"
                  fontFamily="Jost, sans-serif"
                  fontWeight={700}
                  fontSize={12}
                  fill="#fff"
                >
                  {count.toLocaleString()}
                </text>
              )}
              <text
                x={width + labelGap}
                y={y + barHeight / 2 + 4}
                textAnchor="start"
                fontFamily="Jost, sans-serif"
                fontWeight={600}
                fontSize={11}
                fill="var(--fg-2)"
                style={{ letterSpacing: '0.06em' }}
              >
                {stage.label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

### `viz/hbar.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/hbar.tsx -->

Tiny horizontal-bar mini-chart using pure CSS (no SVG). Each row: label on left, bar in middle (width = value / max), value on right. Scales to the largest item by default. Use as a sub-visualization strip beneath a larger section — for example, lead source share beneath a PE lead-source grid.

```tsx
import type { CSSProperties } from 'react'

/**
 * Tiny horizontal-bar mini-chart used as a sub-visualization (e.g. the Lead
 * Source share strip beneath the PE Lead Source mini-grid). Per
 * MBR_V2_BUILD_SPEC.md Phase 2.
 *
 * Each row: `label` (left), bar (middle, width = value/max), `value` (right).
 * Pure CSS — no SVG needed since these are simple rectangles.
 */

export type HBarItem = {
  label: string
  value: number | string | null | undefined
  color: string
}

export type HBarProps = {
  items: HBarItem[]
  max?: number
  labelWidth?: number
  barHeight?: number
  formatValue?: (v: number) => string
  style?: CSSProperties
}

function parseNum(v: number | string | null | undefined): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function HBar({
  items,
  max,
  labelWidth = 110,
  barHeight = 8,
  formatValue,
  style,
}: HBarProps) {
  const values = items.map((i) => parseNum(i.value))
  const denom = max ?? Math.max(1, ...values)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {items.map((item, i) => {
        const v = values[i]
        const pct = denom > 0 ? (v / denom) * 100 : 0
        const display = formatValue ? formatValue(v) : v.toLocaleString()
        return (
          <div
            key={item.label}
            style={{
              display: 'grid',
              gridTemplateColumns: `${labelWidth}px 1fr 50px`,
              gap: 10,
              alignItems: 'center',
              fontFamily: 'var(--font-display)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--fg-2)',
                letterSpacing: '0.04em',
              }}
            >
              {item.label}
            </span>
            <div
              style={{
                position: 'relative',
                height: barHeight,
                background: 'var(--rule)',
                borderRadius: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: item.color,
                  transition: 'width 220ms var(--ease-standard)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-numeral)',
                fontWeight: 500,
                fontSize: 13,
                color: 'var(--wgu-blue)',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {display}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

### `viz/score-table.tsx`

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/viz/score-table.tsx -->

Generic editorial table with WGU Blue header and an optional percentage-banded column. Band thresholds default to `[80, 100]` with higher-is-better coloring (lime ≥ 100, amber 80–99, red < 80). Pass `invertBand` for lower-is-better metrics. Column definitions use a `cell` render function so any data shape works. Use for top advancers/decliners, progressed opps, new opps, or any ranked list with a % column.

```tsx
import type { CSSProperties, ReactNode } from 'react'

/**
 * Editorial score table with WGU Blue header and an optional
 * percentage-banded column (used for "% to Target"). Per
 * MBR_V2_BUILD_SPEC.md Phase 2.
 *
 * Bands by value (default scheme, higher-is-better):
 *   >= 100  lime banner
 *   80-99   amber
 *   <  80   red
 *
 * Reuse for: Top Advancers, Top Decliners, Progressed Opps, New Opps.
 */

export type ScoreTableColumn<T> = {
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  colorBand?: boolean
  width?: string
}

export type ScoreTableProps<T> = {
  columns: ScoreTableColumn<T>[]
  rows: T[]
  eyebrow?: string
  bandThresholds?: [number, number]
  invertBand?: boolean
  emptyText?: string
  style?: CSSProperties
}

const BAND_GREEN = 'rgba(95, 168, 0, 0.18)'
const BAND_AMBER = 'rgba(217, 163, 59, 0.20)'
const BAND_RED = 'rgba(192, 57, 43, 0.18)'

function parseNumeric(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(/[,\s%+]/g, ''))
  return Number.isFinite(n) ? n : null
}

function bandColor(value: number, thresholds: [number, number], invert: boolean): string {
  const [low, high] = thresholds
  if (invert) {
    if (value <= low) return BAND_GREEN
    if (value <= high) return BAND_AMBER
    return BAND_RED
  }
  if (value >= high) return BAND_GREEN
  if (value >= low) return BAND_AMBER
  return BAND_RED
}

export function ScoreTable<T>({
  columns,
  rows,
  eyebrow,
  bandThresholds = [80, 100],
  invertBand = false,
  emptyText,
  style,
}: ScoreTableProps<T>) {
  return (
    <div style={{ ...style }}>
      {eyebrow && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-2)',
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
      )}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-display)',
        }}
      >
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{
                  background: 'var(--wgu-blue)',
                  color: 'var(--wgu-white)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '8px 10px',
                  textAlign: col.align ?? 'left',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '20px 10px',
                  textAlign: 'center',
                  color: 'var(--fg-3)',
                  fontFamily: 'var(--font-numeral)',
                  fontSize: 13,
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                {emptyText ?? '—'}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  background: ri % 2 === 0 ? 'var(--wgu-white)' : 'var(--bg-2)',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                {columns.map((col, ci) => {
                  const cell = col.cell(row)
                  const cellStyle: CSSProperties = {
                    padding: '8px 10px',
                    textAlign: col.align ?? 'left',
                    fontSize: 13,
                    color: 'var(--wgu-blue)',
                  }
                  if (col.colorBand) {
                    const num = parseNumeric(cell as unknown)
                    if (num != null) {
                      cellStyle.background = bandColor(num, bandThresholds, invertBand)
                      cellStyle.fontWeight = 700
                    }
                  }
                  return (
                    <td key={ci} style={cellStyle}>
                      {cell}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

## Sub-paths to expect

- `/` — overview / role picker (home)
- `/role/[role]` — main work surface (form + submission)
- `/role/[role]/preview` — read-only slide preview for the current user
- `/history` — past submissions across all roles
- `/admin` — director/admin dashboard listing all submissions
- `/admin/[role]/[rowId]` — admin drill-in: full slide preview + comments thread
- `/settings/profile` — user profile (shared, from `_common`)

## What a deep app does NOT need

- No command palette — that is a launcher concern (see [archetypes-launcher.md](./archetypes-launcher.md))
- No app chip row — one app, not a hub; the nav is scoped to this tool's pages
- No per-app access gating across the whole app — the whole app is one access scope; gate at the deep app's roles (e.g. `ROLES.includes(roleParam)`) rather than at the app level
- No bento home — overview/picker pages are simpler; a bento grid implies multiple equal-weight destinations

---

See also: [app-shell.md](./app-shell.md), [design-primitives.md](./design-primitives.md) for primitives composed by `viz/`, [archetypes-launcher.md](./archetypes-launcher.md) for the alternative archetype, [auth.md](./auth.md) for role-based gating.
