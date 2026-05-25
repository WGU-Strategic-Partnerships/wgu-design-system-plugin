export type AppStatus = 'live' | 'local' | 'beta'
export type AppCategory = 'Executive' | 'Leadership' | 'Ops Team' | 'Field Team'

export type AppTile = {
  id: string
  name: string
  url: string
  description: string
  category: AppCategory
  /** Any lucide-react icon name, e.g. 'cpu', 'users'. */
  icon: string
  status: AppStatus
  /** Hidden apps never appear in role defaults and are filtered out
   *  of the public app directory. They still show up in the admin grid
   *  so explicit grants can be issued. */
  hidden?: boolean
}

export const CATEGORY_ORDER: readonly AppCategory[] = [
  'Executive',
  'Leadership',
  'Ops Team',
  'Field Team',
]

/**
 * Raw app list. Replace these template entries with your real apps.
 * Source order doesn't matter — the public `APPS` export sorts these
 * by CATEGORY_ORDER so every consumer (chip row, admin grid, command
 * palette, header dropdowns) renders apps grouped consistently.
 */
const RAW_APPS: readonly AppTile[] = [
  {
    id: 'example-tool',
    name: '__APP_NAME__ Example Tool',
    url: 'https://example-tool.vercel.app',
    description: 'Replace with your tool description.',
    category: 'Executive',
    icon: 'cpu',
    status: 'live',
  },
  {
    id: 'another-tool',
    name: '__APP_NAME__ Another Tool',
    url: 'https://another-tool.vercel.app',
    description: 'A second tool for the Ops Team.',
    category: 'Ops Team',
    icon: 'file-text',
    status: 'live',
  },
  {
    id: 'field-tool',
    name: '__APP_NAME__ Field Tool',
    url: 'https://field-tool.vercel.app',
    description: 'A tool for field team members. Hidden from role defaults.',
    category: 'Field Team',
    icon: 'users',
    status: 'live',
    hidden: true,
  },
  // Add more entries here.
]

/**
 * Apps sorted by CATEGORY_ORDER. Stable within each category, so within
 * a category they keep their order from RAW_APPS above. Every UI that
 * iterates APPS gets the same grouping automatically — changing an
 * app's category re-orders it on the next deploy without any other
 * code change.
 */
export const APPS: readonly AppTile[] = [...RAW_APPS].sort((a, b) => {
  return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
})

/**
 * Lucide icon name per category. Used in the header dropdown trigger and
 * other category-flagged UI.
 */
export const CATEGORY_ICON: Record<AppCategory, string> = {
  Executive:   'briefcase',
  Leadership:  'crown',
  'Ops Team':  'wrench',
  'Field Team': 'compass',
}

/**
 * Roles assignable to a member from the admin page. Determines that
 * member's default app access; the admin can still customize per-app
 * checkboxes after the role is applied.
 */
export const MEMBER_ROLES = ['Admin', 'Director', 'Manager', 'Ops Team', 'SPM'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

/** Categories a given role gets default access to. Hidden apps are
 *  never in any role's defaults — they're admin-grant only. */
const ROLE_CATEGORIES: Record<MemberRole, ReadonlySet<AppCategory>> = {
  Admin:      new Set<AppCategory>(['Executive', 'Leadership', 'Ops Team', 'Field Team']),
  Director:   new Set<AppCategory>(['Executive', 'Leadership', 'Field Team']),
  Manager:    new Set<AppCategory>(['Leadership', 'Field Team']),
  'Ops Team': new Set<AppCategory>(['Ops Team', 'Field Team']),
  SPM:        new Set<AppCategory>(['Executive', 'Leadership', 'Ops Team', 'Field Team']),
}

/**
 * Compute the set of app slugs a role gets by default. Used to
 * pre-populate the admin checkbox grid when a member's role is set
 * or changed. Hidden apps are always excluded.
 */
export function getDefaultAccessForRole(role: MemberRole): Set<string> {
  const allowed = ROLE_CATEGORIES[role]
  const result = new Set<string>()
  for (const app of APPS) {
    if (app.hidden) continue
    if (allowed.has(app.category)) result.add(app.id)
  }
  return result
}
