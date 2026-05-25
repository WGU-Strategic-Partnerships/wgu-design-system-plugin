/**
 * __APP_NAME__: replace with your own exec-present / detail-view component.
 *
 * For the full MBR Builder reference implementation, see:
 *   `skills/wgu-app-design/references/archetypes-deep-app.md`
 *
 * The original SlidePreview in MBR Builder is 3793 lines and contains
 * per-role slide layouts, forecast tables, opportunity rollups, YTD
 * sparklines, and exec-present logic specific to the monthly business review.
 * It is not included here because:
 *   (a) it is entirely MBR-specific business logic, and
 *   (b) its size would make the scaffold unusable as a template.
 *
 * This stub exports a placeholder `SlidePreview` component that renders as
 * a labeled box. It accepts the same top-level props so callers that import
 * it (e.g. admin/[role]/[rowId]/page.tsx) typecheck correctly. Swap in your
 * real implementation when ready.
 */

import type { CSSProperties } from 'react'

export type SlidePreviewProps = {
  /** __APP_NAME__: role identifier for the record being previewed. */
  role: string
  /** __APP_NAME__: raw data payload — shape is app-specific. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any> | null
  /** Display name of the record owner. */
  name?: string | null
  /** Period label (e.g. "May 2026"). */
  month?: string | null
  /** Vertical / segment identifier, if applicable. */
  vertical?: string | null
  /** ISO timestamp when the record was submitted. */
  submittedAt?: string | null
  /** Historical data points for sparkline / trend rendering. */
  trajectory?: Array<{ monthKey: string; monthLabel: string; data: Record<string, unknown> }>
  style?: CSSProperties
}

export default function SlidePreview({
  role,
  name,
  month,
  style,
}: SlidePreviewProps) {
  return (
    <div
      style={{
        background: 'var(--bg-2)',
        border: '2px dashed var(--border-soft)',
        borderRadius: 8,
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--fg-3)',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        __APP_NAME__ · SlidePreview placeholder
      </div>
      <div
        style={{
          fontFamily: 'var(--font-numeral)',
          fontSize: 15,
          color: 'var(--wgu-blue)',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {name ?? 'Unknown'} — {role} — {month ?? '—'}
      </div>
      <p style={{ fontSize: 13, margin: 0 }}>
        Replace this component with your own detail/preview view.
        <br />
        See <code>references/archetypes-deep-app.md</code> for the full MBR Builder implementation.
      </p>
    </div>
  )
}
