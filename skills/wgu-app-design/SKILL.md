---
name: wgu-app-design
description: Use this skill to build full WGU-branded Next.js web applications — internal tools, admin dashboards, role-based portals, and team utilities for WGU staff. Covers the canonical WGU app stack (Next.js 16 + React 19 + Tailwind v4 + Supabase SSR), Google SSO auth restricted to @wgu.edu, the three-role permission model (viewer / admin / superadmin), the shared app shell anatomy, and the eight reusable design primitives that all WGU apps share. Use when the user asks to "build a WGU app", "start a new WGU tool", "scaffold an internal tool for the team", "WGU Next.js app", or anything similar. Do NOT use for marketing pages, decks, or static brand artifacts — those belong on `wgu-design`.
user-invocable: true
---

## Routing — decide what the user wants

This skill has two modes:

1. **Bootstrap mode** — user wants to **scaffold a new WGU app from the canonical scaffold**. Triggers: "build me a WGU app", "scaffold a new WGU tool", "start a new WGU Next.js app", "create a WGU internal tool", or any other phrasing that implies creating a fresh project from scratch.
   → **Read `scaffold-bootstrap.md` and follow its procedure exactly.** It's a 12-step decision tree (ask 4 questions, confirm, then copy + substitute + git init + pnpm install + typecheck + print manual checklist).

2. **Documentation / Q&A mode** — user wants to learn about the canon ("what's the WGU auth pattern?", "what's in the app shell?", "how does role-based access work?"). Triggers: "what's the…", "how does…", "explain…", "show me…".
   → **Skip `scaffold-bootstrap.md`.** Read `README.md` first, then the relevant `references/*.md` to answer.

If the user's intent is ambiguous, ask one clarifying question: "Are you trying to scaffold a new app, or asking about the canon?" Don't assume.

## Files in this skill

- `README.md` — skill index + activation triggers + assumptions
- `scaffold-bootstrap.md` — **the bootstrap procedure** (12-step decision tree; used in bootstrap mode)
- `scaffold/_common/` — base layer copied for both archetypes (configs, pages, libs, components, ui primitives)
- `scaffold/launcher/` — overlay for the launcher archetype (bento home, command palette, app registry)
- `scaffold/deep_app/` — overlay for the deep-app archetype (role-scoped pages, history, viz primitives)
- `references/stack.md` — the canonical stack (versions pinned to WGU.tools / MBR Builder)
- `references/auth.md` — Google SSO + Smartsheet master roster + impersonation
- `references/app-shell.md` — AppShell + HeaderNav + UserMenu + UserAvatar + ImpersonationBanner
- `references/design-primitives.md` — the 8 shared UI primitives + approved Lucide icons
- `references/archetypes-launcher.md` — the WGU.tools shape (hub of small tools)
- `references/archetypes-deep-app.md` — the MBR Builder shape (single focused tool)
- `references/data-layer.md` — Supabase as default, Salesforce + Smartsheet patterns
- `references/deploy.md` — Vercel, env vars, health-check, deploy gates

For brand fundamentals (colors, type, logos, patterns) defer to the sibling `wgu-design` skill — this skill does not duplicate them.

## Hard assumptions that ride with this skill

1. Stack is non-negotiable: Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + `@supabase/ssr` + Lucide. `src/` directory layout.
2. Auth is Google SSO restricted to `@wgu.edu` with three roles sourced from a Smartsheet master roster.
3. Server modules import `server-only`. Third-party data reads always go server-side.
4. Brand tokens come from the sibling `wgu-design` skill, never re-derived.
