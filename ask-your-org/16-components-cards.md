# WGU Components: Cards

## When to use a card

A card groups related content into a self-contained surface. Use cards when:

- Content has a clear identity (a program, a graduate story, a stat block).
- Content benefits from elevation off the page surface.
- Content can be tapped or navigated as a unit.

Do not use cards for everything. A list of links does not need card treatment.

## Anatomy

A standard WGU card includes some or all of:

1. **Optional image** at top, full-bleed, 16:9 or 4:3 ratio.
2. **Optional eyebrow** label above the title (e.g., "Bachelor's degree").
3. **Title** (h3 or h4).
4. **Body** copy.
5. **Optional metadata** (duration, cost, tag chips).
6. **Optional action** (button, text link, or "card-as-link" affordance).

## Default card spec

- **Background.** White on white pages, no fill on tinted (`--bg-2`) pages.
- **Border.** `--border-thin` on white pages, none on tinted pages.
- **Radius.** `--radius-md` (8px) for default, `--radius-lg` (16px) for feature cards.
- **Shadow.** `--shadow-sm` at rest, `--shadow-md` on hover.
- **Padding.** 24px default, 32px for feature cards.
- **Image-to-text gap.** 16px when an image is present.

## Hover state

When a card is interactive (clickable as a whole):

- TranslateY -2px.
- Shadow upgrades from `--shadow-sm` to `--shadow-md`.
- Title color may shift slightly (e.g., from `--fg-1` to `--fg-link`).
- Cursor: pointer.

If a card is purely informational (not clickable), do not give it a hover state.

## Variants

### Standard card

White background, thin border, default padding. The default for grids of programs, posts, or graduates.

### Feature card

Larger radius (`--radius-lg`), more padding (32px), prominent imagery or icon. Use for the marquee item on a page (the featured program, the highlighted story).

### Stat card

Center-aligned. Big numeral set in `--font-numeral` (Newsreader). Supporting label in body type. Use sparingly; one to three stat cards in a row is the maximum.

### Tinted card

Background `--bg-2` (Light Blue) or `--bg-3` (Light Grey). No border. Use to break visual rhythm without elevating the card off the page.

### Dark card

Background WGU Blue or Midnight. White type. Used for inverted moments inside a long, light page.

## Card grids

- **Three-column desktop.** Default for program lists and graduate stories.
- **Two-column desktop.** For longer-form cards with body copy.
- **Single column mobile.** Always.
- **Equal heights.** Within a row, cards have equal height. Top-align card titles to keep baselines consistent.

## Image usage in cards

- Full-bleed top, no inset.
- Crops should respect WGU photography rules: real students, warm tones, no over-retouch.
- 16:9 for standard cards, 4:3 for portrait-leaning content.

## What not to do

- Don't use card hover states on non-interactive cards.
- Don't mix radii within a single card grid.
- Don't pad inconsistent gaps between image and text.
- Don't put more than one CTA inside a single card.
- Don't combine a heavy border and a heavy shadow on the same card. Pick one.
- Don't apply patterns inside a card. Patterns are background surfaces, not card decorations.
