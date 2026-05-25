import type { CSSProperties, ReactNode } from 'react'
import { Delta, Numeral, type DeltaTone } from '@/components/ui'

/**
 * KPI tile used at the top of every data section. Editorial card with a
 * 2px role-accent rule on top, uppercase label, large Newsreader-italic
 * value, optional inline delta + sub label.
 *
 * Pure SVG / inline-style. No external deps beyond shared UI atoms.
 *
 * Generic data-display primitive — no MBR-specific logic.
 * `Delta` and `Numeral` are sourced from `@/components/ui` (provided by _common).
 */
export type KpiCardProps = {
  /** Uppercase label rendered above the value. */
  label: string
  /** The big number itself. Strings are passed through verbatim ("3,614", "101.7%", "—"). */
  value: ReactNode
  /** Optional delta chip rendered to the right of the value. */
  delta?: { value: string; tone: DeltaTone }
  /** Small caption under the row, e.g. "vs. last month" or "% to target". */
  sub?: string
  /** Role-accent color for the top rule. Defaults to WGU Medium Blue. */
  accent?: string
  /** Override the value font size; defaults to 56. */
  valueSize?: number
  /** Optional renderable underneath the value (e.g. a small Gauge). */
  belowValue?: ReactNode
  style?: CSSProperties
}

export function KpiCard({
  label,
  value,
  delta,
  sub,
  accent = 'var(--wgu-medium-blue)',
  valueSize = 56,
  belowValue,
  style,
}: KpiCardProps) {
  return (
    <div
      style={{
        borderTop: `2px solid ${accent}`,
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--wgu-blue)',
        }}
      >
        {label}
      </div>
      <Numeral size={valueSize} weight={700} color="var(--wgu-blue)">
        {value}
      </Numeral>
      {belowValue}
      {(delta || sub) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {delta ? <Delta value={delta.value} tone={delta.tone} /> : <span style={{ visibility: 'hidden' }}>—</span>}
          {sub && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--fg-2)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
