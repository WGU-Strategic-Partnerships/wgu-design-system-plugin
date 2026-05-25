/**
 * Smartsheet sheet & column IDs for the app roster.
 *
 * Replace the placeholder values below with your own Smartsheet sheet
 * and column IDs. See the wgu-app-design docs for how to provision
 * these sheets.
 *
 * Durable field IDs can be mirrored in each column's `description`
 * property in Smartsheet (format `field_id:<name>`), so if columns
 * are ever reordered the IDs in code stay valid.
 */

export const MEMBERS_SHEET_ID = 0 as number   // replace with your Members sheet ID
export const APP_ACCESS_SHEET_ID = 0 as number // replace with your App Access sheet ID

export const MEMBER_COLUMN_IDS = {
  Email: 0,
  DisplayName: 0,
  AddedBy: 0,
  AddedAt: 0,
  Notes: 0,
  AvatarUrl: 0,
  AvatarKind: 0,
  AvatarEmoji: 0,
  AvatarColor: 0,
  IsAdmin: 0,
  Role: 0,
  Created: 0,
  Modified: 0,
} as const satisfies Record<string, number>

export const GRANT_COLUMN_IDS = {
  GrantId: 0,
  MemberEmail: 0,
  AppSlug: 0,
  GrantedBy: 0,
  GrantedAt: 0,
  Created: 0,
  Modified: 0,
} as const satisfies Record<string, number>

/**
 * App slugs accepted by the App Access sheet's PICKLIST column. Must
 * match the `id` values in src/lib/apps.ts and the PICKLIST options on
 * the Smartsheet column.
 *
 * Replace these with your real app slugs.
 */
export const APP_SLUGS = [
  'example-tool',
  'another-tool',
  'field-tool',
  // Add your real slugs here.
] as const
export type AppSlug = (typeof APP_SLUGS)[number]
