import type { CSSProperties } from 'react'

/**
 * Half-circle gauge with three colored zones and a triangle pointer.
 *
 * - Three zones split by `thresholds: [low, mid]` so the arc reads
 *   below-target / approaching-target / on-target.
 * - Pointer rotates from -90deg (at min) to +90deg (at max) as a function
 *   of `(value - min) / (max - min)`.
 * - Center number in Newsreader 600. Label below in uppercase Jost 500.
 *
 * Default direction is "higher is better" (red -> amber -> green). Pass
 * `invert` for metrics where lower is better (e.g. Days Since Last Activity,
 * Avg Days to Close).
 *
 * Generic data-display primitive — no MBR-specific logic.
 */

export type GaugeSize = 'sm' | 'md' | 'lg'

const DIM: Record<GaugeSize, { width: number; height: number; valueFs: number; labelFs: number; arcStroke: number }> = {
  sm: { width: 120, height: 78, valueFs: 18, labelFs: 9, arcStroke: 10 },
  md: { width: 180, height: 112, valueFs: 24, labelFs: 10, arcStroke: 13 },
  lg: { width: 240, height: 150, valueFs: 32, labelFs: 11, arcStroke: 16 },
}

export type GaugeProps = {
  /** Numeric value being gauged. Strings are accepted and parsed; use null when missing. */
  value: number | string | null | undefined
  /** Lower bound of the arc. */
  min?: number
  /** Upper bound of the arc. */
  max: number
  /**
   * Two threshold values that split the arc into three colored zones:
   * `[zoneALimit, zoneBLimit]`. Anything <= zoneALimit is the first zone,
   * <= zoneBLimit is the second, > zoneBLimit is the third.
   *
   * Default scheme (higher-is-better): red -> amber -> green. With `invert`,
   * the order flips so lower values render in green and higher in red.
   */
  thresholds: [number, number]
  /** Visual size; defaults to `md`. */
  size?: GaugeSize
  /** Label rendered below the number, uppercase Jost 500. */
  label?: string
  /** Format the center number; defaults to `Math.round(v).toString()`. */
  formatValue?: (v: number) => string
  /** Lower-is-better (e.g. days-to-close). Inverts the color order. */
  invert?: boolean
  style?: CSSProperties
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
