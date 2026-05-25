import type { CSSProperties } from 'react'

/**
 * Bar sparkline — compact trajectory chart with no axes. Used for YTD
 * history visualization next to a KPI card or pacing gauge.
 *
 * Bars sit on an implicit zero baseline. The last bar is highlighted in
 * the WGU primary blue ("pop") to anchor the eye on the current period;
 * earlier bars use the WGU sky-blue accent.
 *
 * Empty / partial-data behavior: if fewer than `expectedBars` bars are
 * provided, renders only what we have and surfaces a small "n months of
 * history" caption so the chart doesn't lie about coverage.
 *
 * Generic data-display primitive — no MBR-specific logic.
 */

export type SparklineDatum = {
  /** Short label, used in alt text. e.g. "Apr 2026". Optional. */
  label?: string
  value: number
}

export type SparklineProps = {
  /** Bars in chronological order, oldest → newest. */
  data: SparklineDatum[]
  /**
   * Total slot count we'd ideally show (e.g. 11 for an 11-period window).
   * Used to compute partial-data captions. Defaults to `data.length`.
   */
  expectedBars?: number
  /** Width in px. Default 320. */
  width?: number
  /** Height in px. Default 110. */
  height?: number
  /** Color of the trailing "current" bar. Defaults to --wgu-blue. */
  popColor?: string
  /** Color of historical bars. Defaults to --wgu-sky-blue. */
  barColor?: string
  /** Caption format for partial data. Pass null to suppress. */
  partialCaption?: ((shown: number, expected: number) => string) | null
  style?: CSSProperties
}

const DEFAULT_PARTIAL = (shown: number, expected: number) =>
  `${shown} of ${expected} periods of history`

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
