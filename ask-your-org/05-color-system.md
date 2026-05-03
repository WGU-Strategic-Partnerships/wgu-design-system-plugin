# WGU Color System

## Core principle

WGU Blue (#002855) is the one non-negotiable. It must appear on every designed asset as the unifying color. Every other color in the palette plays a supporting role.

## Full palette

| Token | Name | HEX | Role |
| --- | --- | --- | --- |
| `--wgu-midnight` | Blue Midnight | `#001731` | Deepest navy. Footers, deep gradient base, solid dark surfaces. |
| `--wgu-blue` | WGU Blue | `#002855` | Primary core color. Required on every asset. |
| `--wgu-blue-deep` | Deep Blue | `#003057` | Education for the People campaign palette only. |
| `--wgu-medium-blue` | Medium Blue | `#0070F0` | CTAs, links, primary interaction. |
| `--wgu-sky-blue` | Sky Blue | `#46B1EF` | Light accent, illustrations, highlights. |
| `--wgu-lime` | Lime Green | `#97E152` | Sparingly. Single "pop" moments, data viz, accents. |
| `--wgu-light-blue` | Light Blue | `#EEF6F9` | Tinted neutral surface. |
| `--wgu-light-grey` | Light Grey | `#F1F1F1` | Default neutral fill. |
| `--wgu-grey` | Grey | `#A7A7A7` | Muted text and dividers. |
| `--wgu-white` | White | `#FFFFFF` | Default page surface and inverted text. |
| `--wgu-black` | Black | `#000000` | Used rarely. Most "black" elements should be Blue Midnight. |

## Gradients (web only)

The brand uses two approved gradients on web surfaces. Print and PowerPoint should use solid colors.

- **Midnight gradient.** `linear-gradient(180deg, #001731 0%, #002855 100%)`. Use for footers and full-bleed dark sections.
- **Medium Blue gradient.** `linear-gradient(135deg, #002855 0%, #0070F0 100%)`. Use for hero CTAs, quote blocks, apply-now banners. Reserve for "hot" moments.
- **Protection gradient.** `linear-gradient(180deg, rgba(0,23,49,0) 0%, rgba(0,23,49,0.85) 100%)`. Used to keep white headlines legible over photography. Not a decorative effect.

## Color rules

- Use exact HEX values. Never tint, lighten, darken, or adjust opacity of brand colors.
- Lime Green is a "pop" color. One Lime accent per layout, not three.
- Avoid black for body text. Use WGU Blue (`#002855`) for primary text on light backgrounds.
- Inverted (dark) surfaces should pair white headlines with the Light Blue or Sky Blue tint for secondary text.

## No-pair contrast list

The brand guide forbids these specific combinations because they fail contrast or feel off-brand:

- Midnight background + Grey text. (Insufficient contrast.)
- Lime Green background + Medium Blue text. (Vibration.)
- Lime Green background + Sky Blue text. (Vibration.)
- White background + Sky Blue text. (Insufficient contrast.)
- White background + Lime Green text. (Insufficient contrast.)
- Medium Blue background + Sky Blue text. (Vibration.)

If you need these colors near each other, separate them with a neutral surface or a clear container.

## Recommended pairings

- WGU Blue background + White text. Always safe.
- White background + WGU Blue text. Default body.
- Light Blue tint background + WGU Blue text. Calm sectional surface.
- Midnight gradient background + White headline + Light Blue secondary text. Used for footers.
- Medium Blue gradient + White headline + Lime accent on a single CTA or stat.

## Accessibility

WGU targets WCAG 2.1 AA at minimum (4.5:1 for body text, 3:1 for large text and UI). When in doubt, run the pairing through a contrast checker. Brand correctness does not override accessibility. If a brand-approved combination fails AA in your specific context, choose a compliant pairing from the safe list above.

## Color tokens (CSS)

```css
:root {
  --wgu-midnight:      #001731;
  --wgu-blue:          #002855;
  --wgu-blue-deep:     #003057;
  --wgu-medium-blue:   #0070F0;
  --wgu-sky-blue:      #46B1EF;
  --wgu-lime:          #97E152;
  --wgu-light-blue:    #EEF6F9;
  --wgu-light-grey:    #F1F1F1;
  --wgu-grey:          #A7A7A7;
  --wgu-white:         #FFFFFF;
  --wgu-black:         #000000;
}
```
