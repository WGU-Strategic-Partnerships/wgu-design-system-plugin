# WGU Motion and Animation

## Principles

WGU motion is **restrained, functional, and ease-out**. It exists to communicate state changes and hierarchy, not to entertain. The brand reads modern and trustworthy. Bouncy, elastic, or rotational motion undercuts that.

## Easing curves

| Token | Value | Use |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0.2, 1)` | Default for state changes |
| `--ease-emphasis` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Emphasized transitions (modal open, hero reveal) |

Both are ease-out variants. Avoid linear, ease-in, or ease-in-out.

## Durations

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 120ms | Hover state, tooltip, pressed feedback |
| `--dur-base` | 220ms | State change, color shift, reveal |
| `--dur-slow` | 420ms | Route or modal entry, page transitions |

Never exceed 500ms for a UI animation. Anything longer feels slow.

## Approved motion vocabulary

- **Fades.** Opacity 0 to 1, paired with translate.
- **Gentle slides.** Translate by 4 to 16px on the relevant axis.
- **Color shifts.** Background, border, or text color transitioning between states.
- **Subtle lift.** TranslateY -2px combined with shadow change for cards on hover.

## Forbidden motion

- **No bounces.** No overshoot. Springs that overshoot then settle feel toy-like.
- **No elastic.** Same reason.
- **No rotations** as decoration. (Rotation is fine for an explicit "rotate" action like an expand caret.)
- **No spinning** for loading unless it is a small UI spinner. Avoid hero-scale spinning effects.
- **No parallax** on hero photography. The brand reads modern and serious, not movie-trailer.

## Hover and focus states

- **Primary button.** Background darkens approximately 8% on hover. Focus ring on `:focus-visible`.
- **Secondary button.** Fills to Blue Midnight on hover. Text becomes white.
- **Link.** Color shifts from `--fg-link` (Medium Blue) to `--fg-link-hover` (deeper blue, `#0057C2`). Underline persists.
- **Card.** TranslateY -2px, shadow upgrades from `--shadow-sm` to `--shadow-md`.

## Press states

- **No shrink.** Do not scale a button down on press. It feels toy-like.
- **Small darken.** Approximately 12% darker on press, returning to base on release.
- **Shadow drop.** Card or button shadow steps back down to `--shadow-sm` momentarily.

## Page entry

When a route changes:

- **Fade and slide.** New content fades in from opacity 0 to 1 over `--dur-slow` and translates from 8px below.
- **Easing.** `--ease-emphasis`.

## Loading

- **Skeletons.** Use neutral light-grey skeleton blocks with a slow shimmer (1.4s cycle). Skeletons better preserve layout integrity than spinners.
- **Spinner.** Small inline spinners are acceptable for inline actions. Use Medium Blue on a light surface, white on a dark surface.

## Reduced motion

Always honor `prefers-reduced-motion: reduce`. Disable slides and shimmers, keep necessary state-change color shifts, and use instantaneous transitions where motion would be uncomfortable.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Mistakes to avoid

- Long durations for hover. Keep hover at 120ms.
- Bouncy springs.
- Removing focus ring transitions for "cleanliness". Keep them.
- Using motion as decoration. If a motion does not communicate a state change, it does not belong.
