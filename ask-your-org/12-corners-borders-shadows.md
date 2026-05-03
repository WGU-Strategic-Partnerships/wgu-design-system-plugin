# WGU Corners, Borders, and Shadows

## Corner radius

The WGU brand uses moderate, friendly corner radii. Not sharp (institutional, hard) and not heavily rounded (toy-like, casual).

| Token | Value | Use |
| --- | --- | --- |
| `--radius-0` | 0 | Photography, full-bleed surfaces |
| `--radius-sm` | 4px | Inputs, small chips, tight UI |
| `--radius-md` | 8px | Default. Cards, buttons, inputs |
| `--radius-lg` | 16px | Feature cards, marquee tiles |
| `--radius-pill` | 999px | Tag, status pill, CTA pill button |

When in doubt, use `--radius-md` (8px).

## Borders

WGU avoids heavy outlines. The brand prefers whitespace and elevation for separation between elements.

- **Thin border (default).** `1px solid rgba(0, 40, 85, 0.12)`. Used on cards sitting on white surfaces and on form inputs.
- **Strong border.** `2px solid var(--wgu-blue)`. Used on selected, active, or emphasized states.
- **Divider.** `1px solid var(--wgu-light-grey)`. Used between list rows, table rows, and section breaks where a heavier rule would feel old-fashioned.

## Borderless preferences

When a card or container sits on a tinted surface (Light Blue or Light Grey), drop the border. Let the contrast of surfaces do the visual work.

## Shadow elevation

WGU shadows are **soft and blue-tinted**, not pure black. Three steps cover almost every use case.

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-sm` | `0 1px 2px rgba(0, 23, 49, 0.08)` | Cards at rest |
| `--shadow-md` | `0 4px 12px rgba(0, 23, 49, 0.10)` | Cards on hover, menus |
| `--shadow-lg` | `0 12px 32px rgba(0, 23, 49, 0.14)` | Modals, floating panels, popovers |
| `--shadow-focus` | `0 0 0 3px rgba(0, 112, 240, 0.35)` | Keyboard focus ring (always visible) |

## Shadow rules

- Shadows are functional, not decorative. They communicate elevation and interactivity.
- Always tint shadows with WGU navy. Pure black shadows feel generic.
- Do not stack multiple shadows on a single element to create custom effects.

## Focus ring

Always visible, never disabled. The focus ring uses `--shadow-focus`: a 3px Medium Blue glow at 35% opacity.

```css
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
  border-radius: var(--radius-sm);
}
```

Removing the focus ring is an accessibility regression. Do not do it.

## Layering hierarchy

In a typical card-on-page layout:

1. **Page background.** White or Light Blue.
2. **Card surface.** White with `--shadow-sm` and either `--border-thin` (on white pages) or no border (on tinted pages).
3. **Card hover state.** Lift to `--shadow-md` and translate up by 2px.
4. **Modal.** White surface, `--shadow-lg`, sitting over a Midnight overlay at 60% opacity.

## Common mistakes

- Using pure black shadows. Always use the WGU navy tint.
- Removing the focus ring for "cleanliness". Keep it.
- Stacking thick borders **and** strong shadows on the same element. Pick one.
- Using `--radius-pill` on body content. Pills are for actions and tags only.
