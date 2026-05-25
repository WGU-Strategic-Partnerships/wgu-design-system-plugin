/**
 * Outline status indicator with a small colored dot to the left. Used in the
 * admin pipeline table. No fill — typography + dot only.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → StatusPill
 */
export type StatusKind = 'submitted' | 'draft' | 'overdue' | 'notstarted'

const MAP: Record<StatusKind, { fg: string; label: string; dot: string }> = {
  submitted: { fg: 'var(--wgu-blue)', label: 'Submitted', dot: 'var(--pos)' },
  draft: { fg: 'var(--fg-2)', label: 'In draft', dot: 'var(--fg-3)' },
  overdue: { fg: 'var(--neg)', label: 'Overdue', dot: 'var(--neg)' },
  notstarted: { fg: 'var(--fg-3)', label: 'Not started', dot: 'var(--wgu-light-grey)' },
}

export function StatusPill({ status, label }: { status: StatusKind; label?: string }) {
  const m = MAP[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: m.fg,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: m.dot,
          display: 'inline-block',
        }}
      />
      {label ?? m.label}
    </span>
  )
}
