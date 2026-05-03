# WGU Components: Buttons

## Three button variants

WGU UI uses three button variants. They are not interchangeable.

| Variant | Purpose | Visual |
| --- | --- | --- |
| **Primary** | The single most important action on a screen | Solid Medium Blue background, white text |
| **Secondary** | Supporting actions, navigation between steps | White background, WGU Blue border, WGU Blue text |
| **Tertiary (text)** | Low-emphasis or tertiary actions | No fill, no border, Medium Blue text only |

Only one **primary** button per primary user task. If you have two primary buttons, you have not picked a primary action.

## Sizing

| Size | Height | Padding (horizontal) | Type size |
| --- | --- | --- | --- |
| Default | 44px | 24px | 16px |
| Compact | 36px | 16px | 14px |
| Large | 56px | 32px | 18px |

44px is the default. 36px is for dense UI (toolbars, table row actions). 56px is for hero CTAs.

## Shape

- **Radius.** `--radius-md` (8px) by default. Use `--radius-pill` (999px) for marketing CTAs and "Apply Now" pill buttons.
- **Borders.** Primary has no border. Secondary has a 2px WGU Blue border. Tertiary has none.
- **Min-width.** 96px on desktop, 80px on mobile.

## States

### Primary button

- **Rest.** `background: var(--wgu-medium-blue);` `color: var(--wgu-white);`
- **Hover.** Background darkens approximately 8% (use `#005EC8`).
- **Press.** Background darkens approximately 12% (use `#0050A8`). No shrink.
- **Disabled.** `background: var(--wgu-grey);` `color: var(--wgu-white);` `opacity: 1;` (Do not lower opacity for disabled state.)
- **Focus.** Add `box-shadow: var(--shadow-focus);`

### Secondary button

- **Rest.** `background: var(--wgu-white);` `color: var(--wgu-blue);` `border: 2px solid var(--wgu-blue);`
- **Hover.** `background: var(--wgu-blue);` `color: var(--wgu-white);`
- **Press.** Background steps to Midnight (`#001731`).
- **Disabled.** Border and text become `var(--wgu-grey)`.
- **Focus.** Same focus ring as primary.

### Tertiary (text) button

- **Rest.** `color: var(--wgu-medium-blue);` no border, no fill.
- **Hover.** Color shifts to `--fg-link-hover` (`#0057C2`). Optional 2px underline.
- **Disabled.** `color: var(--wgu-grey);`

## Icon usage

Icons in buttons use the Lucide stand-in for Simple Icons.

- **Leading icon.** 16 to 20px icon, 8px gap to label.
- **Trailing icon.** Reserved for "next", "external link", "expand" affordances. 16px gap.
- **Icon-only button.** 44x44px square. Always include `aria-label`.

## CTA copy guidelines

- **Strong verbs.** "Apply now". "Request info". "Talk to a counselor".
- **Sentence case** by default. Title Case acceptable for marquee marketing CTAs.
- **No periods.** Buttons are commands, not sentences.
- **Length.** 1 to 4 words.

## Common patterns

### Primary plus secondary

```
[ Apply now ]   [ Request info ]
```

The primary commits, the secondary explores. Primary is always to the left in left-to-right languages.

### Hero CTA

```
[ Apply now → ]
```

Use the pill radius (999px), large size (56px height), and Lime accent only if it is the single accent moment of the page.

## What not to do

- Do not use Lime Green as a button background. Lime is an accent, not a CTA color.
- Do not stack three or more primary buttons in a row.
- Do not remove the focus ring.
- Do not use red-only error styling on a destructive primary button. Pair red with a confirmation step.
