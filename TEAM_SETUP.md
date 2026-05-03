# Team Setup Guide

How the WGU team installs, uses, and contributes to the WGU Design System Claude plugin.

## 1. One-time: get this repo into a shared Git location

Pick a shared Git host and push this folder to it. Recommended options, in order of preference:

1. **WGU's internal GitHub Enterprise / Bitbucket / Azure DevOps**, in a repo like `wgu/wgu-design-system-plugin`. Best for IP and access control.
2. **A private GitHub repo** under a WGU org, with the team added as collaborators.

The repo URL is what every teammate will use to add the marketplace.

```bash
# from inside this folder
git init
git add .
git commit -m "Initial WGU design system plugin"
git branch -M main
git remote add origin <your-shared-repo-url>
git push -u origin main
```

## 2. Each teammate installs the plugin

In Claude Code or Cowork, run:

```
/plugin marketplace add <your-shared-repo-url>
/plugin install wgu-design-system@wgu
```

The first command registers this repo as a plugin marketplace named `wgu`. The second installs the design system plugin from it.

Verify it's working by asking Claude something like:

> Make me a one-slide title deck for our Q4 enrollment update.

Claude should pull WGU Blue (#002855), the right typography, and the title slide archetype from `skills/wgu-design/slides/`.

## 3. How to update the design system

The plugin lives in Git, so updates happen the same way as any other repo: branch, change, PR, merge.

Common updates:
- New brand asset (logo variant, pattern): drop the file into `skills/wgu-design/assets/...` and reference it from `README.md` if it deserves a callout.
- Brand rule change: edit `skills/wgu-design/SKILL.md` (the "Hard rules" list at the bottom) and `skills/wgu-design/README.md`.
- New slide archetype: add the HTML to `skills/wgu-design/slides/` and link it from the slides index.
- Token change (color, type, spacing): edit `skills/wgu-design/colors_and_type.css`.

When you ship a meaningful change, bump the version in **two** places:
- `.claude-plugin/plugin.json` → `version`
- `.claude-plugin/marketplace.json` → `metadata.version` and the matching `plugins[0].version`

Use semver: `MAJOR.MINOR.PATCH`. Bump MINOR for additions, PATCH for fixes, MAJOR for breaking brand changes.

## 4. How teammates pull updates

After a change is merged to `main`, teammates run:

```
/plugin marketplace update wgu
/plugin update wgu-design-system
```

Or set the marketplace to auto-update in Cowork settings.

## 5. Working folder vs. Git copy

If a teammate wants to also use the system as a project folder in claude.ai (the way Bentley originally did), they can clone the repo locally and point claude.ai at the cloned folder. The `skills/wgu-design/` subfolder is the same content the plugin loads, so both paths produce identical brand output.

## 6. Governance

- Brand owner: see contacts at [brand.wgu.edu](https://brand.wgu.edu)
- All PRs that change `SKILL.md`'s hard rules, the logo files, or `colors_and_type.css` should require brand-team review.
- All other PRs (new examples, new slides, doc edits) can be merged by any team contributor.

## 7. Questions

Brand questions: [brand.wgu.edu](https://brand.wgu.edu)
Plugin / Claude questions: ping Bentley.
