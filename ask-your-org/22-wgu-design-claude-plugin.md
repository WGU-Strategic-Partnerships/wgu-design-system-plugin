# The WGU Design Claude Plugin

## What it is

`wgu-design` is a Claude plugin (a packaged "skill") that gives Claude expert knowledge of WGU's brand and design system. When the plugin is installed, Claude can:

- Generate on-brand WGU mockups, prototypes, and HTML artifacts.
- Reference exact color, type, and spacing tokens.
- Drop in approved logos, patterns, and backgrounds without searching.
- Apply WGU voice to copy.
- Flag substitutions where licensed fonts or illustrated icons are missing.

It is intended for any WGU employee using Claude (claude.ai, Claude Code, or Cowork) who needs to produce on-brand work quickly.

## Who maintains it

Bentley Folkman owns the plugin and distributes it within WGU.

## What is inside the plugin

- **`SKILL.md`.** The agent manifest.
- **`README.md`.** Full brand system documentation.
- **`colors_and_type.css`.** CSS custom properties for colors, gradients, type, spacing, shadow, and motion.
- **`assets/logos/`.** University logo, owl icon, wordmark (PNG).
- **`assets/patterns/`.** All eight brand patterns in navy, blue, and light tints.
- **`assets/backgrounds/`.** Midnight gradient and other approved backgrounds.
- **`preview/`.** 23 design-system preview cards (HTML).
- **`slides/`.** Six 16:9 slide archetypes (title, section divider, content stats, quote, comparison, closing).
- **`ui_kits/marketing_site/`.** Interactive marketing-homepage React kit.
- **`ui_kits/student_portal/`.** Stub portal, flagged because real source is not provided.

## How to install (typical flow)

The plugin is distributed through Cowork or Claude Code. Bentley provides install instructions to the team. Once installed, Claude in any context (chat, code, or agent mode) can invoke the `wgu-design` skill.

## How to use it in a session

You usually do not need to invoke the plugin manually. If you ask Claude to:

- "Make me a quick WGU-branded landing page mock"
- "Generate a slide deck in WGU style"
- "What is the exact WGU Blue hex?"
- "Build a stat card with WGU type and color"

Claude will automatically pull the `wgu-design` skill and apply the rules.

You can also invoke it explicitly: "Use the wgu-design skill to..."

## The hard rules the plugin enforces

The plugin will resist or flag if asked to break any of these rules. They match the brand's non-negotiables.

1. WGU Blue (#002855) must appear on every designed asset.
2. Never alter logos, seal, icons, or patterns.
3. Never tint or adjust opacity of brand colors.
4. The wordmark always appears without the owl icon.
5. The owl icon alone is only for student, alumni, or employee audiences.
6. No owl puns. No emoji in brand collateral.
7. Futura PT (or Arial fallback) for type. Rocky for isolated numerals only. Program Nar OT Black only for Education for the People campaign headlines. The plugin substitutes Jost, Newsreader, and Oswald respectively for web preview, and flags the substitution.

## What the plugin will not do

- Produce production assets without flagging font and icon substitutions.
- Ship licensed fonts.
- Bypass Brand Governance approvals.
- Generate WGU imagery without flagging that production photography must come from Canto.

## When to use the plugin vs. when to call Brand Governance

The plugin is great for:

- Prototypes and mockups.
- Internal slide decks and one-pagers.
- Throwaway concept work.
- Education on the brand system.

The plugin is **not** a substitute for Brand Governance review on:

- Public-facing marketing campaigns.
- Co-branded assets.
- Use of the Academic Seal.
- New patterns, icons, or campaign creative.

When in doubt, draft with the plugin and review with brand@groups.wgu.edu.

## Feedback

Send issues, requests, and suggestions to Bentley directly.
