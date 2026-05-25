import type { CSSProperties, ReactNode } from 'react'

/**
 * Small uppercase label sitting above a heading, stat, or section.
 * Per design system: Jost 700, 11-13px, 0.18em tracking, primary text color.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Eyebrow
 */
export function Eyebrow({
  children,
  color,
  size = 11,
  style,
}: {
  children: ReactNode
  color?: string
  size?: number
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: color ?? 'var(--fg-1)',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
