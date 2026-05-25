# Supabase schema for the master-roster pattern

This directory is a placeholder for Supabase migrations and configuration.
The tables below are expected by `_common/src/lib/` — create them in your
Supabase project before deploying.

---

## `members`

Strict roster of who can sign in. One row per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Supabase-generated. |
| `email` | `text` (unique, not null) | Lowercased `@yourdomain` address. |
| `display_name` | `text` | Preferred name shown across all apps. |
| `avatar_kind` | `text` | One of `initials`, `emoji`, `photo`. |
| `avatar_emoji` | `text` | Single emoji character when `avatar_kind = emoji`. |
| `avatar_color` | `text` | Hex color (`#002855`) for initials/emoji backdrop. |
| `avatar_url` | `text` | Public Supabase Storage URL of the user's photo. |
| `is_admin` | `boolean` | Legacy admin flag; prefer `role = 'Admin'`. |
| `role` | `text` | Picklist: `Admin`, `Director`, `Manager`, `Ops Team`, `SPM`. |
| `added_by` | `text` | Email of the admin who granted access. |
| `added_at` | `date` | ISO date string of when access was granted. |
| `notes` | `text` | Optional freeform notes visible only to admins. |
| `created_at` | `timestamptz` | Row creation timestamp. |
| `modified_at` | `timestamptz` | Last update timestamp. |

> Note: the `_common` libs read the master roster from **Smartsheet** (not
> this table) via `src/lib/master-roster.ts` and `src/lib/sheets.ts`. This
> `members` table is included here for apps that prefer a Supabase-only
> data layer. See `references/data-layer.md` for the full trade-off
> discussion.

---

## `app_access`

Per-`(member, app)` access grants. One row per grant.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Supabase-generated. |
| `grant_id` | `text` (unique) | Composite key `email\|app_slug`. |
| `member_email` | `text` (FK → `members.email`) | Lowercased. |
| `app_slug` | `text` | Must match a value in `APP_SLUGS` (`src/lib/sheets.ts`). |
| `granted_by` | `text` | Email of the admin who granted access. |
| `granted_at` | `date` | ISO date string. |
| `created_at` | `timestamptz` | Row creation timestamp. |
| `modified_at` | `timestamptz` | Last update timestamp. |

---

## `app_health` _(optional)_

Written by `/api/health-check` (cron every 5 min). Read by `src/lib/health.ts`
to show the live status dot on each tile. Used by `src/lib/health.ts`.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` (PK, serial) | Auto-increment. |
| `app_slug` | `text` (not null) | The app being probed. |
| `status` | `text` | `up`, `degraded`, or `down`. |
| `status_code` | `int` | HTTP status code returned, or null on network error. |
| `latency_ms` | `int` | Round-trip latency in milliseconds. |
| `error` | `text` | Error message if down, null otherwise. |
| `checked_at` | `timestamptz` | When the check ran (default `now()`). |

---

## `usage_events` _(optional)_

Written by `/api/track`. Read by `src/lib/usage.ts` for the admin usage
dashboard. Uses the service-role key (RLS bypassed).

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` (PK, serial) | Auto-increment. |
| `user_email` | `text` (not null) | Lowercased email of the user. |
| `user_name` | `text` | Display name at the time of the event. |
| `app_slug` | `text` (not null) | Which app fired the event. |
| `path` | `text` | URL path (max 1 024 chars). |
| `event_type` | `text` | `view`, `heartbeat`, or `unload`. |
| `session_id` | `text` (not null) | Random ID generated client-side per tab. |
| `duration_ms` | `int` | Milliseconds since page load; null on `view`. |
| `created_at` | `timestamptz` | When the event was received (default `now()`). |

---

## Cross-references

- `references/auth.md` — how the auth layer uses Supabase SSR + Google OAuth.
- `references/data-layer.md` — master-roster pattern, Smartsheet vs. Supabase
  trade-offs, and how to use this schema as a Supabase-only alternative.
