import { Arrow } from './arrow'

/**
 * Change indicator like "+12.4%" with an arrow. Used inside KPI cards and
 * scorecards to show movement vs. prior period.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Delta
 */
export type DeltaTone = 'up' | 'down' | 'flat'

export function Delta({
  value,
  suffix = '',
  tone,
  weak = false,
}: {
  value: string | number
  suffix?: string
  tone: DeltaTone
  weak?: boolean
}) {
  const map: Record<DeltaTone, { color: string; dir: DeltaTone; sign: string }> = {
    up: { color: 'var(--pos)', dir: 'up', sign: '+' },
    down: { color: 'var(--neg)', dir: 'down', sign: '' },
    flat: { color: 'var(--fg-3)', dir: 'flat', sign: '' },
  }
  const t = map[tone] || map.flat
  const color = weak ? 'var(--fg-3)' : t.color
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        fontWeight: 600,
        fontSize: 12,
        color,
        letterSpacing: '0.02em',
      }}
    >
      <Arrow dir={t.dir} color={color} size={8} />
      {t.sign}
      {value}
      {suffix}
    </span>
  )
}
