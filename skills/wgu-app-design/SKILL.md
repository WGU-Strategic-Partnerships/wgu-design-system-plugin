---
name: wgu-app-design
description: Use this skill to build full WGU-branded Next.js web applications — internal tools, admin dashboards, role-based portals, and team utilities for WGU staff. Covers the canonical WGU app stack (Next.js 16 + React 19 + Tailwind v4 + Supabase SSR), Google SSO auth restricted to @wgu.edu, the three-role permission model (viewer / admin / superadmin), the shared app shell anatomy, and the eight reusable design primitives that all WGU apps share. Use when the user asks to "build a WGU app", "start a new WGU tool", "scaffold an internal tool for the team", "WGU Next.js app", or anything similar. Do NOT use for marketing pages, decks, or static brand artifacts — those belong on `wgu-design`.
user-invocable: true
---

Read the `README.md` in this folder first, then the relevant docs under `references/`.

For brand fundamentals (colors, type, logos, patterns) defer to the sibling `wgu-design` skill — this skill does not duplicate them.

Key files:
- `README.md` — skill index + activation triggers + assumptions
- `references/stack.md` — the canonical stack (versions pinned to WGU.tools / MBR Builder)
- `references/auth.md` — Google SSO + Smartsheet master roster + impersonation
- `references/app-shell.md` — AppShell + HeaderNav + UserMenu + UserAvatar + ImpersonationBanner
- `references/design-primitives.md` — the 8 shared UI primitives + approved Lucide icons
- `references/archetypes-launcher.md` — the WGU.tools shape (hub of small tools)
- `references/archetypes-deep-app.md` — the MBR Builder shape (single focused tool)
- `references/data-layer.md` — Supabase as default, Salesforce + Smartsheet patterns
- `references/deploy.md` — Vercel, env vars, health-check, deploy gates

When asked to build a WGU app, first ask: "launcher (hub of tools, like WGU.tools) or deep app (single focused tool, like MBR Builder)?" Then read the matching archetype doc and the supporting references before writing any code.

Hard assumptions that ride with this skill:
1. Stack is non-negotiable: Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + `@supabase/ssr` + Lucide.
2. Auth is Google SSO restricted to `@wgu.edu` with three roles sourced from a Smartsheet master roster.
3. Server modules import `server-only`. Third-party data reads always go server-side.
4. Brand tokens come from the sibling `wgu-design` skill, never re-derived.
