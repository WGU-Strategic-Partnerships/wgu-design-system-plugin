'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminEmail } from '@/lib/auth'
import {
  addGrant,
  addMember,
  listGrants,
  listMembers,
  removeGrant,
  removeMember,
  setMemberAdminFlag,
  setMemberAvatar,
  setMemberRole,
} from '@/lib/master-roster'
import { getDefaultAccessForRole, type MemberRole } from '@/lib/apps'
import { deleteAvatarFromUrl, uploadAvatar } from '@/lib/avatars-server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  getMasterProfile,
  updateMasterProfile,
  type AvatarKind,
  type MasterProfile,
} from '@/lib/master-profile'
import type { AppSlug } from '@/lib/sheets'
import { APP_SLUGS } from '@/lib/sheets'

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  if (!user.isAdmin) throw new Error('Forbidden — admin only')
  // Admin actions are blocked while impersonating someone else, so a
  // mid-impersonation click can't accidentally change settings under
  // another user's identity.
  if (user.impersonator) {
    throw new Error('Stop impersonating before changing admin settings.')
  }
  return user
}

// =============================================================================
// Impersonation — "View as". Sets a cookie that getCurrentUser() reads
// to swap the visible identity for the named member. Only real admins
// can set/clear the cookie.
// =============================================================================

const VIEW_AS_COOKIE = 'wgu_view_as'

export async function adminStartViewAs(email: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const realIsAdmin = user.impersonator ? true : user.isAdmin
  if (!realIsAdmin) throw new Error('Forbidden — admin only')

  const target = email.toLowerCase().trim()
  if (!target.includes('@')) throw new Error('Invalid email')

  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.set(VIEW_AS_COOKIE, target, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60, // 1 hour — short by design
  })
  revalidatePath('/', 'layout')
}

export async function adminStopViewAs() {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  store.set(VIEW_AS_COOKIE, '', { path: '/', maxAge: 0 })
  revalidatePath('/', 'layout')
}

// =============================================================================
// Admin actions — every entry point re-checks isAdmin server-side.
// =============================================================================

export async function adminAddMember(formData: FormData) {
  const admin = await requireAdmin()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const displayName = String(formData.get('displayName') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!email || !displayName) throw new Error('Email and name are required')

  await addMember({
    email,
    displayName,
    addedBy: admin.email,
    notes: notes || undefined,
  })
}

export async function adminRemoveMember(email: string) {
  await requireAdmin()
  await removeMember(email)
}

export async function adminSetGrant(email: string, appSlug: AppSlug, granted: boolean) {
  const admin = await requireAdmin()
  if (granted) {
    await addGrant({ email, appSlug, grantedBy: admin.email })
  } else {
    await removeGrant(email, appSlug)
  }
}

/**
 * Set a member's Role and reconcile their App Access grants to the
 * role's defaults: add any missing grants, remove any extras.
 */
export async function adminSetRole(email: string, role: MemberRole | null) {
  const admin = await requireAdmin()
  await setMemberRole(email, role)

  if (role === null) {
    return
  }

  const desired = getDefaultAccessForRole(role)
  const existing = (await listGrants()).filter((g) => g.memberEmail === email.toLowerCase())
  const existingSlugs = new Set(existing.map((g) => g.appSlug))

  for (const slug of desired) {
    if (!existingSlugs.has(slug as AppSlug)) {
      if ((APP_SLUGS as readonly string[]).includes(slug)) {
        await addGrant({ email, appSlug: slug as AppSlug, grantedBy: admin.email })
      }
    }
  }

  for (const grant of existing) {
    if (desired.has(grant.appSlug)) continue
    const { APPS } = await import('@/lib/apps')
    const app = APPS.find((a) => a.id === grant.appSlug)
    if (app?.hidden) continue
    await removeGrant(email, grant.appSlug)
  }
}

export async function adminSetIsAdmin(email: string, isAdmin: boolean) {
  const admin = await requireAdmin()
  if (
    email.toLowerCase() === admin.email &&
    !isAdmin &&
    !isAdminEmail(admin.email)
  ) {
    throw new Error("You can't revoke your own admin status (you'd lose access).")
  }
  await setMemberAdminFlag(email, isAdmin)
}

// =============================================================================
// Admin: import avatars from existing app rosters
// =============================================================================

const AVATAR_SOURCES: Array<{
  app: string
  sheetId: number
  emailCol: number
  avatarCol: number
}> = [
  // Replace with real sheet/column IDs from your source apps.
  // { app: 'my-app', sheetId: 0, emailCol: 0, avatarCol: 0 },
]

export type ImportAvatarsResult = {
  ok: true
  imported: number
  skipped: number
  errors: string[]
}

export async function adminImportAvatars(): Promise<ImportAvatarsResult> {
  await requireAdmin()
  const members = await listMembers()
  const byEmail = new Map(members.map((m) => [m.email, m]))

  let imported = 0
  let skipped = 0
  const errors: string[] = []
  const token = process.env.SMARTSHEET_API_TOKEN
  if (!token) {
    return { ok: true, imported: 0, skipped: members.length, errors: ['SMARTSHEET_API_TOKEN missing'] }
  }

  for (const source of AVATAR_SOURCES) {
    try {
      const res = await fetch(
        `https://api.smartsheet.com/2.0/sheets/${source.sheetId}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
      )
      if (!res.ok) { errors.push(`${source.app}: HTTP ${res.status}`); continue }
      const sheet = await res.json() as {
        rows: Array<{ cells: Array<{ columnId: number; value?: unknown; displayValue?: string }> }>
      }
      for (const row of sheet.rows) {
        const emailCell = row.cells.find((c) => c.columnId === source.emailCol)
        const avatarCell = row.cells.find((c) => c.columnId === source.avatarCol)
        const email = String(emailCell?.value ?? emailCell?.displayValue ?? '').toLowerCase()
        const avatarUrl = String(avatarCell?.value ?? avatarCell?.displayValue ?? '')
        if (!email || !avatarUrl) continue
        const member = byEmail.get(email)
        if (!member) { skipped++; continue }
        if (member.avatarUrl) { skipped++; continue }

        await setMemberAvatar(email, avatarUrl)
        member.avatarUrl = avatarUrl
        imported++
      }
    } catch (err) {
      errors.push(`${source.app}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  revalidatePath('/', 'layout')
  return { ok: true, imported, skipped, errors }
}

// =============================================================================
// Unified profile editor
// =============================================================================

export type ProfileSaveResult =
  | { ok: true; profile: MasterProfile }
  | { ok: false; error: string }

export async function loadCurrentProfile(): Promise<MasterProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return await getMasterProfile(user.email)
}

export async function saveProfile(updates: {
  displayName?: string | null
  avatarKind?: AvatarKind
  avatarEmoji?: string | null
  avatarColor?: string | null
}): Promise<ProfileSaveResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: 'Not signed in.' }
    if (user.impersonator) {
      return { ok: false, error: 'Stop impersonating before editing this profile.' }
    }
    const next = await updateMasterProfile(user.email, updates)
    revalidatePath('/', 'layout')
    return { ok: true, profile: next }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[saveProfile] failed:', err)
    return { ok: false, error: msg }
  }
}

export async function uploadProfilePhotoAndSave(
  formData: globalThis.FormData,
): Promise<ProfileSaveResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: 'Not signed in.' }
    if (user.impersonator) {
      return { ok: false, error: 'Stop impersonating before editing this profile.' }
    }
    const file = formData.get('photo')
    if (!(file instanceof File)) return { ok: false, error: 'No file uploaded.' }

    const existing = await getMasterProfile(user.email)
    const previousUrl = existing?.avatarUrl ?? null
    const { url } = await uploadAvatar({ email: user.email, file })
    const next = await updateMasterProfile(user.email, {
      avatarKind: 'photo',
      avatarUrl: url,
    })
    if (previousUrl && previousUrl !== url) {
      await deleteAvatarFromUrl(previousUrl)
    }
    revalidatePath('/', 'layout')
    return { ok: true, profile: next }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[uploadProfilePhotoAndSave] failed:', err)
    return { ok: false, error: msg }
  }
}

export async function clearProfilePhoto(): Promise<ProfileSaveResult> {
  try {
    const user = await getCurrentUser()
    if (!user) return { ok: false, error: 'Not signed in.' }
    if (user.impersonator) {
      return { ok: false, error: 'Stop impersonating before editing this profile.' }
    }
    const existing = await getMasterProfile(user.email)
    if (existing?.avatarUrl) {
      await deleteAvatarFromUrl(existing.avatarUrl)
    }
    const next = await updateMasterProfile(user.email, {
      avatarKind: 'initials',
      avatarUrl: null,
    })
    revalidatePath('/', 'layout')
    return { ok: true, profile: next }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[clearProfilePhoto] failed:', err)
    return { ok: false, error: msg }
  }
}
