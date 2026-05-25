import type { CSSProperties } from 'react'

/**
 * Tiny horizontal-bar mini-chart used as a sub-visualization (e.g. a lead
 * source share strip beneath a mini-grid). Each row: `label` (left), bar
 * (middle, width = value/max), `value` (right).
 *
 * Pure CSS — no SVG needed since these are simple rectangles.
 *
 * Generic data-display primitive — no MBR-specific logic.
 */

export type HBarItem = {
  label: string
  value: number | string | null | undefined
  /** Bar fill color. */
  color: string
}

export type HBarProps = {
  items: HBarItem[]
  /**
   * Override the scale denominator. By default we scale to the largest item
   * so the longest bar fills the row.
   */
  max?: number
  /** Width allocated to the label column. Default 110. */
  labelWidth?: number
  /** Height of each bar in pixels. Default 8. */
  barHeight?: number
  /** Format the right-hand value column. */
  formatValue?: (v: number) => string
  style?: CSSProperties
}

function parseNum(v: number | string | null | undefined): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function HBar({
  items,
  max,
  labelWidth = 110,
  barHeight = 8,
  formatValue,
  style,
}: HBarProps) {
  const values = items.map((i) => parseNum(i.value))
  const denom = max ?? Math.max(1, ...values)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {items.map((item, i) => {
        const v = values[i]
        const pct = denom > 0 ? (v / denom) * 100 : 0
        const display = formatValue ? formatValue(v) : v.toLocaleString()
        return (
          <div
            key={item.label}
            style={{
              display: 'grid',
              gridTemplateColumns: `${labelWidth}px 1fr 50px`,
              gap: 10,
              alignItems: 'center',
              fontFamily: 'var(--font-display)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--fg-2)',
                letterSpacing: '0.04em',
              }}
            >
              {item.label}
            </span>
            <div
              style={{
                position: 'relative',
                height: barHeight,
                background: 'var(--rule)',
                borderRadius: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: item.color,
                  transition: 'width 220ms var(--ease-standard)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-numeral)',
                fontWeight: 500,
                fontSize: 13,
                color: 'var(--wgu-blue)',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {display}
            </span>
          </div>
        )
      })}
    </div>
  )
}
