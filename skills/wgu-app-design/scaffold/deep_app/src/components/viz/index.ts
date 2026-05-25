/**
 * Visualization library — pure-SVG / inline-style chart and tile components.
 *
 * No external chart deps. Each component takes simple data and renders.
 * All primitives are generic (no MBR-specific business logic).
 */

export { KpiCard, type KpiCardProps } from './kpi-card'
export { Gauge, type GaugeProps, type GaugeSize } from './gauge'
export { PacingGauge, type PacingGaugeProps } from './pacing-gauge'
export { Sparkline, type SparklineProps, type SparklineDatum } from './sparkline'
export { Funnel, type FunnelProps, type FunnelStage } from './funnel'
export { Donut, type DonutProps, type DonutSlice } from './donut'
export { ScoreTable, type ScoreTableProps, type ScoreTableColumn } from './score-table'
export { HBar, type HBarProps, type HBarItem } from './hbar'

/**
 * Example pipeline stage colors (WGU palette). Import these in your Funnel
 * callers so you don't have to repeat the palette every time.
 *
 * __APP_NAME__: rename or replace to match your own pipeline stages.
 */
export const PIPELINE_STAGE_COLORS = {
  discovery: '#0070F0',
  intake: '#46B1EF',
  pitch: '#7B3FF2',
  negotiation: '#B07BE8',
  signing: '#0FB594',
} as const
