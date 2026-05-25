# Scaffold a new WGU app — bootstrap procedure

You arrived here because the user wants to **bootstrap a new WGU app from the canonical scaffold**. Follow this procedure exactly. Ask one question per turn. Don't batch questions.

If the user is asking a documentation question instead ("what's the WGU auth pattern?"), exit this file and answer from `references/`. This procedure is only for scaffolding a fresh project.

---

## Step 0 — Resolve the scaffold path

The canonical scaffold lives at `<this skill's directory>/scaffold/`. Resolve the absolute path before any copying.

In Claude Code with this plugin installed, the skill's directory is wherever Claude loaded `SKILL.md` from. Use Bash to capture it as a variable:

```bash
# If you know the SKILL.md path, the scaffold is its sibling directory.
SKILL_DIR="$(dirname "$(readlink -f /path/to/this/SKILL.md 2>/dev/null || echo /path/to/this/SKILL.md)")"
SCAFFOLD_DIR="$SKILL_DIR/scaffold"
ls "$SCAFFOLD_DIR"
```

Confirm `$SCAFFOLD_DIR` contains `_common/`, `launcher/`, and `deep_app/`. If it doesn't, stop and report the plugin installation looks incomplete.

---

## Step 1 — Ask the archetype (Question 1 of 4)

Use the `AskUserQuestion` tool:

- **Question:** "Launcher (hub of small tools, like WGU.tools) or deep app (single focused tool, like MBR Builder)?"
- **Header:** "Archetype"
- **Options:**
  - "Launcher — hub of small tools" — multiple small SP / staff tools share one home + auth shell. Bento home, command palette, per-app access grants.
  - "Deep app — single focused tool" — one workflow goes deep. Role-scoped pages, history, data viz.
- **Multi-select:** false

Map the answer to a subdirectory:
- Launcher → `$SCAFFOLD_DIR/launcher`
- Deep app → `$SCAFFOLD_DIR/deep_app`

Then read the matching archetype doc (`references/archetypes-launcher.md` or `references/archetypes-deep-app.md`) so you're refreshed on what's about to land.

---

## Step 2 — Ask the project name (Question 2 of 4)

Ask in plain text:

> "What's the project name? Convention: lowercase, hyphen-separated (e.g., `sp-renewal-tracker`). It's used in `package.json`, page titles, the project folder name, and the `__APP_NAME__` substitution."

Validation:
- Lowercase only. Reject uppercase or spaces.
- Hyphen-separated (no underscores).
- 3–40 characters.
- Matches `^[a-z][a-z0-9-]+[a-z0-9]$`.

If the user gives "SP Renewals" or "sp_renewals", politely suggest "sp-renewals" and confirm. Don't proceed until the name passes validation.

Save the validated name as `$PROJECT_NAME`.

---

## Step 3 — Ask the target directory (Question 3 of 4)

Use `AskUserQuestion`:

- **Question:** "Where should the project live?"
- **Header:** "Target dir"
- **Options:**
  - "`~/Documents/Claude/Projects/<name>` (Recommended)" — Bentley's convention; keeps WGU work co-located.
  - "Different absolute path"
- **Multi-select:** false

If they pick "Different", ask for the absolute path in a plain-text follow-up. Expand `~` to `$HOME`. Save as `$TARGET_DIR`.

---

## Step 4 — Ask about Supabase project (Question 4 of 4)

Use `AskUserQuestion`:

- **Question:** "Do you have a Supabase project ready, or will you create one after scaffolding?"
- **Header:** "Supabase"
- **Options:**
  - "Already have one — I'll paste the project ID next"
  - "I'll create it after scaffolding (Recommended)" — Most builders create the Supabase project after first commit so the project name matches.
- **Multi-select:** false

If "Already have one", ask in plain text for the project ID (format: `<lowercase-alphanumeric>` from `https://<id>.supabase.co`). Save as `$SUPABASE_PROJECT_ID`.

If "create later", leave `$SUPABASE_PROJECT_ID` empty.

---

## Step 5 — Print confirmation summary

Show the user a single message with the planned operation. Use plain markdown:

```
About to scaffold a new WGU app.

  Project name:   <PROJECT_NAME>
  Archetype:      <launcher | deep app>
  Target dir:     <TARGET_DIR>
  Supabase:       <project-id OR "will create after scaffolding">

What I'll do:
  1. Create the target directory (if it doesn't exist)
  2. Copy <count_common> files from scaffold/_common/
  3. Copy <count_archetype> files from scaffold/<archetype>/
  4. Substitute __APP_NAME__ → <PROJECT_NAME> in package.json + layout.tsx
  5. (If Supabase ID given) Set NEXT_PUBLIC_SUPABASE_URL in .env.example
  6. git init + first commit
  7. pnpm install (will take 30–60s)
  8. pnpm typecheck (must exit 0)

What I will NOT do (you'll handle manually):
  - Create the Supabase project (if not provided)
  - Register the Google OAuth client
  - Set up the Smartsheet master roster
  - Create the Vercel project
  - Set production env vars on Vercel

Proceed? (yes / no)
```

Wait for explicit "yes" or "proceed". Any other answer → stop and ask what to change.

---

## Step 6 — Pre-flight checks

Run these before touching anything:

```bash
# Target dir must either not exist OR be empty:
if [ -d "$TARGET_DIR" ] && [ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
  echo "REFUSE: $TARGET_DIR exists and is non-empty."
  exit 1
fi

# Scaffold dir sanity:
[ -d "$SCAFFOLD_DIR/_common" ] || { echo "missing _common"; exit 1; }
[ -d "$SCAFFOLD_DIR/$ARCHETYPE_DIR" ] || { echo "missing archetype dir"; exit 1; }

# Required tools:
command -v pnpm >/dev/null || { echo "pnpm not installed — install pnpm before continuing"; exit 1; }
command -v git >/dev/null  || { echo "git not installed"; exit 1; }
```

If the target dir is non-empty, DO NOT delete it. Tell the user it's non-empty, ask them to remove or pick a different path, then re-ask Step 3. Never auto-delete user content.

If `pnpm` is missing, stop. Don't fall back to npm — the canon is pnpm.

---

## Step 7 — Copy the scaffold

```bash
mkdir -p "$TARGET_DIR"
cp -R "$SCAFFOLD_DIR/_common/." "$TARGET_DIR/"
cp -R "$SCAFFOLD_DIR/$ARCHETYPE_DIR/." "$TARGET_DIR/"
```

The two `cp -R` invocations layer the archetype on top of `_common`. Where the archetype defines a file at the same path as `_common`, the archetype wins (that's what we want).

Verify by checking a known archetype-only file:
- Launcher: `[ -f "$TARGET_DIR/src/app/page.tsx" ] || echo "missing launcher page.tsx"`
- Deep app: `[ -f "$TARGET_DIR/src/app/role/[role]/page.tsx" ] || echo "missing deep_app role page"`

---

## Step 8 — `__APP_NAME__` substitution

```bash
cd "$TARGET_DIR"

# package.json + layout.tsx are the two surgical locations:
sed -i.bak "s/__APP_NAME__/$PROJECT_NAME/g" package.json
sed -i.bak "s/__APP_NAME__/$PROJECT_NAME/g" src/app/layout.tsx

# If a README.md exists with __APP_NAME__ placeholders, substitute too:
if [ -f README.md ] && grep -q '__APP_NAME__' README.md; then
  sed -i.bak "s/__APP_NAME__/$PROJECT_NAME/g" README.md
fi

# Clean up sed's backup files:
find . -name '*.bak' -delete
```

Verify there are no leftover `__APP_NAME__` strings in user-facing files:

```bash
grep -rn '__APP_NAME__' --include='*.json' --include='*.tsx' --include='*.ts' --include='*.md' . | grep -v node_modules | head
```

If hits remain, surface them — they may need manual review. Don't over-substitute (e.g., in comments that document the substitution pattern itself).

---

## Step 9 — Wire Supabase URL if provided

If `$SUPABASE_PROJECT_ID` is set:

```bash
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=https://$SUPABASE_PROJECT_ID.supabase.co|" "$TARGET_DIR/.env.example"
rm -f "$TARGET_DIR/.env.example.bak"
```

(Anon key, service role, etc. still need to be set manually — those come from the Supabase dashboard, not the project ID.)

---

## Step 10 — First commit

```bash
cd "$TARGET_DIR"
git init -b main
git add .
git commit -m "scaffold: $PROJECT_NAME ($ARCHETYPE) — bootstrapped from wgu-app-design"
```

---

## Step 11 — Install + typecheck

```bash
cd "$TARGET_DIR"
pnpm install
pnpm typecheck
```

Both must exit 0.

**If `pnpm install` fails:** print the last 30 lines of output. Common causes: network, pnpm version mismatch, registry auth. Stop and let the user resolve — don't try to fix it.

**If `pnpm typecheck` fails:** print the errors. This means the scaffold has a regression — file an issue against `wgu-app-design`, don't try to patch in the new project. The new project should be deletable + re-runnable cleanly. Stop after printing.

If both pass, proceed.

---

## Step 12 — Print the final manual-steps checklist

Print this to the user, customizing the project paths inline:

```
✅ Scaffolded `$PROJECT_NAME` at `$TARGET_DIR`.
   Stack: Next.js 16 + React 19 + Tailwind v4 + Supabase SSR.
   Archetype: <launcher | deep app>.
   First commit: <git rev-parse --short HEAD>.

Next steps — manual, in order:

1. Supabase project
   • Create at https://supabase.com/dashboard (if not provided already).
   • Enable Email + Google providers under Authentication → Providers.
   • Restrict email domain allowlist to @wgu.edu (Auth → Email → Restrict Domain).
   • Apply the schema from `supabase/README.md` in your new project
     (members + app_access tables; optionally app_health + usage_events).
   • Reference: ./scaffold-bootstrap → references/data-layer.md

2. Google OAuth client
   • https://console.cloud.google.com/apis/credentials → Create OAuth 2.0 Client.
   • Type: Web application.
   • Authorized JS origins:
       http://localhost:3000
       https://<your-vercel-url>
   • Authorized redirect URIs:
       https://<supabase-project>.supabase.co/auth/v1/callback
   • Paste Client ID + Secret into Supabase → Authentication → Providers → Google.
   • Reference: references/auth.md

3. Smartsheet master roster
   • Create a Members sheet (columns: Email, DisplayName, Role, AvatarUrl, IsAdmin, AvatarKind, AvatarEmoji, AvatarColor, AddedBy, AddedAt, Notes).
   • Create an App Access sheet (columns: Email, AppSlug, GrantedBy, GrantedAt).
   • Copy the sheet IDs into `src/lib/sheets.ts` (replace the `0 as const` placeholders).
   • Reference: references/data-layer.md

4. Vercel project
   • vercel.com → New Project → Import this repo (after you push to GitHub).
   • If monorepo, set Root Directory to the project subfolder.
   • Reference: references/deploy.md

5. Env vars — set both locally (`.env.local`) and in Vercel project settings:
   • NEXT_PUBLIC_SUPABASE_URL          (Supabase project settings)
   • NEXT_PUBLIC_SUPABASE_ANON_KEY     (Supabase project settings)
   • SUPABASE_SERVICE_ROLE_KEY         (Supabase, server-only)
   • SMARTSHEET_API_TOKEN              (Smartsheet console, server-only)
   • CRON_SECRET                       (any random string, server-only)
   • AUTH_COOKIE_DOMAIN                (optional, for prod — see references/auth.md)

Test locally:
   cd $TARGET_DIR
   pnpm dev          # → http://localhost:3000 → should redirect to /login
   pnpm test:smoke   # → Playwright login-redirect smoke

When you push to GitHub + connect Vercel, you're live.

Questions about the canon → references/*.md inside this plugin's skill folder.
Auth questions → references/auth.md.
Brand questions → @brand@groups.wgu.edu or the sibling `wgu-design` skill.
```

---

## Failure modes — quick reference

| Situation | Action |
|---|---|
| Target dir exists + non-empty | Refuse. Re-ask Step 3 with a different path. Don't delete. |
| `pnpm` not installed | Stop. User installs pnpm and re-invokes. |
| `pnpm install` fails | Print last 30 lines. Stop. User resolves network/auth/version. |
| `pnpm typecheck` fails | Print errors. Stop. This is a scaffold regression — file an issue, don't patch downstream. |
| User says "no" at Step 5 confirm | Ask what they want to change. Re-ask the relevant question. Don't auto-restart. |
| User cancels mid-execution | Whatever's already on disk stays. Don't auto-rollback unless they ask. |

## Non-actions (will not do, ever)

- Create the Supabase project (requires Supabase auth — user does manually).
- Register the Google OAuth client (requires Google Cloud Console auth).
- Create the Smartsheet sheets (requires Smartsheet API auth + token).
- Create the Vercel project (requires Vercel auth).
- Set env vars on Vercel (requires Vercel auth).
- Push to GitHub (requires the user to set the remote + push themselves).

These all involve credentials and side effects outside the local repo. The skill surfaces them as manual steps with reference links.
