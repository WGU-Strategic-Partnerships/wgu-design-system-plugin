# WGU Iconography

WGU recognizes two icon families. They are not interchangeable.

## The two families

### 1. Simple icons

One-tone, line-based, geometric. Reserved for **web UI navigation**. They do the job of arrows, close buttons, search, profile, and other interface chrome.

The official Simple Icon library includes: Up, Down, Left, Right arrows. Carets. Cancel. Plus. People. Person. Location. Network. Timer. Graduation. Business. Education. Technology. Health. Certificates. Phone. Chat. Search.

### 2. Illustrated icons

Two-tone or color-background, richer, more decorative. Used in marketing collateral, flyers, infographics, and brochures, never in product UI.

Illustrated icon categories: Technology, Military, Education, People, Achievement, Emphasis and Accents, Affordability and Flexibility, Communication, Symbols, Generic, Business, Health, Academy. Each is available in "Color Background", "No Background", and (for video) animated variants.

## Where the official icons live

The actual icon library is held by the WGU Brand Governance Team. Contact brand@groups.wgu.edu for access.

## Substitutes shipped in this design system

The WGU Design System ships **Lucide** ([lucide.dev](https://lucide.dev/)) as a stand-in for the Simple Icons family. Lucide is line-based, single-tone, and geometric, which matches WGU's "one-tone UI nav" description closely.

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="chevron-right"></i>
<script>lucide.createIcons();</script>
```

### Canonical Lucide to WGU Simple Icon mapping

| WGU Simple Icon | Lucide name |
| --- | --- |
| Up arrow | `arrow-up` |
| Down arrow | `arrow-down` |
| Left arrow | `arrow-left` |
| Right arrow | `arrow-right` |
| Caret up / down / left / right | `chevron-up` / `chevron-down` / `chevron-left` / `chevron-right` |
| Cancel | `x` |
| Plus | `plus` |
| People | `users` |
| Person | `user` |
| Location | `map-pin` |
| Network | `share-2` |
| Timer | `timer` |
| Graduation | `graduation-cap` |
| Business | `briefcase` |
| Education | `book-open` |
| Technology | `cpu` |
| Health | `heart-pulse` |
| Certificates | `award` |
| Phone | `phone` |
| Chat | `message-circle` |
| Search | `search` |

For Illustrated icons, no substitution is shipped. For mockups, use a full-bleed photograph or a colored-background plus Lucide icon composite as a placeholder, and flag the placeholder to your reviewer.

## Icon do and don't

### Do

- Use icons to show hierarchy and draw attention to key info.
- Use only the approved color set on icons (the WGU palette).
- Use sparingly. Icons are punctuation, not paragraphs.
- Match the icon family to the surface (Simple icons in product UI, Illustrated icons in marketing).

### Don't

- Don't overuse. The brand guide says "sparingly to draw the eye."
- Don't modify, stretch, recolor, or overlap icons.
- Don't create new icons. Only the Creative Team adds to the library.
- Don't use one-tone Simple icons outside of web navigation.
- Don't use Illustrated icons in product UI.
- Don't use emoji as a substitute for icons.

## Emoji and decorative glyphs

- **Emoji.** Never used in WGU brand collateral. Use the icon system instead.
- **Unicode glyphs** (★, →, •) are acceptable sparingly in informal contexts (blog post headers, email signatures) but prefer proper icons in product UI.

## Sizing

Use the spacing scale to size icons consistently.

| Use | Size |
| --- | --- |
| Inline with body text | 16px |
| Default UI nav icon | 20px |
| Section eyebrow icon | 24px |
| Feature card icon | 32px |
| Hero illustration | 48px and up |

Always size icons in even pixel multiples to keep crisp rendering.

## Color rules for icons

- One-tone Simple icons take a single color from the palette: WGU Blue (default), Medium Blue (interactive), or White (on dark surfaces).
- Avoid coloring an icon Lime Green unless it is the single accent moment in the layout.
- Never use a custom color outside the palette.
