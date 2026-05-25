import Image from 'next/image'

/**
 * Compact WGU brand lockup: owl icon + "WGU" wordmark. Per brand rules the
 * actual mark is never recolored or redrawn — when on a dark surface, pass
 * `inverted` to use the white treatment via CSS filter.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → WGUMark
 */
export function WGUMark({
  inverted = false,
  size = 22,
}: {
  inverted?: boolean
  size?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Image
        src="/wgu-owl-icon.png"
        alt="WGU"
        width={size}
        height={size}
        style={{
          height: size,
          width: 'auto',
          display: 'block',
          filter: inverted ? 'brightness(0) invert(1)' : 'none',
        }}
        priority
      />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '0.14em',
          color: inverted ? 'var(--wgu-white)' : 'var(--wgu-blue)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        WGU
      </span>
    </div>
  )
}
