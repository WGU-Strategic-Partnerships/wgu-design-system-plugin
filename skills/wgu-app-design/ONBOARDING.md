# WGU App Design — Team Onboarding

This skill is for WGU staff building full Next.js apps for internal teams (Strategic Partnerships tools, admin dashboards, role-based portals). It ships alongside the `wgu-design` brand skill in the same plugin.

## Quick start

In a Claude Code or Cowork session where the `wgu-design-system` plugin is installed, just describe what you need:

- "Scaffold a new WGU internal tool for tracking partner renewals."
- "Build a WGU admin dashboard for the SP roster."
- "Start a new WGU Next.js app for the events team."

Claude will read `SKILL.md` automatically and ask "launcher or deep app?" before writing code.

## What you get (Phase 1)

Phase 1 is **reference docs only.** Claude will write the app by hand following the canon — same stack, same auth, same shell, same primitives as WGU.tools and MBR Builder.

A future Phase 2 will add a copyable scaffold so Claude can `cp -r` the right files. A future Phase 3 will turn this into a one-shot bootstrap.

## Hard assumptions (Claude follows these automatically)

1. Stack is Next.js 16 + React 19 + TypeScript + Tailwind v4 + `@supabase/ssr` + Lucide. `src/` layout.
2. Auth is Google SSO restricted to `@wgu.edu`.
3. Three roles: viewer / admin / superadmin. Sourced from a Smartsheet master roster.
4. Server modules import `server-only`. Third-party reads always server-side.
5. The eight shared UI primitives (Eyebrow, Numeral, Arrow, Delta, WGUMark, StatusPill, RoleChip, Hairline) are reused before inventing new ones.
6. Brand tokens (color, type, logos, patterns) come from the sibling `wgu-design` skill.

## Manual setup the skill does NOT do for you

Even in Phase 3, the skill will surface these as manual steps:

- Create the Supabase project for the new app.
- Register the Google OAuth client.
- Set up the Smartsheet master roster (or get added to an existing one).
- Create the Vercel project.
- Set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AUTH_COOKIE_DOMAIN`).

## When to use `wgu-design` instead

For brand artifacts that aren't full apps:
- Decks and slide presentations
- Marketing landing pages
- Posters, social tiles, static brand mocks
- Color / type / logo / pattern questions

## Questions

App-design questions: ping Bentley.
Brand questions: `brand@groups.wgu.edu`.

---

_WGU App Design Skill · Phase 1 (docs) · 2026-05-24_
