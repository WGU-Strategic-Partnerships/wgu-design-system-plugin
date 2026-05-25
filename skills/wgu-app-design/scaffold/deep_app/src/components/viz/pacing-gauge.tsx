import type { CSSProperties } from 'react'

/**
 * Horizontal banded pacing gauge — shows a value along a colored track.
 *
 * Three colored zones along a horizontal track (defaults: red 0–zoneA,
 * amber zoneA–zoneB, green zoneB–max). A solid fill bar indicates the
 * current value, optional vertical markers anchor the zone boundaries.
 *
 * Default direction is "higher is better" (red → amber → green). For
 * lower-is-better metrics pass `invert` and the colors flip (green → amber → red).
 *
 * Compose with KpiCard for big-number + gauge layouts.
 *
 * Generic data-display primitive — no MBR-specific logic.
 */

export type PacingGaugeProps = {
  /** Current numeric value being plotted along the track. */
  value: number | string | null | undefined
  /** Lower bound. Defaults to 0. */
  min?: number
  /** Upper bound. */
  max: number
  /**
   * Two threshold values that split the track into three colored zones.
   * Default scheme (higher-is-better): below `low` is red, between `low`
   * and `mid` is amber, above `mid` is green. With `invert` the order flips.
   */
  thresholds: [number, number]
  /** Lower-is-better — flips the zone color order. */
  invert?: boolean
  /** Track height in px. Defaults to 28. */
  height?: number
  /** Optional scale labels rendered under the track. Length 2–5. */
  scaleLabels?: string[]
  /** Optional fill color override. Defaults to band-of-current-value. */
  fillColor?: string
  /** Show target marker line at thresholds[1]. Defaults to true. */
  showThresholdMarker?: boolean
  style?: CSSProperties
}

const ZONE_GREEN_BG = 'rgba(46, 133, 64, 0.20)'
const ZONE_AMBER_BG = 'rgba(242, 169, 0, 0.20)'
const ZONE_RED_BG = 'rgba(181, 58, 42, 0.18)'

const FILL_GREEN = 'var(--pos)'
const FILL_AMBER = 'var(--amber)'
const FILL_RED = 'var(--neg)'

function parseValue(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(/[,\s%+]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function PacingGauge({
  value,
  min = 0,
  max,
  thresholds,
  invert = false,
  height = 28,
  scaleLabels,
  fillColor,
  showThresholdMarker = true,
  style,
}: PacingGaugeProps) {
  const numeric = parseValue(value)
  const hasValue = numeric != null

  const range = max - min
  const pctOf = (v: number) => Math.max(0, Math.min(1, (v - min) / range))

  // Zone breakpoints as percentages along the track.
  const zoneA = pctOf(thresholds[0])
  const zoneB = pctOf(thresholds[1])

  // Colors for the three bands, in display order (left → right).
  const [bgLeft, bgMid, bgRight] = invert
    ? [ZONE_GREEN_BG, ZONE_AMBER_BG, ZONE_RED_BG]
    : [ZONE_RED_BG, ZONE_AMBER_BG, ZONE_GREEN_BG]

  const trackBackground = `linear-gradient(to right, ${bgLeft} 0% ${zoneA * 100}%, ${bgMid} ${zoneA * 100}% ${zoneB * 100}%, ${bgRight} ${zoneB * 100}% 100%)`

  // Determine fill color from where the value lands.
  const computedFill = (() => {
    if (fillColor) return fillColor
    if (!hasValue) return FILL_AMBER
    const fraction = pctOf(numeric!)
    if (invert) {
      if (fraction <= zoneA) return FILL_GREEN
      if (fraction <= zoneB) return FILL_AMBER
      return FILL_RED
    }
    if (fraction >= zoneB) return FILL_GREEN
    if (fraction >= zoneA) return FILL_AMBER
    return FILL_RED
  })()

  const fillPct = hasValue ? pctOf(numeric!) * 100 : 0

  return (
    <div style={{ width: '100%', ...style }}>
      <div
        style={{
          position: 'relative',
          height,
          background: trackBackground,
          display: 'flex',
        }}
      >
        {hasValue && (
          <div
            data-pacing-fill
            style={{
              height: '100%',
              width: `${fillPct}%`,
              background: computedFill,
              transition: 'width 200ms var(--ease-standard, ease)',
            }}
          />
        )}
        {/* Threshold marker — solid line at the "target" boundary (typically 100%) */}
        {showThresholdMarker && (
          <div
            style={{
              position: 'absolute',
              left: `${zoneB * 100}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: 'var(--wgu-blue)',
              opacity: 0.5,
            }}
          />
        )}
      </div>
      {scaleLabels && scaleLabels.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-2)',
          }}
        >
          {scaleLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
