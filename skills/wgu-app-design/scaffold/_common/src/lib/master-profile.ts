/**
 * Master profile — canonical user profile data shared across every
 * WGU.tools app. Stored on the wgu.tools "Members" Smartsheet so
 * that updating your name/avatar in any app propagates to all the
 * others on the next read.
 *
 * THIS FILE IS PORTABLE. Other apps in the suite get a copy of this
 * file (typically at `src/lib/master-profile.ts` or equivalent). Only
 * dependency: a Smartsheet API token in env as SMARTSHEET_API_TOKEN.
 *
 * Reads + writes hit the same well-known sheet (id below). Each app
 * uses its own Supabase Storage for avatar uploads — the public URL is
 * what ends up on the Members row, so any app can read any other app's
 * uploaded photo (storage buckets are public).
 *
 * Types, constants, and the pure `initialsFrom` helper live in
 * `./master-profile-shared.ts` and are re-exported here. Client
 * components must import them from the shared file directly — pulling
 * from this file would drag the `server-only` marker into the client
 * bundle and break the build.
 */

import 'server-only'

export {
  type AvatarKind,
  type MasterProfile,
  AVATAR_COLOR_PALETTE,
  AVATAR_EMOJI_SUGGESTIONS,
  initialsFrom,
} from './master-profile-shared'

import { type AvatarKind, type MasterProfile } from './master-profile-shared'

// ============================================================================
// Sheet + column IDs — shared constants. Do not change without updating
// every app that has a copy of this file.
// ============================================================================

const MEMBERS_SHEET_ID = '6810725736468356'
const COLUMN_IDS = {
  Email: 2549596248379268,
  DisplayName: 7053195875749764,
  AvatarUrl: 5886794158870404,
  AvatarKind: 2801399208644484,
  AvatarEmoji: 6057927164333956,
  AvatarColor: 6741550666387332,
} as const

// ============================================================================
// Smartsheet helpers
// ============================================================================

const SMARTSHEET_BASE = 'https://api.smartsheet.com/2.0'

function token(): string {
  const t = process.env.SMARTSHEET_API_TOKEN
  if (!t) throw new Error('SMARTSHEET_API_TOKEN is not configured')
  return t
}

type SmartsheetCell = {
  columnId: number
  value?: unknown
  displayValue?: string
}
type SmartsheetRow = {
  id: number
  cells: SmartsheetCell[]
}
type SheetResponse = {
  rows: SmartsheetRow[]
}

function readCell(row: SmartsheetRow, columnId: number): string | null {
  const cell = row.cells.find((c) => c.columnId === columnId)
  if (!cell) return null
  const v = cell.value ?? cell.displayValue
  if (v === null || v === undefined || v === '') return null
  return typeof v === 'string' ? v : String(v)
}

function isAvatarKind(value: string | null): value is AvatarKind {
  return value === 'initials' || value === 'emoji' || value === 'photo'
}

function rowToProfile(row: SmartsheetRow): MasterProfile {
  const email = (readCell(row, COLUMN_IDS.Email) ?? '').toLowerCase()
  const kindRaw = readCell(row, COLUMN_IDS.AvatarKind)
  return {
    email,
    displayName: readCell(row, COLUMN_IDS.DisplayName),
    avatarKind: isAvatarKind(kindRaw) ? kindRaw : 'initials',
    avatarEmoji: readCell(row, COLUMN_IDS.AvatarEmoji),
    avatarColor: readCell(row, COLUMN_IDS.AvatarColor),
    avatarUrl: readCell(row, COLUMN_IDS.AvatarUrl),
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch a member's profile from the master Members sheet. Returns null
 * when no row exists yet (caller should fall back to an empty/default
 * profile or auto-create the row on first save).
 */
export async function getMasterProfile(email: string): Promise<MasterProfile | null> {
  const res = await fetch(`${SMARTSHEET_BASE}/sheets/${MEMBERS_SHEET_ID}`, {
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Smartsheet GET sheet failed: ${res.status}`)
  const data = (await res.json()) as SheetResponse
  const lower = email.toLowerCase()
  const row = data.rows.find(
    (r) => (readCell(r, COLUMN_IDS.Email) ?? '').toLowerCase() === lower,
  )
  return row ? rowToProfile(row) : null
}

/**
 * Update a member's profile fields. Partial — any field omitted is left
 * untouched. Auto-creates the row if the member doesn't exist yet.
 *
 * Returns the resulting full profile after the update.
 */
export async function updateMasterProfile(
  email: string,
  updates: Partial<Omit<MasterProfile, 'email'>>,
): Promise<MasterProfile> {
  const lower = email.toLowerCase()
  const res = await fetch(`${SMARTSHEET_BASE}/sheets/${MEMBERS_SHEET_ID}`, {
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Smartsheet GET sheet failed: ${res.status}`)
  const data = (await res.json()) as SheetResponse

  const existing = data.rows.find(
    (r) => (readCell(r, COLUMN_IDS.Email) ?? '').toLowerCase() === lower,
  )

  const cells: Array<{ columnId: number; value: unknown }> = []
  if (updates.displayName !== undefined) {
    cells.push({ columnId: COLUMN_IDS.DisplayName, value: updates.displayName ?? '' })
  }
  if (updates.avatarKind !== undefined) {
    cells.push({ columnId: COLUMN_IDS.AvatarKind, value: updates.avatarKind })
  }
  if (updates.avatarEmoji !== undefined) {
    cells.push({ columnId: COLUMN_IDS.AvatarEmoji, value: updates.avatarEmoji ?? '' })
  }
  if (updates.avatarColor !== undefined) {
    cells.push({ columnId: COLUMN_IDS.AvatarColor, value: updates.avatarColor ?? '' })
  }
  if (updates.avatarUrl !== undefined) {
    cells.push({ columnId: COLUMN_IDS.AvatarUrl, value: updates.avatarUrl ?? '' })
  }

  if (existing) {
    if (cells.length > 0) {
      const putRes = await fetch(`${SMARTSHEET_BASE}/sheets/${MEMBERS_SHEET_ID}/rows`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ id: existing.id, cells }]),
      })
      if (!putRes.ok) {
        const t = await putRes.text()
        throw new Error(`Smartsheet PUT row failed: ${putRes.status} ${t}`)
      }
    }
    return {
      ...rowToProfile(existing),
      ...updates,
      email: lower,
      avatarKind: updates.avatarKind ?? rowToProfile(existing).avatarKind,
    }
  }

  cells.unshift({ columnId: COLUMN_IDS.Email, value: lower })
  const postRes = await fetch(`${SMARTSHEET_BASE}/sheets/${MEMBERS_SHEET_ID}/rows`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ toBottom: true, cells }]),
  })
  if (!postRes.ok) {
    const t = await postRes.text()
    throw new Error(`Smartsheet POST row failed: ${postRes.status} ${t}`)
  }

  return {
    email: lower,
    displayName: updates.displayName ?? null,
    avatarKind: updates.avatarKind ?? 'initials',
    avatarEmoji: updates.avatarEmoji ?? null,
    avatarColor: updates.avatarColor ?? null,
    avatarUrl: updates.avatarUrl ?? null,
  }
}
