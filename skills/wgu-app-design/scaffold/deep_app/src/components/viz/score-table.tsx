import type { CSSProperties, ReactNode } from 'react'

/**
 * Editorial score table with WGU Blue header and an optional
 * percentage-banded column (used for "% to Target" type metrics).
 *
 * Bands by value (default scheme, higher-is-better):
 *   >= 100  lime banner
 *   80-99   amber
 *   <  80   red
 *
 * Reuse for: top performers, progressions, rankings, or any tabular data
 * where a single column benefits from color-banded context.
 *
 * Generic data-display primitive — no MBR-specific logic.
 */

export type ScoreTableColumn<T> = {
  /** Header label. */
  header: string
  /** Render function; receives the row and returns ReactNode (string ok). */
  cell: (row: T) => ReactNode
  /** Right-align numbers. */
  align?: 'left' | 'right' | 'center'
  /** When set, this column shows a colored band based on the cell value. */
  colorBand?: boolean
  /** Optional fixed column width (CSS string e.g. "80px"). */
  width?: string
}

export type ScoreTableProps<T> = {
  /** Column definitions, in display order. */
  columns: ScoreTableColumn<T>[]
  /** Data rows. */
  rows: T[]
  /** Optional eyebrow label rendered above the table. */
  eyebrow?: string
  /** Override the band thresholds. Default: [80, 100] with higher-is-better. */
  bandThresholds?: [number, number]
  /** Lower-is-better banding (e.g. for "% Behind Target"). */
  invertBand?: boolean
  /** Optional empty-state copy. Defaults to a serif italic em-dash. */
  emptyText?: string
  style?: CSSProperties
}

const BAND_GREEN = 'rgba(95, 168, 0, 0.18)'
const BAND_AMBER = 'rgba(217, 163, 59, 0.20)'
const BAND_RED = 'rgba(192, 57, 43, 0.18)'

function parseNumeric(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(/[,\s%+]/g, ''))
  return Number.isFinite(n) ? n : null
}

function bandColor(value: number, thresholds: [number, number], invert: boolean): string {
  const [low, high] = thresholds
  if (invert) {
    if (value <= low) return BAND_GREEN
    if (value <= high) return BAND_AMBER
    return BAND_RED
  }
  if (value >= high) return BAND_GREEN
  if (value >= low) return BAND_AMBER
  return BAND_RED
}

export function ScoreTable<T>({
  columns,
  rows,
  eyebrow,
  bandThresholds = [80, 100],
  invertBand = false,
  emptyText,
  style,
}: ScoreTableProps<T>) {
  return (
    <div style={{ ...style }}>
      {eyebrow && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-2)',
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
      )}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-display)',
        }}
      >
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{
                  background: 'var(--wgu-blue)',
                  color: 'var(--wgu-white)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '8px 10px',
                  textAlign: col.align ?? 'left',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '20px 10px',
                  textAlign: 'center',
                  color: 'var(--fg-3)',
                  fontFamily: 'var(--font-numeral)',
                  fontSize: 13,
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                {emptyText ?? '—'}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  background: ri % 2 === 0 ? 'var(--wgu-white)' : 'var(--bg-2)',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                {columns.map((col, ci) => {
                  const cell = col.cell(row)
                  const cellStyle: CSSProperties = {
                    padding: '8px 10px',
                    textAlign: col.align ?? 'left',
                    fontSize: 13,
                    color: 'var(--wgu-blue)',
                  }
                  if (col.colorBand) {
                    const num = parseNumeric(cell as unknown)
                    if (num != null) {
                      cellStyle.background = bandColor(num, bandThresholds, invertBand)
                      cellStyle.fontWeight = 700
                    }
                  }
                  return (
                    <td key={ci} style={cellStyle}>
                      {cell}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
