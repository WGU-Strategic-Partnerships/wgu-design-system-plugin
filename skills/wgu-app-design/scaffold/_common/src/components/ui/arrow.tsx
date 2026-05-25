/**
 * Tiny directional triangle for delta indicators and chart annotations.
 * Used inside Delta and StatusPill. Square corners, no stroke.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Arrow
 */
export function Arrow({
  dir,
  color,
  size = 10,
}: {
  dir: 'up' | 'down' | 'flat'
  color: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden
    >
      {dir === 'up' && <path d="M5 1 L9 7 L1 7 Z" fill={color} />}
      {dir === 'down' && <path d="M5 9 L1 3 L9 3 Z" fill={color} />}
      {dir === 'flat' && <rect x="1" y="4.5" width="8" height="1" fill={color} />}
    </svg>
  )
}
