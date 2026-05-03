# WGU Design System — Team Asset Bundle

Drop this folder into a Claude project, Claude Code workspace, or any internal repository to give your team an on-brand WGU design assistant.

## Quick start

When starting a new chat in a project that contains these files, just describe what you need:
- "Make a 6-slide board update on Q3 enrollment numbers"
- "Design a landing page for the School of Health"
- "Recreate this screenshot using WGU brand colors"

Claude will read `SKILL.md` automatically and follow WGU's brand rules.

## What's inside

| Path | What it is |
|---|---|
| `SKILL.md` | Skill manifest — Claude reads this first |
| `README.md` | Full brand reference: voice, color, type, patterns, hard rules |
| `colors_and_type.css` | Drop-in CSS design tokens (`--wgu-blue`, type scale, spacing, motion) |
| `assets/logos/` | University lockup, owl icon, wordmark (PNG) |
| `assets/patterns/` | 8 brand pattern families (Swirl, Network, Comms, Connect, Flow, Elevate, Growth, Pathways) in navy / blue / light tints |
| `assets/backgrounds/` | Midnight gradient |
| `preview/` | 23 design-system preview cards (color, type, spacing, components, brand) |
| `slides/` | 6 Evergreen slide archetypes (title, section, stats, quote, comparison, closing) |
| `ui_kits/marketing_site/` | Interactive marketing-homepage React kit with live Tweaks panel |
| `ui_kits/student_portal/` | Stub portal dashboard (replace with real source when available) |

## Hard brand rules (Claude follows these automatically)

1. WGU Blue (#002855) appears on every designed asset.
2. Logos, seal, icons, and patterns are never altered.
3. Brand colors are never tinted or made transparent.
4. Wordmark is used without the owl icon.
5. Owl icon alone only for student / alumni / employee audiences.
6. No owl puns. No emoji in brand collateral.
7. Type: Futura PT (Arial fallback for PowerPoint/email). Rocky serif only for isolated infographic numerals. Program Nar OT Black only for Education for the People campaign headlines.

## Font substitutions (read me)

This bundle uses free Google Fonts in place of WGU's licensed fonts:
- **Futura PT → Jost** (geometric-sans match)
- **Rocky → Newsreader** (warm literary serif)
- **Program Nar OT Black → Oswald** (compressed display sans)

For production work, replace these by dropping licensed font files into `fonts/` and updating the `@import` line at the top of `colors_and_type.css`.

## Source materials

This system was compiled from:
- `WGU Brand Guide.pdf` — public brand site (brand.wgu.edu)
- `Evergreen Blank Template_General.pptx` — official slide template (logos & patterns extracted)

WGU employees can pull official high-res assets from the **WGU DAM (Canto)**:
- University Logos: `wgu.canto.com/b/JJP30`
- School Logos: `wgu.canto.com/b/QS2NE`
- Entity Logos: `wgu.canto.com/b/I8C3L`
- Corporate Logo: `wgu.canto.com/v/MCITISTHFR/album/KCM3V`

Brand questions: `brand@groups.wgu.edu`

## Known gaps

- **Student portal kit is a stub.** No my.wgu.edu / Workday / Navigate source was provided. Replace with real screens when available.
- **No photography included.** WGU's brand is heavily photographic; mocks here use brand patterns instead. Pull approved imagery from the DAM for production.
- **Icons are Lucide CDN substitutes.** Replace with WGU's proprietary Simple + Illustrated icon set when exported from the DAM.

---

_Generated April 2026 · WGU Design System v1.0_
