# WGU Components: Navigation

## Top-level header (marketing site)

The marketing site header is the brand front door. Its structure:

```
[ University logo ] [ Primary nav ........ ] [ Search ] [ Sign in ] [ Apply now ]
```

- **Logo.** University logo, left-aligned. Minimum 52px wide. Links to homepage.
- **Primary nav.** 4 to 6 top-level items. Avoid more.
- **Search.** Optional, icon-only on desktop, expanding on click.
- **Sign in.** Tertiary button.
- **Apply now.** Primary button, pill radius. The single most important CTA in the header.

### Header behavior

- **Scroll.** Header may shrink slightly on scroll (e.g., 80px down to 64px) but should not disappear.
- **Sticky.** Sticky to top is acceptable.
- **Background.** White with thin bottom border, or transparent over a hero photograph (with a protection gradient).

## Top-level header (student portal)

Internal portal headers prioritize quick access and identity.

```
[ Owl icon ] [ Section nav ........ ] [ Notifications ] [ User menu ]
```

- **Owl icon** (alone) is approved here because the audience is students.
- **Section nav.** Tabs or a horizontal nav for the major portal areas.
- **Notifications.** Bell icon with optional badge.
- **User menu.** Avatar with dropdown.

## Side navigation

For dense portal experiences (faculty tools, enrollment dashboards), a left rail is appropriate.

- **Width.** 240 to 280px expanded. 64px collapsed.
- **Icons** Lucide stand-ins. 20px.
- **Labels** body weight, 16px.
- **Active state.** Background Light Blue (`--bg-2`), 2px Medium Blue accent on the leading edge, WGU Blue text.

## Footer

The footer is a heavy, dark surface that closes the page.

- **Background.** Midnight gradient (`--gradient-midnight`).
- **Type color.** White headlines, `--fg-on-dark-2` (`#BBD0E8`) for body and links.
- **Logo.** White-knockout university logo at top of the footer.
- **Columns.** 3 to 5 columns of links, organized by audience and purpose.
- **Legal row.** Copyright, accessibility statement, privacy, terms.
- **Social.** Lucide icons for the platforms WGU uses.

## Breadcrumbs

Use breadcrumbs on deep content pages where the user benefits from a clear path back.

```
Home / Programs / Bachelor's degrees / Cybersecurity
```

- **Type.** 14px, `--fg-3` (grey) for non-current items, WGU Blue for the current page.
- **Separator.** A light slash or `/` in `--fg-3`.
- **Hover.** Color shifts to Medium Blue. Underline appears.

## Tab navigation

For switching views inside a single page (e.g., Overview / Coursework / Tuition).

- **Container.** Horizontal row of tabs with a 1px Light Grey divider underneath.
- **Active.** WGU Blue text, 3px WGU Blue underline, slightly heavier weight.
- **Inactive.** `--fg-3` (grey) text, no underline.
- **Hover.** Text shifts to WGU Blue.
- **Focus.** Visible focus ring around the tab.

## Pagination

- **Numbered pages** for long lists when the user benefits from jumping.
- **Previous / Next** for shorter sequences (steps in a flow, blog posts).
- **Type.** 16px, WGU Blue. Current page in 2px Medium Blue underline.

## Mobile navigation

- **Hamburger menu** on the right.
- **Full-screen overlay** when open. Background WGU Blue, type white.
- **Apply now CTA** persists prominently in the mobile menu.

## Accessibility

- All navigation must be operable by keyboard.
- Focus order should follow visual order.
- Active page must be communicated to assistive tech (`aria-current="page"`).
- Skip-to-content link as the first interactive element on every page.
