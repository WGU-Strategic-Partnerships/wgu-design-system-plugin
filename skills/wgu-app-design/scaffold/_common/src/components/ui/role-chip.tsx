/**
 * Outlined chip with a 3px left accent rule + role short code. Square corners.
 * Used wherever a role indicator is needed in the admin UI and on rows.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → RoleChip
 *
 * Note: the original MBR Builder version imports ROLE_ACCENT and ROLE_LABELS
 * from @/lib/mbr-sheets. This _common copy accepts those values as props so it
 * is portable across apps — callers supply their own role accent map.
 */
export function RoleChip({
  role,
  accent = 'var(--wgu-medium-blue)',
  label,
  size = 'sm',
}: {
  role: string
  /** Hex color or CSS var for the left-edge accent stripe. */
  accent?: string
  /** Optional long-form label shown in the title attribute. */
  label?: string
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? { fs: 10, py: 3, px: 7 } : { fs: 11, py: 4, px: 9 }
  return (
    <span
      title={label ?? role}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: dim.fs,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: `${dim.py}px ${dim.px}px`,
        color: 'var(--wgu-blue)',
        background: 'transparent',
        border: '1px solid var(--rule-strong)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 0,
        lineHeight: 1,
      }}
    >
      {role}
    </span>
  )
}
