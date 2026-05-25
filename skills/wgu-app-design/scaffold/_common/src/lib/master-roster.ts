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
    throw new Error(`${email} is not a member yet — add them first.`)
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
 * Set a member's Role or clear it.
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
 * Update a member's avatar URL. Auto-creates the member row if they
 * aren't on the roster yet.
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
