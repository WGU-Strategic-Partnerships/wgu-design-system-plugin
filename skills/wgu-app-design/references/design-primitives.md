# Design primitives

The 8 primitives below live at `@/components/ui` and are imported from a single barrel. They were lifted verbatim from MBR Builder's design handoff (`design_handoff_mbr_builder/reference_designs/shared.jsx`) and are used by both MBR Builder (canonical home) and WGU.tools (copied in). Before reaching for a new component, check this list. For color token reference, see the sibling [`wgu-design` skill](../../wgu-design/).

## Barrel export

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/index.ts -->
```ts
/**
 * Shared component vocabulary, ported from the WGU MBR Builder design handoff:
 * design_handoff_mbr_builder/reference_designs/shared.jsx.
 *
 * For Lucide icons, import directly from lucide-react. The packet's `Icon` name
 * registry maps 1:1 to lucide names (e.g. `chevron-r` → `ChevronRight`).
 */

export { Eyebrow } from './eyebrow'
export { Numeral } from './numeral'
export { Arrow } from './arrow'
export { Delta, type DeltaTone } from './delta'
export { WGUMark } from './wgu-mark'
export { StatusPill, type StatusKind } from './status-pill'
export { RoleChip } from './role-chip'
export { Hairline } from './hairline'
```

---

### Eyebrow

Small uppercase label — Jost 700, 11–13 px, 0.18 em tracking — placed above a heading, stat, or section to name what follows.

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/eyebrow.tsx -->
```tsx
import type { CSSProperties, ReactNode } from 'react'

/**
 * Small uppercase label sitting above a heading, stat, or section.
 * Per design system: Jost 700, 11-13px, 0.18em tracking, primary text color.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Eyebrow
 */
export function Eyebrow({
  children,
  color,
  size = 11,
  style,
}: {
  children: ReactNode
  color?: string
  size?: number
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: color ?? 'var(--fg-1)',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
```

**Use when:** labeling a KPI card, chart section, or form group with a short category name.  
**Don't use when:** the label needs to be body text weight or lower contrast — use `--fg-2` prose instead.

---

### Numeral

Tabular serif span using `--font-numeral` with `lining-nums tabular-nums` feature settings. For any isolated number: KPI values, chart axis labels, big-stat callouts.

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/numeral.tsx -->
```tsx
import type { CSSProperties, ReactNode } from 'react'

/**
 * Tabular serif numeral. Used for any isolated number: KPI values, chart
 * axis labels, big-stat callouts. Never use the body sans for these.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Numeral
 */
export function Numeral({
  children,
  size = 36,
  weight = 600,
  color,
  style,
}: {
  children: ReactNode
  size?: number
  weight?: number
  color?: string
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-numeral)',
        fontVariantNumeric: 'lining-nums tabular-nums',
        fontFeatureSettings: '"lnum", "tnum"',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: color ?? 'var(--fg-1)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
```

**Use when:** displaying any standalone numeric value — percentages, counts, dollar amounts.  
**Don't use when:** the number is inline within a sentence of body copy — let it inherit body styles.

---

### Arrow

Tiny SVG triangle (up / down / flat) with no stroke. Used internally by `Delta` and `StatusPill`; can be used standalone for chart annotations.

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/arrow.tsx -->
```tsx
/**
 * Tiny directional triangle for delta indicators and chart annotations.
 * Used inside Delta and StatusPill. Square corners, no stroke.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Arrow
 */
export function Arrow({
  dir,
  color,
  size = 10,
}: {
  dir: 'up' | 'down' | 'flat'
  color: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden
    >
      {dir === 'up' && <path d="M5 1 L9 7 L1 7 Z" fill={color} />}
      {dir === 'down' && <path d="M5 9 L1 3 L9 3 Z" fill={color} />}
      {dir === 'flat' && <rect x="1" y="4.5" width="8" height="1" fill={color} />}
    </svg>
  )
}
```

**Use when:** a directional cue is needed alongside a numeric delta or annotation marker.  
**Don't use when:** you need a navigational arrow (chevron) — use `ArrowLeft` / `ArrowRight` from `lucide-react`.

---

### Delta

Inline change indicator — `+12.4%` with a matching `Arrow`. Shows movement vs. prior period. Exports the `DeltaTone` union type (`'up' | 'down' | 'flat'`).

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/delta.tsx -->
```tsx
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
```

**`DeltaTone`** — exported type: `'up' | 'down' | 'flat'`. Pass `weak` to mute the color to `--fg-3` when context is low-priority.

**Use when:** showing period-over-period change on a KPI card or scorecard row.  
**Don't use when:** the change is not a numeric delta — use prose or `StatusPill` for state changes.

---

### WGUMark

Compact WGU brand lockup: owl icon + `WGU` wordmark at 13 px Jost 800. This is the canonical mark used in the app shell `HeaderNav`. Per brand rules the mark is never recolored; pass `inverted` for the white treatment on dark surfaces. For full lockup logos, defer to the sibling `wgu-design` skill.

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/wgu-mark.tsx -->
```tsx
import Image from 'next/image'

/**
 * Compact WGU brand lockup: owl icon + "WGU" wordmark. Per brand rules the
 * actual mark is never recolored or redrawn — when on a dark surface, pass
 * `inverted` to use the white treatment via CSS filter.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → WGUMark
 */
export function WGUMark({
  inverted = false,
  size = 22,
}: {
  inverted?: boolean
  size?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Image
        src="/wgu-owl-icon.png"
        alt="WGU"
        width={size}
        height={size}
        style={{
          height: size,
          width: 'auto',
          display: 'block',
          filter: inverted ? 'brightness(0) invert(1)' : 'none',
        }}
        priority
      />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '0.14em',
          color: inverted ? 'var(--wgu-white)' : 'var(--wgu-blue)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        WGU
      </span>
    </div>
  )
}
```

**Use when:** placing the WGU brand identity in a header, nav bar, or login surface.  
**Don't use when:** a full horizontal or stacked lockup with the university name is required — consult brand assets in the `wgu-design` skill.

---

### StatusPill

Outline status indicator: small colored dot + uppercase label. No fill. Exports `StatusKind` type (`'submitted' | 'draft' | 'overdue' | 'notstarted'`).

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/status-pill.tsx -->
```tsx
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
```

**`StatusKind`** — exported type: `'submitted' | 'draft' | 'overdue' | 'notstarted'`. Pass a custom `label` to override the built-in map string.

**Use when:** indicating workflow state on a pipeline table row or admin list.  
**Don't use when:** you need a filled badge with background color — StatusPill is intentionally type+dot only.

---

### RoleChip

Outlined chip with a 3 px left accent rule and role short code. Square corners, Jost 700. Depends on `ROLE_ACCENT` and `ROLE_LABELS` from `@/lib/mbr-sheets`.

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/role-chip.tsx -->
```tsx
import { ROLE_ACCENT, ROLE_LABELS, type Role } from '@/lib/mbr-sheets'

/**
 * Outlined chip with a 3px left accent rule + role short code. Square corners.
 * Used wherever a role indicator is needed in the admin UI and on rows.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → RoleChip
 */
export function RoleChip({
  role,
  size = 'sm',
}: {
  role: Role
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? { fs: 10, py: 3, px: 7 } : { fs: 11, py: 4, px: 9 }
  const accent = ROLE_ACCENT[role]
  const short: string = role
  return (
    <span
      title={ROLE_LABELS[role]}
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
      {short}
    </span>
  )
}
```

**Use when:** displaying a user's role code inline on an admin row or assignment form.  
**Don't use when:** showing a generic tag or category label unrelated to MBR roles — use a plain styled span.

---

### Hairline

1 px horizontal rule that replaces shadows and heavier borders. Default color is `--rule` (soft brand-blue); pass `strong` for `--rule-strong` on hover/active separators.

<!-- /Users/bentley/Documents/Claude/Projects/mbr-builder/src/components/ui/hairline.tsx -->
```tsx
import type { CSSProperties } from 'react'

/**
 * 1px-tall horizontal rule. Replaces shadows and heavier borders across the
 * admin tables and form sections. Default color is the soft brand-blue rule;
 * pass `strong` to use the stronger variant for hover or active separators.
 *
 * Source: design_handoff_mbr_builder/reference_designs/shared.jsx → Hairline
 */
export function Hairline({
  strong = false,
  style,
}: {
  strong?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      style={{
        height: 1,
        background: strong ? 'var(--rule-strong)' : 'var(--rule)',
        ...style,
      }}
    />
  )
}
```

**Use when:** separating sections of a table, form, or card stack.  
**Don't use when:** you need a vertical separator — use an inline `border-left` instead.

---

## Approved Lucide icon set

The icons below are currently in use across WGU.tools and MBR Builder. Reuse from this set before introducing new icons.

| Lucide name | Used for |
|---|---|
| `Activity` | user menu — recent-activity link |
| `AlertCircle` | login error states |
| `ArrowLeft` | back navigation |
| `ArrowRight` | forward navigation, app tile CTAs |
| `BarChart3` | analytics / usage category icon |
| `BookOpen` | app tile category icon |
| `CalendarCheck` | app tile category icon |
| `Check` | form submission confirmation |
| `CheckSquare` | app tile category icon |
| `ChevronDown` | collapsible panel toggles |
| `ChevronRight` | drill-down row indicators |
| `Clock` | recent-activity timestamps |
| `Cloud` | MBR form save-to-cloud indicator |
| `Compass` | Field Team category icon in nav |
| `Cpu` | app tile category icon |
| `Crown` | Leadership category icon in nav |
| `Download` | export CSV / download actions |
| `Eye` | impersonation / view-as indicator |
| `FileText` | app tile category icon |
| `GraduationCap` | app tile category icon |
| `LayoutTemplate` | app tile category icon |
| `Loader2` | async loading spinner |
| `LogOut` | sign-out action |
| `PieChart` | app tile category icon |
| `Plus` | add-member / add-row actions |
| `Search` | command palette trigger |
| `SearchX` | empty search state |
| `Shield` | admin role indicator in user menu |
| `Sparkles` | AI-assist indicator in MBR form |
| `Star` | favorites / starred apps |
| `Ticket` | app tile category icon |
| `Trash2` | destructive remove actions |
| `User` | user account row in admin table |
| `UserCog` | user settings link in user menu |
| `Users` | team / roster category icon |
| `Wrench` | Ops Team category icon in nav |
| `X` | dismiss / close actions |

---

## Cross-link to brand tokens

Every primitive above consumes CSS custom properties from `globals.css` — for example `--wgu-blue`, `--fg-1`, `--fg-2`, `--fg-3`, `--pos`, `--neg`, `--rule`, `--rule-strong`, `--bg-page`. For the full token list see the sibling `wgu-design` skill's `colors_and_type.css` and `README.md`.

---

See also: [app-shell.md](./app-shell.md) for `WGUMark` usage in `HeaderNav`, the sibling `wgu-design` skill for brand color tokens, [archetypes-launcher.md](./archetypes-launcher.md) and [archetypes-deep-app.md](./archetypes-deep-app.md) for how these primitives compose in each shape.
