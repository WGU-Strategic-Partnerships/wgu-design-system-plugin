---
name: wgu-design
description: Use this skill to generate well-branded interfaces and assets for Western Governors University (WGU), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key files:
- `README.md` — full brand system: mission, voice, colors, type, iconography, visual foundations
- `colors_and_type.css` — ready-to-import CSS tokens (--wgu-blue, --wgu-lime, type scale, spacing, shadows, motion)
- `SKILL.md` — this file
- `assets/logos/` — university logo, owl icon, wordmark (PNG)
- `assets/patterns/` — 8 brand pattern families (Swirl, Network, Comms, Connect, Flow, Elevate, Growth, Pathways) in navy, blue, and light tints
- `assets/backgrounds/` — midnight gradient bg
- `preview/` — 23 design-system preview cards
- `slides/` — 6 Evergreen-template slide archetypes (title, section, stats, quote, comparison, closing)
- `ui_kits/marketing_site/` — interactive marketing-homepage React kit
- `ui_kits/student_portal/` — stub portal (flag to user that real source is not provided)

Hard rules to respect:
1. WGU Blue (#002855) must appear on every designed asset.
2. Never alter logos, seal, icons, or patterns.
3. Never tint / adjust opacity of brand colors.
4. Wordmark always used without the owl icon.
5. Owl icon alone only for student/alumni/employee audiences.
6. No owl puns. No emoji in brand collateral.
7. Futura PT (or Arial fallback) for type; Rocky serif only for isolated infographic numerals; Program Nar OT Black only for Education for the People campaign headlines. This project substitutes Jost / Newsreader / Oswald respectively — flag the substitution when producing production work.
