# WGU Components: Badges and Chips

## Badge vs. chip

- **Badge.** A small label that communicates a status or category. Non-interactive.
- **Chip.** A small label that is selectable, removable, or filterable. Interactive.

Both share the same visual shape (pill), but their behavior differs.

## Visual spec

| Property | Value |
| --- | --- |
| Radius | `--radius-pill` (999px) |
| Height | 24px (default), 32px (large) |
| Padding | 12px horizontal |
| Type size | 12 to 13px |
| Type weight | Medium 500 |
| Type case | Sentence case (or ALL CAPS for eyebrow-style status badges) |

## Badge variants

| Variant | Background | Text | Use |
| --- | --- | --- | --- |
| **Neutral** | `--bg-3` (Light Grey) | `--fg-1` (WGU Blue) | Categories, "Bachelor's", "Online" |
| **Info** | `--wgu-light-blue` | `--wgu-blue` | Informational status, "New" |
| **Success** | `--wgu-lime` (use sparingly) | `--wgu-blue` | Completed, achieved |
| **Warning** | `#FFF4D6` (or palette-approved warning tint) | `--wgu-blue` | Action needed |
| **Error** | `#FBE6E6` | `#9C2B2B` | Failed, rejected |
| **Inverted** | `--wgu-blue` | `--wgu-white` | On light surfaces, when stronger emphasis is needed |

Use Lime Green sparingly. One Lime accent per layout. Multiple Lime success badges in a single grid undermine the "pop" intention.

## Chip behavior

- **Selectable chip.** Toggles between selected and unselected. Selected uses WGU Blue background, white text, no border. Unselected uses Light Grey background, WGU Blue text.
- **Removable chip.** Includes a leading or trailing `x` icon. Clicking the icon removes the chip.
- **Filter chip.** Behaves like a toggle. Multiple can be selected simultaneously in a filter row.

## Hover and focus

- **Hover.** Background darkens slightly. For example, Light Grey chips shift to a slightly darker grey, WGU Blue chips shift to Midnight.
- **Focus.** Visible focus ring (`--shadow-focus`). Always.

## Spacing

- **Internal.** 12px horizontal padding, 4 to 6px vertical (driven by 24px height).
- **Between chips in a row.** 8px gap.
- **Between chip and adjacent content.** 16px.

## Common patterns

### Program tile metadata

```
[ Bachelor's ]  [ Online ]  [ 4 years ]
```

Three neutral badges below the program title.

### Filter row

```
Showing: [ Bachelor's × ]  [ Cybersecurity × ]  [ Clear all ]
```

Removable filter chips with a "Clear all" tertiary button at the end.

### Status indicator

```
[ Completed ]   [ In progress ]   [ Not started ]
```

Status badges in their respective colors next to course or competency rows.

## What not to do

- Don't use a chip when a badge would do. If it isn't interactive, don't make it look interactive.
- Don't stack more than three or four badges next to a single content unit. The visual gets noisy.
- Don't apply a custom color outside the palette to a chip or badge.
- Don't use Lime Green as a default badge color. It is a single-accent moment.
