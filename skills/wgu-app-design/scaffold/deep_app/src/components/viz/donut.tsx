import type { CSSProperties } from 'react'

/**
 * Donut chart with center total + tight legend underneath.
 *
 * Used for: segment/category split visualizations.
 * Generic data-display primitive — no MBR-specific logic.
 */

export type DonutSlice = {
  label: string
  value: number | string | null | undefined
  color: string
}

export type DonutProps = {
  /** Title rendered above the donut. Optional. */
  label?: string
  /** Slice data. */
  slices: DonutSlice[]
  /** Override center total (defaults to sum of slice values). */
  total?: number | string
  /** Diameter in pixels. Default 110. */
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
