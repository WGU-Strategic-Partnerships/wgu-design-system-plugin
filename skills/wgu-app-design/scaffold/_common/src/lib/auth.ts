import 'server-only'
import { createSupabaseServerClient } from './supabase-server'
import { getAccessibleApps, getMember } from './master-roster'
import type { AppSlug } from './sheets'
import type { MasterProfile } from './master-profile-shared'

const ALLOWED_DOMAIN = '@wgu.edu'

/**
 * Hard-coded super-admins — break-glass list so the founder can't lock
 * themselves out by flipping their own admin flag off. Everyone else
 * gains admin via the Role field on the Members sheet (Role === 'Admin').
 */
const ADMIN_EMAILS = new Set<string>(['bentley.folkman@wgu.edu'])

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  /** True when the user is on the master roster OR is a hard-coded admin. */
  isMember: boolean
  /** True when the user can reach /admin. */
  isAdmin: boolean
  /**
   * True when the user has been assigned a director-level role that scopes
   * them to a single vertical. Deep-app pages use this to decide whether to
   * show all-vertical admin controls or a narrowed single-vertical view.
   *
   * __APP_NAME__: set this from your own role/permissions logic, or leave
   * false if your app has no vertical-director concept.
   */
  isVerticalDirector: boolean
  /**
   * The vertical this user is scoped to when isVerticalDirector is true.
   * Null for admins and non-director members.
   *
   * __APP_NAME__: populate from your own role mapping, or leave null.
   */
  vertical: string | null
  /**
   * The primary role(s) this user carries, used by deep-app pages to
   * pre-select the relevant role tab or filter.
   *
   * __APP_NAME__: populate from your own role/data layer or leave empty.
   */
  primaryRoles: string[]
  /**
   * The user's master profile (display name, avatar kind/url/emoji/color).
   * Null when no profile row exists yet — the profile editor will create it
   * on first save.
   */
  masterProfile: MasterProfile | null
  /** App slugs the user has been granted access to. Empty set unless granted. */
  accessibleApps: Set<AppSlug>
  /** When the real session is an admin and "View as" is active, this
   *  carries the real admin's identity so the UI can show a banner and
   *  block admin write actions. Null in normal sessions. */
  impersonator: { email: string; name: string | null } | null
}

// ---------------------------------------------------------------------------
// getAuthState — typed discriminated union used by deep-app pages.
// ---------------------------------------------------------------------------

/**
 * Typed result for pages that need to distinguish between guest,
 * member-not-on-roster, and active-member states without multiple
 * redirect() call-sites.
 *
 * Usage:
 *   const state = await getAuthState()
 *   if (state.kind === 'guest')      redirect('/login')
 *   if (state.kind === 'no-profile') redirect('/no-access')
 *   const { user } = state
 */
export type AuthState =
  | { kind: 'guest' }
  | { kind: 'no-profile' }
  | { kind: 'active'; user: CurrentUser }

export async function getAuthState(): Promise<AuthState> {
  const user = await getCurrentUser()
  if (!user) return { kind: 'guest' }
  if (!user.isMember) return { kind: 'no-profile' }
  return { kind: 'active', user }
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.has(email.toLowerCase())
}

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
  // (Role === 'Admin') plus the hard-coded ADMIN_EMAILS list.
  const realIsAdmin = hardCodedAdmin || member?.role === 'Admin'
  const onRoster = hardCodedAdmin || member !== null
  const realGrants = realIsAdmin || onRoster ? await getAccessibleApps(email) : new Set<AppSlug>()

  const realName = member?.displayName ?? meta?.full_name ?? meta?.name ?? null
  const realAvatar = member?.avatarUrl ?? meta?.avatar_url ?? null

  // If the real session is an admin and they've toggled "View as" on
  // someone, swap the visible identity for that member.
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
          // __APP_NAME__: populate isVerticalDirector / vertical / primaryRoles
          // from your own role logic when impersonating.
          isVerticalDirector: false,
          vertical: null,
          primaryRoles: [],
          masterProfile: null,
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
    // __APP_NAME__: populate isVerticalDirector / vertical / primaryRoles
    // from your own role / Smartsheet data layer here.
    isVerticalDirector: false,
    vertical: null,
    primaryRoles: [],
    masterProfile: null,
    accessibleApps: realGrants,
    impersonator: null,
  }
}

async function readImpersonateCookie(): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const raw = store.get('wgu_view_as')?.value
  if (!raw) return null
  const email = raw.toLowerCase().trim()
  return email.includes('@') ? email : null
}
