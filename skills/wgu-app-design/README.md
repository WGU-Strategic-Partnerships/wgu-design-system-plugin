# WGU App Design Skill

The WGU-canonical playbook for building full Next.js web apps for the Strategic Partnerships / WGU staff audience. Captures the stack, auth model, page set, app shell anatomy, and design vocabulary used by [WGU.tools](https://wgu.tools) (launcher archetype) and the MBR Builder (deep-app archetype).

This skill is the sibling of `wgu-design`, which owns brand fundamentals (color, type, logos, patterns) for any artifact. `wgu-app-design` cross-links to `wgu-design` rather than duplicating it.

## When this skill fires

Activation triggers on prompts like:
- "build a WGU internal tool"
- "start a new WGU app"
- "scaffold an internal tool for the team"
- "WGU Next.js app"

It does **not** fire on "make a WGU deck / poster / landing page" — those stay on `wgu-design`.

## What this skill assumes

Every WGU app following this canon ships with:

1. **Stack** — Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + `@supabase/ssr` + Lucide. `src/` directory layout. See [references/stack.md](references/stack.md).
2. **Auth** — Google SSO restricted to `@wgu.edu`. Three roles (viewer / admin / superadmin) sourced from a Smartsheet master roster. Hard-coded `ADMIN_EMAILS` break-glass set. View-as / impersonation via the `wgu_view_as` cookie. See [references/auth.md](references/auth.md).
3. **App shell** — `AppShell` + `HeaderNav` + `UserMenu` + `UserAvatar` + `ImpersonationBanner`. See [references/app-shell.md](references/app-shell.md).
4. **Primitives** — `Eyebrow`, `Numeral`, `Arrow`, `Delta`, `WGUMark`, `StatusPill`, `RoleChip`, `Hairline`. See [references/design-primitives.md](references/design-primitives.md).
5. **Archetype** — Either a launcher (hub of small tools) or a deep app (single focused tool). See [references/archetypes-launcher.md](references/archetypes-launcher.md) or [references/archetypes-deep-app.md](references/archetypes-deep-app.md).
6. **Data** — Supabase as the default. Salesforce + Smartsheet reads go server-side. See [references/data-layer.md](references/data-layer.md).
7. **Deploy** — Vercel + env vars + `/api/health-check` + `pnpm typecheck` / `pnpm lint` gates. See [references/deploy.md](references/deploy.md).

## Reference docs

| Doc | Owns |
|---|---|
| [stack.md](references/stack.md) | The canonical stack and pinned versions |
| [auth.md](references/auth.md) | Google SSO + roles + master roster + impersonation |
| [app-shell.md](references/app-shell.md) | AppShell + HeaderNav + UserMenu + UserAvatar + ImpersonationBanner anatomy |
| [design-primitives.md](references/design-primitives.md) | The 8 shared primitives + approved Lucide icons |
| [archetypes-launcher.md](references/archetypes-launcher.md) | WGU.tools shape (bento, AppChipRow, FeaturedAppTile, CommandPalette) |
| [archetypes-deep-app.md](references/archetypes-deep-app.md) | MBR Builder shape (role pages, history, viz) |
| [data-layer.md](references/data-layer.md) | Supabase + Salesforce + Smartsheet patterns |
| [deploy.md](references/deploy.md) | Vercel + env vars + health-check + deploy gates |

## How a build session works

When you prompt Claude to "build a WGU app" (or any matching phrase), the skill activates in **bootstrap mode**:

1. Claude reads `SKILL.md` → routes to `scaffold-bootstrap.md`.
2. Claude asks 4 questions: archetype (launcher / deep app), project name, target directory, Supabase project ID (optional).
3. Claude confirms the plan, then copies `scaffold/_common/` + the chosen archetype overlay into the target directory.
4. `__APP_NAME__` is substituted with your project name in `package.json` + `layout.tsx`.
5. `git init` + first commit.
6. `pnpm install` + `pnpm typecheck` (both must exit 0; otherwise Claude stops).
7. Claude prints a manual-steps checklist (create Supabase project, register Google OAuth, set up Smartsheet master roster, create Vercel project, set env vars).

When you ask Claude a documentation question instead ("what's the WGU auth pattern?"), the skill activates in **Q&A mode** and answers from `references/*.md` without scaffolding anything.

## What the bootstrap will NOT do

Even in bootstrap mode, these stay manual:
- Create the Supabase project.
- Register the Google OAuth client.
- Create the Smartsheet master-roster sheets.
- Create the Vercel project.
- Push to a remote.

All require credentials/auth this skill doesn't carry. The final checklist links each one to the right reference doc.

## Build history

- **Phase 1 — Reference docs** (shipped).
- **Phase 2 — Copyable scaffold** under `scaffold/_common/`, `scaffold/launcher/`, `scaffold/deep_app/` (shipped, ~80 files, verified `pnpm typecheck + lint` exit 0).
- **Phase 3 — Decision-tree bootstrap** via `scaffold-bootstrap.md` (shipped — you're reading the post-Phase-3 README).

## Source apps (the canon)

- **WGU.tools** — launcher archetype, slightly newer; tiebreaker when the two apps disagree.
- **MBR Builder** — deep-app archetype; source for the design primitives in `src/components/ui/`.

## Brand questions

For brand-level questions (color, type, logos), see the sibling `wgu-design` skill or email `brand@groups.wgu.edu`.
