# WGU Slides and Presentations

## Templates

WGU uses an **Evergreen** PowerPoint template as the standard for general-purpose presentations. The template includes six slide archetypes:

1. **Title slide.** Cover slide with university logo, presentation title, presenter name, date.
2. **Section divider.** Full-bleed colored slide marking the start of a new section.
3. **Content with stats.** Body content paired with a numerical highlight in Rocky / Newsreader.
4. **Quote slide.** A blockquote treatment for student or graduate testimonials.
5. **Comparison slide.** Two-column or three-column comparison layout.
6. **Closing slide.** Wrap-up with CTA and contact information.

The Claude `wgu-design` plugin ships HTML versions of all six archetypes for prototyping in `slides/`.

## Slide ratio

**16:9** widescreen is the default. 4:3 should be avoided for new decks.

## Title slide

- **Background.** WGU Blue or Midnight gradient.
- **Logo.** University logo top-left, white knockout, respecting clear space.
- **Title.** h1 in Futura PT Heavy. White.
- **Subtitle.** h2 in Futura PT Medium. Light Blue or White at 80% emphasis.
- **Footer.** Presenter name and date in small caption type.

## Section divider

- **Background.** Solid WGU Blue or Midnight gradient.
- **Centered eyebrow** in Lime Green or Sky Blue, ALL CAPS, tracking 0.12em.
- **Section number and name** in h1 Futura PT Heavy.
- Optional pattern in low-contrast.

## Content slide

- **Background.** White.
- **Title.** h2 Futura PT Medium, WGU Blue.
- **Body.** Two- or three-column layout. 18px body copy. Generous line height.
- **Optional eyebrow** above the title in Medium Blue.
- **Optional supporting visual** to the right or full-bleed below.

## Stat slide

- **Numeral.** Set in Newsreader (Rocky substitute), 200 to 360pt, WGU Blue or White.
- **Supporting line.** 18 to 24pt Futura PT Book.
- **Source attribution.** 12pt caption, italic, Grey.
- One stat per slide is best. Two if both are equally important.

## Quote slide

- **Background.** Medium Blue gradient.
- **Quote.** 32 to 40pt Futura PT Medium Italic, white. Includes opening quote mark in Lime Green or Sky Blue at 200% size as decorative anchor.
- **Attribution.** Name in Heavy white, role and program in Light Blue.
- **Optional portrait** to the right (square or circular crop, respecting WGU photography rules).

## Comparison slide

- **Two-column or three-column** content blocks.
- **Headers** in h3 Heavy.
- **Body** in 16 to 18pt Futura PT Book.
- **Dividers** as a thin Light Grey vertical rule.
- Avoid heavy table grids. WGU prefers whitespace separation.

## Closing slide

- **Background.** WGU Blue.
- **CTA headline** in h1 Heavy white.
- **Contact information.** Email, web URL, social handles in 16 to 18pt Light Blue.
- **University logo** centered or top-left in white knockout.

## Type usage in slides

- **Headlines.** Futura PT Heavy or Medium.
- **Body.** Futura PT Book.
- **Numerals.** Rocky (Newsreader substitute) for hero stats only.
- **Captions.** Futura PT Light Italic.
- **Fallback in PowerPoint.** Arial.

## Color usage in slides

- WGU Blue (#002855) appears on every slide. If a slide lives entirely on white, ensure typography or accents land on WGU Blue.
- Lime Green sparingly. One Lime accent per deck section.
- Photography uses gradient overlays so headlines remain legible.

## File output for non-Cowork contexts

- Save final decks as `.pptx`.
- Embed (do not link) imagery to avoid breakage in shared decks.
- Stick to one deck template per audience. Do not mix Evergreen and Corporate templates.

## What not to do in slides

- Don't fill every slide with body copy. Slides are visual aids, not Word documents.
- Don't use ClipArt-style icons.
- Don't apply slide transitions beyond simple cut or fade.
- Don't mix Futura PT with Calibri, Helvetica, or other system fonts.
- Don't insert decorative shadows or glow effects on type.
- Don't use the owl icon in title slides for public-audience presentations. Use the university logo.
