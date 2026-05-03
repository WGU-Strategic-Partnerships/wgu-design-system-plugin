# WGU Design Tokens Reference

This is the full list of CSS custom properties in the WGU Design System. Drop these into the `:root` of any web project. The system is also shipped as `colors_and_type.css` in the `wgu-design` Claude plugin.

## Color tokens

```css
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
```

## Semantic surface tokens

```css
--bg-1:    var(--wgu-white);
--bg-2:    var(--wgu-light-blue);
--bg-3:    var(--wgu-light-grey);
--bg-invert:      var(--wgu-blue);
--bg-invert-deep: var(--wgu-midnight);
```

## Semantic text tokens

```css
--fg-1:    var(--wgu-blue);
--fg-2:    #264468;
--fg-3:    var(--wgu-grey);
--fg-on-dark-1: var(--wgu-white);
--fg-on-dark-2: #BBD0E8;
--fg-link:       var(--wgu-medium-blue);
--fg-link-hover: #0057C2;
--fg-accent:     var(--wgu-lime);
```

## Brand gradients

```css
--gradient-midnight:    linear-gradient(180deg, #001731 0%, #002855 100%);
--gradient-medium-blue: linear-gradient(135deg, #002855 0%, #0070F0 100%);
--gradient-protection:  linear-gradient(180deg, rgba(0,23,49,0) 0%, rgba(0,23,49,0.85) 100%);
```

## Type families

```css
--font-display: 'Jost', 'Futura PT', 'Futura', 'Trebuchet MS', Arial, sans-serif;
--font-body:    'Jost', 'Futura PT', 'Futura', Arial, sans-serif;
--font-system:  Arial, Helvetica, sans-serif;
--font-numeral: 'Newsreader', 'Rocky', Georgia, 'Times New Roman', serif;
--font-campaign:'Oswald', 'Program Nar OT', 'Futura PT', Arial, sans-serif;
```

## Type weights

```css
--w-light:  300;
--w-book:   400;
--w-medium: 500;
--w-heavy:  800;
```

## Type scale

```css
--fs-h1: 55px;     --lh-h1: 48px;
--fs-h2: 55px;     --lh-h2: 48px;
--fs-h3: 26px;     --lh-h3: 22px;
--fs-h4: 26px;     --lh-h4: 22px;
--fs-body:  18px;  --lh-body:  26px;
--fs-quote: 18px;  --lh-quote: 28px;
--fs-small: 16px;  --lh-small: 22px;
--fs-caption: 16px; --lh-caption: 20px;
--fs-eyebrow: 13px; --lh-eyebrow: 16px;
```

## Radii

```css
--radius-0:    0;
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   16px;
--radius-pill: 999px;
```

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 23, 49, 0.08);
--shadow-md: 0 4px 12px rgba(0, 23, 49, 0.10);
--shadow-lg: 0 12px 32px rgba(0, 23, 49, 0.14);
--shadow-focus: 0 0 0 3px rgba(0, 112, 240, 0.35);
```

## Spacing

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
```

## Borders

```css
--border-thin:   1px solid rgba(0, 40, 85, 0.12);
--border-strong: 2px solid var(--wgu-blue);
--divider:       1px solid var(--wgu-light-grey);
```

## Motion

```css
--ease-standard: cubic-bezier(0.2, 0.0, 0.2, 1);
--ease-emphasis: cubic-bezier(0.2, 0.8, 0.2, 1);
--dur-fast: 120ms;
--dur-base: 220ms;
--dur-slow: 420ms;
```

## Token naming conventions

- `--wgu-*` are raw brand colors. Refer to these only when no semantic alternative fits.
- `--bg-*`, `--fg-*` are semantic. Prefer these in component code.
- `--space-*`, `--radius-*`, `--shadow-*`, `--dur-*`, `--ease-*` are scales. Use them, not arbitrary values.

## Dark surfaces

When a layout uses a dark surface (WGU Blue, Midnight, or a brand gradient), swap text tokens:

- Body text: `--fg-on-dark-1` (white)
- Secondary text: `--fg-on-dark-2` (`#BBD0E8`)

The provided `.surface-dark`, `.surface-midnight`, `.surface-tint`, `.surface-gradient-midnight`, and `.surface-gradient-medium-blue` helpers cascade these correctly.
