# WGU Spacing, Grid, and Layout

## Base unit

The WGU Design System uses a **4px base grid**. Every spacing decision is a multiple of 4.

## Spacing scale

| Token | Value | Common use |
| --- | --- | --- |
| `--space-1` | 4px | Hairline gaps between dense elements |
| `--space-2` | 8px | Inline gaps, icon-to-text spacing |
| `--space-3` | 12px | Form input internal padding, chip gaps |
| `--space-4` | 16px | Default content gap, paragraph spacing |
| `--space-5` | 24px | Card internal padding, section spacing |
| `--space-6` | 32px | Feature card padding, large gaps |
| `--space-7` | 48px | Section-to-section spacing |
| `--space-8` | 64px | Hero-to-content spacing |
| `--space-9` | 96px | Major page section breaks |

## Grid and container

- Page max-width is generally **1200 to 1280px**.
- Desktop gutters: **24 to 48px**.
- Default column count: **12-column grid**.
- Tablet (768 to 1023px): collapse to 8-column grid.
- Mobile (below 768px): single column with 16 to 24px side gutters.

## Vertical rhythm

- **Section spacing** between top-level page sections: 64 to 96px.
- **Subsection spacing** between major content groups in a section: 48px.
- **Block spacing** between an h2 and its content: 24px.
- **Paragraph spacing** between paragraphs: 16px.

## Card and component padding

- **Default card** internal padding: 24px.
- **Feature card** internal padding: 32px.
- **Compact card or chip**: 12 to 16px.
- **Image-to-text gap inside a card**: 16px.

## Logo clear space inside layouts

- **Master mark.** Minimum clear space on all four sides equals one half the X-height of the master mark.
- **Owl icon.** Minimum clear space equals one third the icon height on all four sides.

## Minimum sizes

- **Master logo on web.** 52px wide minimum.
- **Master logo in print.** 0.725 inch wide minimum.

## Whitespace philosophy

Generous whitespace is part of the brand. The WGU brand reads modern, clean, and trustworthy. Crowded layouts undercut all three. When in doubt, take something out before adding anything in.

## Responsive behavior

- Type scale should not shrink below **16px body** on mobile.
- Hero h1 may scale from **55px desktop** down to **40 to 44px mobile**.
- Padding and section spacing should reduce by approximately 25 to 33% on mobile (for example, 96px desktop becomes 64px mobile).

## Alignment

- **Left-align** body copy and most headlines. Center alignment is reserved for hero moments and quotes.
- **Top-align** card content within rows of cards so titles sit at the same baseline.
- Avoid mixing alignment within a single section.

## Layout don'ts

- Don't use spacing values outside the scale (e.g., 18px, 30px).
- Don't reduce minimum logo size to fit a tight layout. Restructure instead.
- Don't crowd typography against borders, photography, or icons.
- Don't center long body paragraphs.
