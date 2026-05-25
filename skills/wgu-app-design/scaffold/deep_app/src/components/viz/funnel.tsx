import type { CSSProperties } from 'react'

/**
 * Pipeline funnel: horizontal bars stacked vertically, each narrower
 * than the one above so the silhouette reads as a funnel.
 *
 * - Stage labels render right of each bar in muted Jost.
 * - Counts render inside each bar in white bold.
 * - Title sits above with the total in Newsreader 600 next to it.
 *
 * Generic data-display primitive — no MBR-specific logic.
 */

export type FunnelStage = {
  label: string
  count: number | string | null | undefined
  color: string
}

export type FunnelProps = {
  /** Title rendered above the funnel. */
  title: string
  /**
   * Total count rendered next to the title in Newsreader 600. If
   * omitted, derived from the sum of `stages` counts.
   */
  total?: number | string
  /**
   * Stages, top to bottom. The first is the widest.
   * Example stage colors (WGU palette):
   *   Discovery   → '#0070F0' (Medium Blue)
   *   Intake      → '#46B1EF' (Sky Blue)
   *   Pitch       → '#7B3FF2' (purple)
   *   Negotiation → '#B07BE8' (light purple)
   *   Signing     → '#0FB594' (teal)
   */
  stages: FunnelStage[]
  width?: number
  /** Bar height in pixels. Default 30. */
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
