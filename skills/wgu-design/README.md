# WGU Design System

A practical, agent-readable design system for **Western Governors University (WGU)** — a fully online, competency-based, nonprofit university. This system captures WGU's brand personality, visual foundations, typography, iconography, and reusable UI patterns so any AI or human designer can produce on-brand work quickly.

> One-sentence identity: _WGU is a student-centric, online university with a bold, modern, professional, and authentic voice — unified by deep blue (#002855), Futura PT typography, and clean, photographic, equity-focused storytelling._

---

## Sources

This system was compiled from materials the user provided:

| Source | Path | Notes |
|---|---|---|
| **WGU Brand Guide (PDF)** | `uploads/WGU Brand Guide.pdf` (extracted text: `uploads/brand-guide-text.txt`) | Compiled from the public brand site `https://www.brand.wgu.edu/`. 29 sections covering voice, logos, color, type, patterns, photography, campaigns. |
| **Evergreen Blank PPTX Template** | `uploads/Evergreen Blank Template_General.pptx` | Slide template. All 23 embedded images extracted to `uploads/pptx_media/` and organized into `assets/patterns/` + `assets/logos/` + `assets/backgrounds/`. |
| (NOT provided) WGU Logos.zip | — | Referenced in the original ask but not present in the project. The university logo was extracted from the PPTX media instead. |
| (NOT provided) WGU Powerpoint Template - Corporate Logo.potx | — | Not present. Evergreen (owl-logo) template used in its place. |

Official asset source for WGU employees: the **WGU DAM (Canto)** — University Logos `wgu.canto.com/b/JJP30`, School Logos `wgu.canto.com/b/QS2NE`, Entity Logos `wgu.canto.com/b/I8C3L`, Corporate Logo `wgu.canto.com/v/MCITISTHFR/album/KCM3V`. Brand questions: `brand.wgu.edu`.

---

## Index — what's in this folder

```
README.md                      ← you are here
SKILL.md                       ← Agent-skill manifest for Claude / Claude Code
colors_and_type.css            ← Design tokens: colors, gradients, type scale, spacing, shadow, motion

assets/
  logos/                       ← University owl logo, owl icon, WGU wordmark (PNG)
  patterns/                    ← Brand patterns: Swirl, Network, Comms, Connect, Flow, Elevate, Growth, Pathways
                                 (in navy, blue, and light-tint colorways)
  backgrounds/                 ← Midnight gradient and other solid/gradient backgrounds
  icons/                       ← Simple UI icons (see ICONOGRAPHY section)

fonts/                         ← (empty — Futura PT is licensed; see TYPOGRAPHY note)

preview/                       ← HTML cards that populate the Design System tab

slides/                        ← Sample 16:9 slides matching the Evergreen PPTX template
  index.html                   ← Deck overview
  TitleSlide.jsx
  SectionDividerSlide.jsx
  ContentSlide.jsx
  QuoteSlide.jsx
  StatSlide.jsx
  ClosingSlide.jsx

ui_kits/                       ← WGU product surfaces (marketing site, student portal)
  marketing_site/
  student_portal/

uploads/                       ← Raw source material (do not edit; reference only)
```

---

## Mission, vision & voice

**Mission.** To change lives for the better by creating pathways to opportunity.
**Vision.** To be the most student-centric university.
**Core belief.** We believe in the inherent worth and ability of every individual and in the transformative power of education.

**Brand pillars** (in order):
1. **Renewing Education's Promise** — Value · Relevance · Respect
2. **Personalizing Learning** — Flexibility · Empowerment · Support
3. **Advancing Systemic Equity** — Opportunity · Equity · Development
4. **Partnering for Impact** — Collaboration · Innovation · Unity
5. **Modeling Accountability** — Measurement · Trust · Transparency

**Voice characteristics**: Empowering · Authentic · Inviting · Modern · Bold · Professional.

---

## CONTENT FUNDAMENTALS

How WGU writes.

- **Less is best.** Simple, direct language. Get to the point. The brand guide explicitly caps copy length by format (e.g. OOH billboard = 7 words max, :15 video = 25 words max, paid social headline = 27 characters).
- **Audience-first.** Always ask "Who will read this? What do they need to know? What action should they take?" — that framing governs every piece of copy.
- **Conversational, but never too casual.** Professional and respectful, but approachable. Not stiff, not slangy.
- **Second person ("you") for students.** The student is the protagonist; WGU is the enabler. "You" is used constantly in CTAs and headlines. "We" for WGU as an institution, used sparingly and with intent ("We believe…", "We help…").
- **Active voice, strong verbs.** "Advance your career." "Earn your degree." "Own your future." — not "Your career can be advanced."
- **Evidence-backed.** Claims must be source-able — "Unverified quotes/stats can't be included" per brand guide. Prefer specific numbers and named outcomes.
- **No owl puns, no owl names.** Only the Sage mascot costume and official owl logo are approved — avoid all owl-related wordplay, even internally.
- **No emoji** in marketing/brand collateral. The brand has a professional register; emoji read as too casual. Use approved icons instead. (Emoji may appear in ad-hoc social contexts but are not part of the design system.)
- **Casing.** Sentence case for most UI and body headlines. Title Case is acceptable for marquee marketing headlines and section eyebrows. ALL CAPS is reserved for (a) short eyebrow labels, (b) some infographic titles, and (c) the Education for the People campaign headlines.
- **Numbers.** Use digits for statistics and data (e.g. "75+ industry-relevant programs"). In infographics, isolated numerals are set in **Rocky** serif for elevation.

**Copy examples — in the WGU voice**

> _Hero / marketing headline_
> **Own the next chapter of your career.** Earn an accredited, competency-based degree online — on your schedule, at a flat tuition rate.

> _Student portal dashboard greeting_
> **Welcome back, Jamie.** You've completed 4 of 6 competencies in this term. Keep going — your next assessment is ready when you are.

> _Stat / infographic_
> **75+** industry-aligned programs · **100%** online · **1:1** mentorship from day one.

> _CTA microcopy_
> Apply now · Request info · Transfer your credits · Talk to an enrollment counselor

> _What to avoid_
> ~~"Hoot hoot! Our wise owls will guide your journey 🦉"~~ — breaks the no-owl-puns + no-emoji rules and the "never too casual" tone.

---

## VISUAL FOUNDATIONS

How WGU looks.

### Color
- **WGU Blue (#002855)** is the core unifying color. It **must appear on every designed asset**. Treat it as the one non-negotiable.
- **Midnight (#001731)** is used for depth: deep backgrounds, footers, gradient bases.
- **Accent trio** — Medium Blue `#0070F0` (CTAs, links), Sky Blue `#46B1EF` (illustrations, highlights), Lime Green `#97E152` (sparingly — data viz, accents, a single "pop" moment).
- **Neutrals** — Light Blue `#EEF6F9` (tinted surfaces), Light Grey `#F1F1F1` (neutral fills), Grey `#A7A7A7` (muted text, dividers), White.
- **Gradients (web only)** — Midnight gradient `#001731→#002855` (footers, solid dark sections) and Medium Blue gradient `#002855→#0070F0` (hero CTAs, quote blocks).
- **Never** tint, alter opacity of, or eyeball brand colors. Use exact HEX.
- **Contrast rules** (excerpt): never pair Midnight bg with Grey text; never Lime Green bg with Medium/Sky Blue text; never White bg with Sky Blue or Lime Green text. See `colors_and_type.css` header for the full no-pair list from §8 of the brand guide.

### Type
- **Primary: Futura PT** — Light, Book, Medium, Heavy. Geometric sans, slightly humanist, very mid-century-modern.
- **Fallback: Arial** — for PowerPoint, email signatures, places where Futura PT isn't licensed.
- **Numerals in infographics: Rocky** (serif) — isolated numbers only.
- **Campaign headlines (Education for the People): Program Nar OT Black** — compressed narrow display.
- ⚠️ **Font substitutions in this system** (Futura PT, Rocky, and Program Nar OT are all licensed; no free equivalents ship with this project):
  - Futura PT → **Jost** (Google Fonts) — closest free geometric-sans match.
  - Rocky → **Newsreader** (Google Fonts) — modern literary serif.
  - Program Nar OT Black → **Oswald** (Google Fonts) — compressed display sans.
  - **Please drop real Futura PT / Rocky / Program Nar files into `fonts/` and update the `@font-face` declarations in `colors_and_type.css` for production.**

### Spacing & layout
- 4px base grid. Spacing tokens: `4, 8, 12, 16, 24, 32, 48, 64, 96`.
- Generous whitespace around the owl logo: min clear space = ½ the X-height of the master mark on all four sides. Icon-alone clear space = ⅓ the icon height.
- Minimum logo size: **52 px** wide (web), **0.725 in** wide (print).
- Page max-width is generally ~1200–1280px with 24–48px gutters on desktop.

### Backgrounds & imagery
- **Solid WGU Blue** for most heavy-duty hero/footer surfaces.
- **Midnight Gradient** (top→bottom, `#001731→#002855`) for full-bleed dark sections.
- **Medium Blue Gradient** (`#002855→#0070F0`) for "hot" CTA moments, quote blocks, apply-now banners.
- **Brand patterns** — Swirl, Network, Comms, Connect, Flow, Elevate, Growth, Pathways. Use sparingly as a low-contrast backdrop. **Never** place two patterns on the same asset; never modify them; never layer copy on a pattern without explicit Creative Team approval.
- **Photography** — cinematic, vibrant, warm skin tones, authentic grit (no heavy retouching). Student cutouts are an approved treatment (silhouetted students on color backgrounds). Half-tone treated portraits are part of the current "Education for the People" campaign.
- **Gradient overlays on photos** — blue gradient paired with bold white headlines; white gradient paired with Blue Midnight / Midnight text. Used to keep text legible over busy photography.

### Corners, borders, shadows
- **Corner radius** is moderate — `--radius-md: 8px` for cards and inputs, `--radius-lg: 16px` for feature cards, `--radius-pill: 999px` for tag/chip/CTA pills.
- **Borders** are thin and low-contrast (`rgba(0,40,85,0.12)`). The brand avoids heavy outlines; prefer whitespace and elevation for separation.
- **Shadows** are soft and blue-tinted (not pure-black). Three steps: `sm` (1px, 8% opacity), `md` (4/12px, 10%), `lg` (12/32px, 14%). Used for card lift and menu float, never for decoration.
- **Focus ring** — 3px Medium Blue glow at 35% opacity. Always visible; never disabled.

### Animation
- **Restrained, functional, ease-out.** `--ease-standard: cubic-bezier(.2,0,.2,1)`, `--ease-emphasis: cubic-bezier(.2,.8,.2,1)`.
- Durations: `fast 120ms` (hover), `base 220ms` (state change), `slow 420ms` (route/modal).
- **Fades and gentle slides.** No bounces, no elastic, no rotations. The brand reads modern and trustworthy, not playful/bouncy.
- **Hover states**: primary button darkens ~8%; secondary button fills to Blue Midnight; links go from Medium Blue to a deeper blue; cards get a subtle lift (translateY -2px + shadow-md→shadow-lg).
- **Press states**: no shrink. A very small darken (~12%) and shadow drop back to `sm`. Haptic-feeling without being toy-like.

### Transparency, blur, layering
- Transparency is used on **protection gradients over photography** (white→transparent, or midnight→transparent) so headlines stay readable. It is **not** used as a decorative treatment on brand colors themselves (brand guide forbids tinting/opacity on the palette).
- Backdrop blur is uncommon in WGU's visual language; prefer solid surfaces and the Midnight gradient.

### Cards
- White background, `--radius-md` (8px), `--shadow-sm` at rest, `--shadow-md` on hover.
- Thin border (`--border-thin`) for cards that sit on a white surface; no border on tinted surfaces.
- Internal padding typically 24px; 32px for feature cards.
- Imagery in cards is full-bleed top with a 16px gap between image and text.

---

## ICONOGRAPHY

The brand guide distinguishes two icon families:

1. **Simple icons** — one-tone, line-based, reserved for **web UI navigation**. Includes Up/Down/Left/Right arrows, Cancel, Plus, People, Person, Location, Network, Timer, Graduation, Business, Education, Technology, Health, Certificates, Phone, Chat, Search, Carets.
2. **Illustrated icons** — two-tone or color-background, richer and more decorative. Used in marketing collateral, flyers, infographics, brochures. Categories: Technology, Military, Education, People, Achievement, Emphasis & Accents, Affordability & Flexibility, Communication, Symbols, Generic, Business, Health, Academy. Available in "Color Background" and "No Background" variants and (for video) animated.

**Source of truth.** The actual icon library is held by the WGU Brand Governance Team (`brand.wgu.edu`). **This design system does not ship the real WGU illustrated icons — they were not provided.**

**Substitution.** For the Simple Icons family (UI navigation), this system links **[Lucide](https://lucide.dev/)** via CDN. Lucide is line-based, single-tone, geometric, and matches WGU's "one-tone UI nav" description closely. Usage:

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="chevron-right"></i>
<script>lucide.createIcons();</script>
```

Canonical Lucide ↔ WGU mapping:

| WGU Simple Icon | Lucide name |
|---|---|
| Up / Down / Left / Right Arrows | `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right` |
| Carets | `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right` |
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

**Illustrated icons** — no substitution attempted. For production, pull the real assets from Canto. For mockups, a full-bleed photograph or a simple colored-background + Lucide icon composite is an acceptable placeholder; flag the placeholder to the reviewer.

**Emoji.** Never used in WGU brand collateral. Use the icon system instead.
**Unicode characters** as decorative glyphs (★, →, •) are acceptable sparingly in informal contexts (blog post headers, email signatures) but prefer proper icons in product UI.

**Do / don't.**
- ✅ Use icons to show hierarchy and draw attention to key info.
- ✅ Use only the approved color set on icons (WGU palette).
- ❌ Don't overuse — "sparingly to draw the eye" per brand guide.
- ❌ Don't modify, stretch, recolor, or overlap icons.
- ❌ Don't create new icons (Creative Team only adds to the library).
- ❌ Don't use one-tone icons outside of web navigation.

---

## Hard rules (non-negotiable)

1. **WGU Blue (#002855) appears on every designed asset** as the unifying color.
2. Never alter logos, seal, icons, or patterns — use exactly as supplied.
3. Never tint, adjust opacity of, or eyeball any brand color.
4. Wordmark always appears without the owl icon (they are used as two separate marks).
5. Owl Icon alone is only for audiences of students, alumni, or employees.
6. Academic Seal is restricted to official documents; swag must be cleared with Brand Governance.
7. No owl puns. No emoji in brand collateral.
8. Only use Futura PT (or Arial fallback for digital) for body type; only Rocky for isolated infographic numerals; only Program Nar OT Black for Education for the People campaign headlines.

---

## Active campaign — Education for the People (Dec 2025–present)

Creative POV: "Saying the quiet part out loud. College has become inaccessible for many; WGU has always stood with students."

| Component | Spec |
|---|---|
| Headline font | Program Nar OT Black (→ Oswald substitute here) |
| Body font | Futura PT Book (→ Jost substitute) |
| Palette | Deep Blue `#003057` · Sky Blue `#46B1EF` · Lime Green `#97E152` · White |
| Photo treatment | Half-tone portraits of students on brand-color backgrounds |
| Visual voice | Bold, ownable, "stops the viewer" half-tone style; contrarian edge |

---

## CAVEATS & open questions

- **Missing source files**: `WGU Logos.zip` and `WGU Powerpoint Template - Corporate Logo.potx` were listed in the original task but not uploaded. The university owl logo was recovered from the Evergreen PPTX — however, the **school lockups, corporate logo (letterform), Craft / Juvo / Academy / Labs logos, and Academic Seal** are not present. Please attach `WGU Logos.zip` for full coverage.
- **Font substitutions** for Futura PT, Rocky, and Program Nar OT Black are noted in `colors_and_type.css`. Please drop licensed `.woff2` files into `/fonts/` and adjust `@font-face`.
- **Illustrated icons** and **photography / student cutouts** are not present (licensed / DAM-gated). Lucide is used as a stand-in for Simple Icons only.
- **Product context unknown**: WGU runs a marketing site (wgu.edu), a student portal, and a mobile app. None were provided as codebase / Figma. UI kits in this system are built from brand-guide principles, not from the actual live products — treat them as "what a WGU UI should look like" rather than 1:1 recreations.
