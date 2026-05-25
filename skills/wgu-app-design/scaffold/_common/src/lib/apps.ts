/**
 * Minimal apps registry stub for _common/.
 *
 * The launcher archetype OVERRIDES this file with a full implementation
 * (scaffold/launcher/src/lib/apps.ts) that defines the real APPS array,
 * CATEGORY_ORDER, role defaults, etc.
 *
 * This stub exists so _common/ files that import from '@/lib/apps'
 * (AppShell, HeaderNav, master-roster, actions, health-check) typecheck
 * in both archetypes without modification.
 *
 * __APP_NAME__: if you are building a DEEP-APP (not a launcher), you can
 * safely delete this file and remove the @/lib/apps imports from any
 * _common files you don't use. If you are building a LAUNCHER, replace
 * this file with the contents of scaffold/launcher/src/lib/apps.ts.
 */

export type AppStatus = 'live' | 'local' | 'beta'
export type AppCategory = 'Executive' | 'Leadership' | 'Ops Team' | 'Field Team'

export type AppTile = {
  id: string
  name: string
  url: string
  description: string
  category: AppCategory
  icon: string
  status: AppStatus
  hidden?: boolean
}

export const CATEGORY_ORDER: readonly AppCategory[] = [
  'Executive',
  'Leadership',
  'Ops Team',
  'Field Team',
]

/** Empty by default — replaced by launcher/src/lib/apps.ts in the launcher archetype. */
export const APPS: readonly AppTile[] = []

/** Category accent colours for nav dropdowns. */
export const CATEGORY_ACCENT: Record<AppCategory, string> = {
  Executive:    'var(--wgu-blue)',
  Leadership:   'var(--wgu-gold)',
  'Ops Team':   'var(--wgu-medium-blue)',
  'Field Team': 'var(--wgu-green)',
}

export const MEMBER_ROLES = ['Admin', 'Director', 'Manager', 'Ops Team', 'SPM'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

/** Returns the set of app slugs a role gets by default. Empty when APPS is empty. */
export function getDefaultAccessForRole(_role: MemberRole): Set<string> {
  return new Set<string>()
}
