import 'server-only'
import { createSupabaseServerClient } from './supabase-server'
import { getAccessibleApps, getMember } from './master-roster'
import type { AppSlug } from './sheets'

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
  /** App slugs the user has been granted access to. Empty set unless granted. */
  accessibleApps: Set<AppSlug>
  /** When the real session is an admin and "View as" is active, this
   *  carries the real admin's identity so the UI can show a banner and
   *  block admin write actions. Null in normal sessions. */
  impersonator: { email: string; name: string | null } | null
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

async function readImpersonateCookie(): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  const raw = store.get('wgu_view_as')?.value
  if (!raw) return null
  const email = raw.toLowerCase().trim()
  return email.includes('@') ? email : null
}
