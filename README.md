# WGU Design System (Claude Plugin)

A Claude plugin that loads WGU's brand and design system into any Claude Code or Cowork session. Once installed, Claude will automatically apply WGU colors, typography, logos, patterns, slide archetypes, and UI kit components to any artifact it produces (slides, mocks, prototypes, or production code).

This repository doubles as a Claude **plugin marketplace**, so the WGU team can install and update the design system from a single shared source.

## What's in here

```
.claude-plugin/
  plugin.json          Plugin manifest (name, version, description)
  marketplace.json     Marketplace manifest (so this repo can be added as a marketplace)
skills/
  wgu-design/          The WGU design system skill itself
    SKILL.md           Skill manifest read by Claude
    README.md          Full brand system documentation
    colors_and_type.css
    assets/            Logos, patterns, backgrounds
    preview/           Brand preview cards
    slides/            Evergreen slide archetypes
    ui_kits/           Marketing site + student portal kits
    ONBOARDING.md
TEAM_SETUP.md          Team install + contribute guide
README.md              You are here
```

## Quick install (for individuals)

In Claude Code or Cowork:

```
/plugin marketplace add <git-url-of-this-repo>
/plugin install wgu-design-system@wgu
```

After install, the skill auto-activates on prompts like "make a deck about X", "build a landing page for Y", or "design a poster for Z".

## Team setup, contributing, and updates

See [TEAM_SETUP.md](TEAM_SETUP.md).

## Brand questions

`brand@groups.wgu.edu`

Official asset source for WGU employees: WGU DAM (Canto). See `skills/wgu-design/README.md` for direct links to logo, university, and corporate logo collections.
