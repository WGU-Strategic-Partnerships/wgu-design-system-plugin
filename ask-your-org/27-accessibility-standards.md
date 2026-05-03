# WGU Accessibility Standards

## Target standard

WGU targets **WCAG 2.1 AA** at minimum on all digital surfaces. Public-facing properties should also pass automated and manual audits before launch.

## Color contrast

- **Body text on background.** 4.5:1 minimum.
- **Large text (18px+ regular or 14px+ bold).** 3:1 minimum.
- **UI components and graphical objects.** 3:1 minimum against adjacent colors.

### Compliant pairings (commonly used)

| Background | Text | Contrast |
| --- | --- | --- |
| White | WGU Blue (#002855) | 14.4:1 |
| Light Blue (#EEF6F9) | WGU Blue | 13.7:1 |
| WGU Blue | White | 14.4:1 |
| Midnight (#001731) | White | 18.0:1 |
| Medium Blue gradient | White | 7.6:1 (worst point) |

### Pairings to avoid

- Midnight background with Grey (#A7A7A7) text. Insufficient contrast.
- White background with Sky Blue (#46B1EF) text.
- White background with Lime Green (#97E152) text.
- Lime Green background with Medium or Sky Blue text. Vibration plus low contrast.

When in doubt, run the pairing through a contrast checker.

## Focus indicators

- **Always visible** on `:focus-visible`.
- **3px Medium Blue glow** at 35% opacity. Token: `--shadow-focus`.
- **Never disable** for "cleanliness" or "to look modern". The focus ring is the keyboard user's only navigation cue.

## Keyboard support

- All interactive elements operable by keyboard.
- Logical tab order matching visual order.
- Skip-to-content link as the first interactive element on every page.
- Escape closes modals and overlays.
- Arrow keys navigate within composite components (tabs, menus, listboxes).

## Screen reader support

- **Alt text** on all meaningful imagery. Decorative images use `alt=""`.
- **Labels** associated with form inputs.
- **Headings** in document order, no level skipping.
- **Landmarks** for major page regions (`header`, `main`, `nav`, `footer`, `aside`).
- **`aria-current="page"`** on the active navigation item.
- **`aria-live`** regions for dynamic updates that should be announced.

## Forms

- **Required fields** indicated with the word "required" in the label, not just an asterisk or color.
- **Errors** announced to screen readers. Anchor links from a form-level error summary to the offending fields.
- **Help text** programmatically associated via `aria-describedby`.
- **Validation** on blur, not on every keystroke.

## Motion and reduced motion

Honor `prefers-reduced-motion: reduce` in CSS.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Touch targets

- **Minimum 44x44px** for all interactive elements on touch surfaces.
- **8px minimum spacing** between adjacent touch targets.

## Type and readability

- **Body copy 18px** on web, never below 16px on mobile.
- **Line height** 1.4 to 1.6 for body copy.
- **Line length** 45 to 75 characters for optimal readability.
- **Avoid full-width body copy** on wide screens. Constrain to a comfortable measure.

## Imagery

- **No text in images** as a critical content delivery method. If text is in an image, also include it in the page text.
- **Captions** for video and audio.
- **Transcripts** for podcasts and long-form audio.
- **Audio description** for video content where visuals carry meaning.

## Language

- **Plain language** for student-facing copy. Read and edit at a reading level appropriate for adult learners.
- **Define jargon** on first use.
- **Set `lang` attribute** on the `html` element of every page.

## Common accessibility regressions to watch for

- Removing focus styles "to look modern".
- Using placeholder text as the only label.
- Color-only error indication with no text label.
- Disabled submit buttons without explanation.
- Modals that trap focus without an escape key.
- Carousels that auto-advance without pause.
- Animated GIFs with critical information.
- Low-contrast secondary text in marketing.

## Testing approach

- **Automated.** Use axe DevTools or similar to catch obvious failures.
- **Keyboard-only.** Walk through the page with only the keyboard.
- **Screen reader.** Test with VoiceOver (macOS / iOS) and NVDA (Windows).
- **Zoom.** Test at 200% browser zoom.
- **Reduced motion.** Test with reduced motion preference enabled.

## Where to escalate

For accessibility questions specific to WGU, contact the Accessibility team via internal channels. Brand and accessibility teams collaborate on resolving conflicts. When they conflict, **accessibility wins**.
