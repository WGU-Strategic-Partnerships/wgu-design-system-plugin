import type { CSSProperties, ReactNode } from 'react'

/**
 * Tabular serif numeral. Used for any isolated number: KPI values, chart
 * axis labels, big-stat callouts. Never use the body sans for these.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Numeral
 */
export function Numeral({
  children,
  size = 36,
  weight = 600,
  color,
  style,
}: {
  children: ReactNode
  size?: number
  weight?: number
  color?: string
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-numeral)',
        fontVariantNumeric: 'lining-nums tabular-nums',
        fontFeatureSettings: '"lnum", "tnum"',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: color ?? 'var(--fg-1)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
