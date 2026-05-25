import type { CSSProperties } from 'react'

/**
 * 1px-tall horizontal rule. Replaces shadows and heavier borders across the
 * admin tables and form sections. Default color is the soft brand-blue rule;
 * pass `strong` to use the stronger variant for hover or active separators.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Hairline
 */
export function Hairline({
  strong = false,
  style,
}: {
  strong?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      style={{
        height: 1,
        background: strong ? 'var(--rule-strong)' : 'var(--rule)',
        ...style,
      }}
    />
  )
}
