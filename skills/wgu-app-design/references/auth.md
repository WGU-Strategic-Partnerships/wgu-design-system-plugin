# Auth

## The auth model

WGU.tools uses Google SSO restricted to `@wgu.edu` accounts. After a successful OAuth exchange, `getCurrentUser()` looks up the signed-in address against the Smartsheet "master roster" (Members sheet, `Role` column) to determine role. There are three roles: **viewer** (on roster, no special flags), **admin** (`Role === 'Admin'` on the Members sheet), and **superadmin** (same as admin, but also listed in the hard-coded `ADMIN_EMAILS` set in `lib/auth.ts`). The `ADMIN_EMAILS` set is a break-glass mechanism — it survives any edit to the Smartsheet and ensures the founder can never lock themselves out by flipping their own admin flag off.

## The `CurrentUser` type

<!-- src: wgu-tools/src/lib/auth.ts lines 16–31 -->
```ts
export type CurrentUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  /** True when the user is on the master roster OR is a hard-coded admin. */
  isMember: boolean
  /** True when the user can reach /admin. */
  isAdmin: boolean
  /** App slugs the user has been granted access to. Empty set unless granted. */
  accessibleApps: Set<AppSlug>
  /** When the real session is an admin and "View as" is active, this
   *  carries the real admin's identity so the UI can show a banner and
   *  block admin write actions. Null in normal sessions. */
  impersonator: { email: string; name: string | null } | null
}
```

## `isAllowedEmail` and `isAdminEmail`

<!-- src: wgu-tools/src/lib/auth.ts lines 33–41 -->
```ts
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.has(email.toLowerCase())
}
```

## `getCurrentUser()` end-to-end

<!-- src: wgu-tools/src/lib/auth.ts lines 43–96 -->
```ts
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return null
  if (!isAllowedEmail(user.email)) return null

  const email = user.email.toLowerCase()
  const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string } | null
  const hardCodedAdmin = isAdminEmail(email)
  const member = await getMember(email)
  // Admin status is driven by the Role field on the Members sheet
  // (Role === 'Admin') plus the hard-coded ADMIN_EMAILS list. The legacy
  // IsAdmin checkbox is no longer consulted.
  const realIsAdmin = hardCodedAdmin || member?.role === 'Admin'
  const onRoster = hardCodedAdmin || member !== null
  const realGrants = realIsAdmin || onRoster ? await getAccessibleApps(email) : new Set<AppSlug>()

  const realName = member?.displayName ?? meta?.full_name ?? meta?.name ?? null
  const realAvatar = member?.avatarUrl ?? meta?.avatar_url ?? null

  // If the real session is an admin and they've toggled "View as" on
  // someone, swap the visible identity for that member. The actor's
  // identity is preserved on `impersonator` so the UI can show a banner.
  if (realIsAdmin) {
    const impersonatedEmail = await readImpersonateCookie()
    if (impersonatedEmail && impersonatedEmail !== email) {
      const target = await getMember(impersonatedEmail)
      if (target) {
        const targetGrants = await getAccessibleApps(target.email)
        return {
          id: user.id,
          email: target.email,
          name: target.displayName ?? target.email.split('@')[0],
          avatarUrl: target.avatarUrl,
          isMember: true,
          isAdmin: target.role === 'Admin' || isAdminEmail(target.email),
          accessibleApps: targetGrants,
          impersonator: { email, name: realName },
        }
      }
    }
  }

  return {
    id: user.id,
    email,
    name: realName,
    avatarUrl: realAvatar,
    isMember: onRoster,
    isAdmin: realIsAdmin,
    accessibleApps: realGrants,
    impersonator: null,
  }
}
```

The call sequence inside `getCurrentUser()` is: (1) instantiate the server Supabase client and read the current session via `getUser()`; (2) bail early if no session or the email is not `@wgu.edu`; (3) call `getMember(email)` to look up the member row from the Smartsheet roster, which provides display name, avatar URL, and role; (4) combine the hard-coded `ADMIN_EMAILS` set with the roster's `Role === 'Admin'` check to determine `realIsAdmin`; (5) if the user is an admin and the `wgu_view_as` cookie is present, read `readImpersonateCookie()`, fetch the target member, and return a `CurrentUser` shaped as the target but with the real actor's identity stored in the `impersonator` field — this is what drives the impersonation banner and blocks write actions in the admin UI.

## The `wgu_view_as` cookie

<!-- src: wgu-tools/src/lib/auth.ts lines 98–107 -->
```ts
async function readImpersonateCookie(): Promise<string | null> {
  // Lazy import to avoid pulling next/headers into modules that may run
  // outside a request context.
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const raw = store.get('wgu_view_as')?.value
  if (!raw) return null
  const email = raw.toLowerCase().trim()
  return email.includes('@') ? email : null
}
```

Admins toggle the `wgu_view_as` cookie via the UI's "View as" control, typically surfaced in the `UserMenu` component. While active, every server request reads the cookie and `getCurrentUser()` returns the target member's perspective. The real admin identity is never lost — it stays in `impersonator` — so the `ImpersonationBanner` component can display it and admin write mutations can check that the actor is not operating under impersonation before committing changes.

## Supabase server client + cookie-domain safety

<!-- src: wgu-tools/src/lib/supabase-server.ts -->
```ts
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

/**
 * Only apply AUTH_COOKIE_DOMAIN when the request's host actually falls
 * under it. When the app is served from a different host (e.g.
 * wgu-tools.vercel.app while AUTH_COOKIE_DOMAIN=.wgu.tools), setting
 * Domain to a non-matching host would cause browsers to silently drop
 * the cookie. Falling back to undefined makes the cookie scope to the
 * current host, which works in both environments.
 */
function getSafeCookieDomain(host: string | null | undefined): string | undefined {
  const env = process.env.AUTH_COOKIE_DOMAIN
  if (!env || !host) return undefined
  const target = env.replace(/^\./, '').toLowerCase()
  const h = host.toLowerCase()
  return h === target || h.endsWith('.' + target) ? env : undefined
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const h = await headers()
  const cookieDomain = getSafeCookieDomain(h.get('host'))

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, domain: cookieDomain }),
            )
          } catch {
            // setAll called from a Server Component — the proxy refreshes
            // the session cookie on the next request.
          }
        },
      },
    },
  )
}
```

The `getSafeCookieDomain` helper is critical for multi-environment deployments. In production, `AUTH_COOKIE_DOMAIN=.wgu.tools` lets a session cookie set on `wgu.tools` be read by subdomains like `tools.wgu.tools`. Without the safety check, a preview deployment on `wgu-tools.vercel.app` would try to set `Domain=.wgu.tools` — a mismatch that causes browsers to silently drop the cookie entirely, breaking authentication on every Vercel preview URL. By falling back to `undefined`, the cookie scopes to the current host and works in both environments without any code change.

## Supabase browser client

<!-- src: wgu-tools/src/lib/supabase-client.ts -->
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

The browser client is used only on the login page (to initiate the OAuth flow) and in any client component that needs to react to session state. It intentionally only receives the anon key — never the service-role key, which lives exclusively in server-side environment variables.

## Master roster reader

<!-- src: wgu-tools/src/lib/master-roster.ts -->
```ts
import 'server-only'
import { revalidateTag, unstable_cache } from 'next/cache'
import { MEMBER_ROLES, type MemberRole } from './apps'
import {
  APP_ACCESS_SHEET_ID,
  GRANT_COLUMN_IDS,
  MEMBERS_SHEET_ID,
  MEMBER_COLUMN_IDS,
  type AppSlug,
} from './sheets'
import {
  readCell,
  type SheetGetResponse,
  smartsheetFetch,
  type SmartsheetRow,
} from './smartsheet'

const ALLOWED_DOMAIN = '@wgu.edu'
const MEMBERS_TAG = 'wgu-tools-members'
const GRANTS_TAG = 'wgu-tools-grants'

// ===== Types =====

export type Member = {
  rowId: number
  email: string
  displayName: string | null
  addedBy: string | null
  addedAt: string | null
  notes: string | null
  avatarUrl: string | null
  isAdmin: boolean
  role: MemberRole | null
}

export type Grant = {
  rowId: number
  grantId: string                  // "email|app_slug"
  memberEmail: string
  appSlug: AppSlug
  grantedBy: string | null
  grantedAt: string | null
}

// ===== Parsing =====

function parseMember(row: SmartsheetRow): Member {
  // CHECKBOX cells come back as boolean true/false from Smartsheet, but
  // empty cells return null/undefined.
  const adminCell = row.cells.find((c) => c.columnId === MEMBER_COLUMN_IDS.IsAdmin)
  const isAdmin = adminCell?.value === true || adminCell?.value === 'true'
  const roleRaw = readCell(row, MEMBER_COLUMN_IDS.Role)
  const role = roleRaw && (MEMBER_ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as MemberRole)
    : null
  return {
    rowId: row.id,
    email: (readCell(row, MEMBER_COLUMN_IDS.Email) ?? '').toLowerCase(),
    displayName: readCell(row, MEMBER_COLUMN_IDS.DisplayName),
    addedBy: readCell(row, MEMBER_COLUMN_IDS.AddedBy),
    addedAt: readCell(row, MEMBER_COLUMN_IDS.AddedAt),
    notes: readCell(row, MEMBER_COLUMN_IDS.Notes),
    avatarUrl: readCell(row, MEMBER_COLUMN_IDS.AvatarUrl),
    isAdmin,
    role,
  }
}

function parseGrant(row: SmartsheetRow): Grant | null {
  const email = (readCell(row, GRANT_COLUMN_IDS.MemberEmail) ?? '').toLowerCase()
  const slug = readCell(row, GRANT_COLUMN_IDS.AppSlug) as AppSlug | null
  if (!email || !slug) return null
  return {
    rowId: row.id,
    grantId: readCell(row, GRANT_COLUMN_IDS.GrantId) ?? `${email}|${slug}`,
    memberEmail: email,
    appSlug: slug,
    grantedBy: readCell(row, GRANT_COLUMN_IDS.GrantedBy),
    grantedAt: readCell(row, GRANT_COLUMN_IDS.GrantedAt),
  }
}

// ===== Members =====

async function fetchMembersRaw(): Promise<Member[]> {
  const sheet = await smartsheetFetch<SheetGetResponse>(`/sheets/${MEMBERS_SHEET_ID}`)
  return sheet.rows
    .map(parseMember)
    .filter((m) => m.email.length > 0)
}

export const listMembers = unstable_cache(fetchMembersRaw, ['wgu-tools-members'], {
  tags: [MEMBERS_TAG],
  revalidate: 60,
})

export async function getMember(email: string): Promise<Member | null> {
  const lower = email.toLowerCase()
  const all = await listMembers()
  return all.find((m) => m.email === lower) ?? null
}

export async function isMember(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  return (await getMember(email)) !== null
}

export type AddMemberInput = {
  email: string
  displayName: string
  addedBy: string
  notes?: string
}

export async function addMember(input: AddMemberInput): Promise<Member> {
  const email = input.email.trim().toLowerCase()
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    throw new Error(`Only ${ALLOWED_DOMAIN} addresses can be added to the roster.`)
  }
  const existing = await getMember(email)
  if (existing) return existing

  const today = new Date().toISOString().slice(0, 10)
  const cells: Array<{ columnId: number; value: string }> = [
    { columnId: MEMBER_COLUMN_IDS.Email, value: email },
    { columnId: MEMBER_COLUMN_IDS.DisplayName, value: input.displayName.trim() },
    { columnId: MEMBER_COLUMN_IDS.AddedBy, value: input.addedBy },
    { columnId: MEMBER_COLUMN_IDS.AddedAt, value: today },
  ]
  if (input.notes?.trim()) {
    cells.push({ columnId: MEMBER_COLUMN_IDS.Notes, value: input.notes.trim() })
  }

  const body = { toBottom: true, cells }
  const res = await smartsheetFetch<{ result: SmartsheetRow[] }>(
    `/sheets/${MEMBERS_SHEET_ID}/rows`,
    { method: 'POST', body: JSON.stringify([body]) },
  )
  revalidateTag(MEMBERS_TAG, 'default')
  return parseMember(res.result[0])
}

export async function removeMember(email: string): Promise<void> {
  const lower = email.toLowerCase()
  const member = await getMember(lower)
  if (!member) return
  await smartsheetFetch(
    `/sheets/${MEMBERS_SHEET_ID}/rows?ids=${member.rowId}`,
    { method: 'DELETE' },
  )
  // Also remove all grants for this member.
  const grants = await listGrantsForMember(lower)
  if (grants.length) {
    const ids = grants.map((g) => g.rowId).join(',')
    await smartsheetFetch(
      `/sheets/${APP_ACCESS_SHEET_ID}/rows?ids=${ids}`,
      { method: 'DELETE' },
    )
  }
  revalidateTag(MEMBERS_TAG, 'default')
  revalidateTag(GRANTS_TAG, 'default')
}

// ===== Grants =====

async function fetchGrantsRaw(): Promise<Grant[]> {
  const sheet = await smartsheetFetch<SheetGetResponse>(`/sheets/${APP_ACCESS_SHEET_ID}`)
  return sheet.rows
    .map(parseGrant)
    .filter((g): g is Grant => g !== null)
}

export const listGrants = unstable_cache(fetchGrantsRaw, ['wgu-tools-grants'], {
  tags: [GRANTS_TAG],
  revalidate: 60,
})

export async function listGrantsForMember(email: string): Promise<Grant[]> {
  const lower = email.toLowerCase()
  const all = await listGrants()
  return all.filter((g) => g.memberEmail === lower)
}

export async function getAccessibleApps(email: string): Promise<Set<AppSlug>> {
  const grants = await listGrantsForMember(email)
  return new Set(grants.map((g) => g.appSlug))
}

export type GrantInput = {
  email: string
  appSlug: AppSlug
  grantedBy: string
}

export async function addGrant(input: GrantInput): Promise<Grant> {
  const email = input.email.trim().toLowerCase()
  const member = await getMember(email)
  if (!member) {
    throw new Error(`${email} is not a member of WGU.tools yet — add them first.`)
  }
  const existing = (await listGrantsForMember(email)).find((g) => g.appSlug === input.appSlug)
  if (existing) return existing

  const today = new Date().toISOString().slice(0, 10)
  const cells = [
    { columnId: GRANT_COLUMN_IDS.GrantId, value: `${email}|${input.appSlug}` },
    { columnId: GRANT_COLUMN_IDS.MemberEmail, value: email },
    { columnId: GRANT_COLUMN_IDS.AppSlug, value: input.appSlug },
    { columnId: GRANT_COLUMN_IDS.GrantedBy, value: input.grantedBy },
    { columnId: GRANT_COLUMN_IDS.GrantedAt, value: today },
  ]
  const res = await smartsheetFetch<{ result: SmartsheetRow[] }>(
    `/sheets/${APP_ACCESS_SHEET_ID}/rows`,
    { method: 'POST', body: JSON.stringify([{ toBottom: true, cells }]) },
  )
  revalidateTag(GRANTS_TAG, 'default')
  const grant = parseGrant(res.result[0])
  if (!grant) throw new Error('Smartsheet returned an unparseable grant row.')
  return grant
}

export async function removeGrant(email: string, appSlug: AppSlug): Promise<void> {
  const lower = email.toLowerCase()
  const grant = (await listGrantsForMember(lower)).find((g) => g.appSlug === appSlug)
  if (!grant) return
  await smartsheetFetch(
    `/sheets/${APP_ACCESS_SHEET_ID}/rows?ids=${grant.rowId}`,
    { method: 'DELETE' },
  )
  revalidateTag(GRANTS_TAG, 'default')
}

export function revalidateRoster() {
  revalidateTag(MEMBERS_TAG, 'default')
  revalidateTag(GRANTS_TAG, 'default')
}

/**
 * Toggle the Is Admin flag for a member. Admin status grants:
 *   - access to /admin (manage other members + grants)
 *   - implicit access to every app tile regardless of App Access grants
 */
export async function setMemberAdminFlag(email: string, isAdmin: boolean): Promise<void> {
  const member = await getMember(email)
  if (!member) throw new Error(`${email} is not a member — add them first.`)
  await smartsheetFetch(`/sheets/${MEMBERS_SHEET_ID}/rows`, {
    method: 'PUT',
    body: JSON.stringify([
      {
        id: member.rowId,
        cells: [{ columnId: MEMBER_COLUMN_IDS.IsAdmin, value: isAdmin }],
      },
    ]),
  })
  revalidateTag(MEMBERS_TAG, 'default')
}

/**
 * Set a member's Role (Admin/Director/Manager/Ops Team/SPM) or clear
 * it. Persists the value on the Members sheet — does NOT touch the
 * App Access sheet on its own. Callers (e.g. adminSetRole) reconcile
 * grants separately so the side effect is explicit.
 */
export async function setMemberRole(email: string, role: MemberRole | null): Promise<void> {
  const member = await getMember(email)
  if (!member) throw new Error(`${email} is not a member — add them first.`)
  await smartsheetFetch(`/sheets/${MEMBERS_SHEET_ID}/rows`, {
    method: 'PUT',
    body: JSON.stringify([
      {
        id: member.rowId,
        cells: [{ columnId: MEMBER_COLUMN_IDS.Role, value: role ?? '' }],
      },
    ]),
  })
  revalidateTag(MEMBERS_TAG, 'default')
}

/**
 * Update a member's avatar URL. Used after a profile photo upload finishes.
 * Auto-creates the member row if they aren't on the roster yet (which can
 * happen for hard-coded admins who haven't been added explicitly).
 */
export async function setMemberAvatar(email: string, avatarUrl: string): Promise<void> {
  const lower = email.toLowerCase()
  let member = await getMember(lower)
  if (!member) {
    member = await addMember({
      email: lower,
      displayName: lower.split('@')[0],
      addedBy: lower,
      notes: 'Auto-added on avatar upload',
    })
  }
  await smartsheetFetch(`/sheets/${MEMBERS_SHEET_ID}/rows`, {
    method: 'PUT',
    body: JSON.stringify([
      {
        id: member.rowId,
        cells: [{ columnId: MEMBER_COLUMN_IDS.AvatarUrl, value: avatarUrl }],
      },
    ]),
  })
  revalidateTag(MEMBERS_TAG, 'default')
}
```

`master-roster.ts` is what feeds `getCurrentUser()` with member data. The sheet is fetched via `smartsheetFetch` (the actual Smartsheet API call lives in `lib/smartsheet.ts`, documented in `data-layer.md`), then cached with Next.js `unstable_cache` using a 60-second TTL and explicit `revalidateTag` calls after any mutation. The two sheets involved are the Members sheet (one row per user, has role and avatar) and the App Access sheet (one row per grant, links member email to an `AppSlug`).

## Login page anatomy

<!-- src: wgu-tools/src/app/login/page.tsx -->
```tsx
'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

const ERROR_MESSAGES: Record<string, string> = {
  domain:
    "That account isn't in the @wgu.edu domain. Use your university Google account to continue.",
  oauth: 'Sign-in failed. Please try again.',
  exchange: "Couldn't complete sign-in. Please try again.",
}

export default function LoginPage() {
  return (
    <div className="auth-bg">
      <div className="card card-padded-lg" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Image
            src="/wgu-logo.png"
            alt="WGU"
            width={120}
            height={55}
            priority
            style={{ height: 44, width: 'auto', display: 'block' }}
          />
        </div>
        <p className="page-eyebrow">WGU Strategic Partnerships</p>
        <h1 className="page-title" style={{ fontSize: 28 }}>
          WGU.tools
        </h1>
        <p className="page-sub">
          Sign in with your WGU Google account to open the toolset.
        </p>

        <Suspense fallback={<DisabledGoogleButton />}>
          <SignInButton />
        </Suspense>

        <p className="help-text" style={{ marginTop: 18 }}>
          Use your <strong style={{ color: 'var(--fg-1)' }}>@wgu.edu</strong> account.
        </p>
      </div>
    </div>
  )
}

function DisabledGoogleButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="btn btn-secondary btn-lg"
      style={{ width: '100%' }}
    >
      <GoogleIcon />
      <span>Sign in with Google</span>
    </button>
  )
}

function SignInButton() {
  const params = useSearchParams()
  const errorKey = params.get('error')
  const errorDetail = params.get('detail')
  const [loading, setLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  const onSignIn = async () => {
    setLoading(true)
    setSignInError(null)
    const supabase = createSupabaseBrowserClient()
    // Stash `next` in a short-lived cookie so the OAuth callback can pick
    // it up after the round-trip. Avoids putting a variable URL in the
    // Supabase allowlist. Domain `.wgu.tools` in prod lets the callback
    // (on wgu.tools) read a cookie set by any subdomain that redirected
    // here. SameSite=Lax keeps it valid through the OAuth redirect chain.
    const nextParam = params.get('next')
    if (nextParam && nextParam !== '/') {
      const isProd = window.location.hostname.endsWith('wgu.tools')
      const domain = isProd ? '; Domain=.wgu.tools; Secure' : ''
      document.cookie = `auth_next=${encodeURIComponent(nextParam)}; Path=/; Max-Age=600; SameSite=Lax${domain}`
    }
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { hd: 'wgu.edu' },
      },
    })
    if (error) {
      setSignInError(error.message)
      setLoading(false)
    }
  }

  const message = signInError ?? (errorKey ? ERROR_MESSAGES[errorKey] ?? 'Sign-in failed.' : null)

  return (
    <>
      <button
        type="button"
        onClick={onSignIn}
        disabled={loading}
        className="btn btn-secondary btn-lg"
        style={{ width: '100%' }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spin" />
            <span>Signing you in…</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>Sign in with Google</span>
          </>
        )}
      </button>

      {message && (
        <div className="error-text" role="alert">
          <AlertCircle size={16} />
          <div style={{ flex: 1 }}>
            <div>{message}</div>
            {errorDetail && (
              <div
                style={{
                  marginTop: 4,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  opacity: 0.8,
                  wordBreak: 'break-word',
                }}
              >
                {errorDetail}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
```

## No-access page anatomy

<!-- src: wgu-tools/src/app/no-access/page.tsx -->
```tsx
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAllowedEmail, isAdminEmail } from '@/lib/auth'
import { isMember } from '@/lib/master-roster'

/**
 * Shown to signed-in @wgu.edu users who aren't on the master roster yet.
 * If the user IS on the roster (or is the hard-coded admin), bounce them
 * back to the home page so they don't get stuck here.
 */
export default async function NoAccessPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAllowedEmail(user.email)) redirect('/login')
  if (isAdminEmail(user.email) || (await isMember(user.email!))) redirect('/')

  return (
    <div className="auth-bg">
      <div className="card card-padded-lg" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Image
            src="/wgu-logo.png"
            alt="WGU"
            width={120}
            height={55}
            priority
            style={{ height: 44, width: 'auto', display: 'block' }}
          />
        </div>
        <p className="page-eyebrow">WGU Strategic Partnerships</p>
        <h1 className="page-title" style={{ fontSize: 28 }}>
          Access pending
        </h1>
        <p className="page-sub">
          You&rsquo;re signed in as <strong style={{ color: 'var(--fg-1)' }}>{user.email}</strong>,
          but you haven&rsquo;t been added to WGU.tools yet. Reach out to Bentley
          to request access and you&rsquo;ll see the toolset on your next sign-in.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Switch account
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

## Auth callback route

<!-- src: wgu-tools/src/app/auth/callback/route.ts -->
```ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAllowedEmail } from '@/lib/auth'

/**
 * OAuth callback. Supabase redirects here after Google completes the OAuth
 * flow. We exchange the `code` for a session, verify the email is on an
 * @wgu.edu account, then redirect to the originating page (which may live
 * on a different wgu.tools subdomain — see the `auth_next` cookie set by
 * /login).
 *
 * Provider errors come back as ?error=...&error_description=... instead of
 * a code; we log the description and surface it on /login.
 */

function getSafeCookieDomain(host: string | null | undefined): string | undefined {
  const env = process.env.AUTH_COOKIE_DOMAIN
  if (!env || !host) return undefined
  const target = env.replace(/^\./, '').toLowerCase()
  const h = host.toLowerCase()
  return h === target || h.endsWith('.' + target) ? env : undefined
}

/**
 * Resolve the next destination into a safe absolute URL. Allows the
 * wgu.tools apex, any of its subdomains, the request's own origin, and
 * any *.vercel.app for preview deployments. Anything else falls back
 * to "/" so a tampered cookie can't be used as an open redirect.
 */
function resolveSafeNext(nextRaw: string | null, origin: string): URL {
  const fallback = new URL('/', origin)
  if (!nextRaw) return fallback
  let candidate: URL
  try {
    candidate = new URL(nextRaw, origin)
  } catch {
    return fallback
  }
  const host = candidate.host.toLowerCase()
  const ok =
    host === new URL(origin).host ||
    host === 'wgu.tools' ||
    host.endsWith('.wgu.tools') ||
    host.endsWith('.vercel.app')
  return ok ? candidate : fallback
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const providerError = url.searchParams.get('error')
  const providerErrorDescription = url.searchParams.get('error_description')

  if (providerError) {
    console.error('[oauth callback] provider error:', providerError, providerErrorDescription)
    const loginUrl = new URL('/login', url.origin)
    loginUrl.searchParams.set('error', 'oauth')
    if (providerErrorDescription) loginUrl.searchParams.set('detail', providerErrorDescription)
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth', url.origin))
  }

  const supabase = await createSupabaseServerClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error('[oauth callback] exchange error:', exchangeError.message)
    const loginUrl = new URL('/login', url.origin)
    loginUrl.searchParams.set('error', 'exchange')
    loginUrl.searchParams.set('detail', exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!isAllowedEmail(user?.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=domain', url.origin))
  }

  // Read the originating URL from the auth_next cookie that /login set
  // before the OAuth round-trip; fall back to query param, then to "/".
  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('auth_next')?.value
  const queryNext = url.searchParams.get('next')
  const nextRaw = cookieNext ? decodeURIComponent(cookieNext) : queryNext

  const target = resolveSafeNext(nextRaw, url.origin)
  const response = NextResponse.redirect(target)
  // Clear the auth_next cookie now that we've used it.
  response.cookies.set('auth_next', '', {
    maxAge: 0,
    path: '/',
    domain: getSafeCookieDomain(url.host),
  })
  return response
}
```

## `server-only` discipline

Every `lib/` file that talks to Supabase, Smartsheet, or Salesforce begins with `import 'server-only'`. This is a build-time guardrail enforced by Next.js: if any of these modules ever gets imported into a Client Component (or any other browser bundle), the build will fail with a hard error rather than silently shipping a service-role key, a Smartsheet token, or any other secret to the browser. The discipline applies to `auth.ts`, `supabase-server.ts`, `master-roster.ts`, `smartsheet.ts`, and any future data-access module — essentially anything that holds or uses a secret env var.

---

See also: [data-layer.md](./data-layer.md) for the Smartsheet master roster's read pattern, [app-shell.md](./app-shell.md) for how `getCurrentUser()` is consumed by `HeaderNav` / `UserMenu` / `ImpersonationBanner`, [deploy.md](./deploy.md) for `AUTH_COOKIE_DOMAIN` env var setup.
