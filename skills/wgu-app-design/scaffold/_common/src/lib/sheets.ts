/**
 * Smartsheet sheet & column IDs for your master roster.
 *
 * The IDs below are placeholders (0). After scaffolding, run the
 * Smartsheet MCP (or by hand) to create your Members + App Access
 * sheets and replace each 0 with the real numeric ID.
 *
 * Archetypes (launcher/deep_app) may ship their own sheets.ts that
 * overlays this — see scaffold/launcher/src/lib/sheets.ts for the
 * launcher's variant.
 */

export const MEMBERS_SHEET_ID = 0 as const
export const APP_ACCESS_SHEET_ID = 0 as const

export const MEMBER_COLUMN_IDS = {
  Email: 0 as const,        // primary, lowercased on write
  DisplayName: 0 as const,
  AddedBy: 0 as const,
  AddedAt: 0 as const,
  Notes: 0 as const,
  AvatarUrl: 0 as const,    // public Supabase Storage URL of the user's photo
  AvatarKind: 0 as const,   // PICKLIST: initials|emoji|photo
  AvatarEmoji: 0 as const,  // single emoji char when avatarKind=emoji
  AvatarColor: 0 as const,  // hex color for the initials/emoji backdrop
  IsAdmin: 0 as const,      // CHECKBOX — admin flag (legacy, use Role)
  Role: 0 as const,         // PICKLIST: Admin|Director|Manager|Ops Team|SPM
  Created: 0 as const,      // CREATED_DATE system column
  Modified: 0 as const,     // MODIFIED_DATE system column
} as const

export const GRANT_COLUMN_IDS = {
  GrantId: 0 as const,       // primary, "email|app_slug" composite
  MemberEmail: 0 as const,
  AppSlug: 0 as const,
  GrantedBy: 0 as const,
  GrantedAt: 0 as const,
  Created: 0 as const,
  Modified: 0 as const,
} as const

/**
 * App slugs accepted by the App Access sheet's PICKLIST column. Must
 * match the values in src/lib/apps.ts and the PICKLIST options on the
 * Smartsheet column.
 */
export const APP_SLUGS = [
  'hiring',
  'ai-strategy',
  'weekly',
  'mbr',
  'portfolio',
  'tickets',
  'sop',
  'field-training',
  'templates',
  'rewired',
  'portfolio-docs',
  'sp-claude-training',
] as const
export type AppSlug = (typeof APP_SLUGS)[number]
