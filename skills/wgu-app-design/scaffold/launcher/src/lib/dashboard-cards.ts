import 'server-only'
import type { AppSlug } from './sheets'

// ----- Source-sheet column IDs -----------------------------------------
// Replace these with your own Smartsheet column IDs.
// Format: env var name that holds the sheet ID + column ID constants.

// Example: a "tasks" sheet with an Owner and Status column.
const EXAMPLE_TASKS = {
  sheetIdEnv: 'SMARTSHEET_EXAMPLE_TASKS_SHEET_ID',
  Owner: 0 as number,   // replace with real column ID
  Status: 0 as number,  // replace with real column ID
  DONE: 'Done',
} as const

/**
 * Status cards for the home-page bento. Each card is personal — it
 * shows work waiting on the signed-in user. The home page picks up to
 * 4 cards in priority order, filtered to apps the user can access. A
 * user with access to fewer source apps simply sees fewer cards; the
 * bento grid adapts.
 *
 * Replace the CANDIDATES entries below with your own app-aware fetchers.
 * Every fetcher returns null when there is nothing meaningful to show
 * (e.g., zero items, or missing env var).
 */

export type CardTone = 'pos' | 'amber' | 'neg'

export type DashboardCard = {
  /** Stable key for React. */
  key: string
  /** Source app — used to inherit category accent + href + access. */
  appSlug: AppSlug
  /** Lucide icon. */
  icon: 'users' | 'ticket' | 'calendar-check' | 'pie-chart' | 'check-square' | 'bar-chart-3' | 'file-text'
  /** Big headline ("3", "Wed 9 AM", "Due Friday"). */
  primary: string
  /** Subtitle copy. */
  meta: string
  /** Optional urgency callout that renders inline with the meta. */
  highlight?: { text: string; tone: CardTone }
  /** Optional href override (defaults to the source app's URL). */
  href?: string
}

type CardContext = {
  userEmail: string
  /** Display name from auth metadata. Used as a fallback match for
   *  sheets that store assignees as a name instead of an email. */
  userName: string | null
  accessibleAppIds: ReadonlySet<string>
}

type CandidateCard = {
  /** Required app the user must be able to access for this card to show. */
  requiresApp: AppSlug
  /** Higher = more important; we keep the top 4. */
  priority: number
  /** Returns the card data, or null when there's nothing meaningful to show. */
  fetch: (ctx: CardContext) => Promise<DashboardCard | null>
}

/**
 * Top-level: returns up to 4 cards the signed-in user should see, in
 * priority order. Cards drop out when the user lacks access to the
 * source app or when the fetcher returns null (e.g., empty zero-state
 * we'd rather hide).
 */
export async function getDashboardCards(ctx: CardContext): Promise<DashboardCard[]> {
  const eligible = CANDIDATES.filter((c) => ctx.accessibleAppIds.has(c.requiresApp))

  const results = await Promise.all(
    eligible.map(async (c) => ({
      priority: c.priority,
      card: await c.fetch(ctx).catch((err) => {
        console.error(`[dashboard-cards] ${c.requiresApp} fetcher failed:`, err)
        return null
      }),
    })),
  )

  return results
    .filter((r): r is { priority: number; card: DashboardCard } => r.card !== null)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((r) => r.card)
}

// ============================================================================
// Candidate cards. Replace these with your own app/sheet integrations.
// Each fetcher takes the current user context and returns a card or null.
// ============================================================================

const CANDIDATES: CandidateCard[] = [
  // ----- Example: tasks assigned to me ------------------------------------
  // Replace 'example-tool' with your app's slug and wire up the real sheet.
  {
    requiresApp: 'example-tool' as AppSlug,
    priority: 100,
    async fetch({ userEmail }) {
      // TODO: query your Smartsheet using smartsheetFetch.
      // Check EXAMPLE_TASKS.sheetIdEnv for the sheet ID env var.
      void EXAMPLE_TASKS // suppress unused warning until wired
      void userEmail
      return null
    },
  },

  // ----- Example: upcoming meeting ----------------------------------------
  {
    requiresApp: 'another-tool' as AppSlug,
    priority: 80,
    async fetch() {
      // TODO: query your meetings sheet for the next scheduled meeting.
      return null
    },
  },
]

// ============================================================================
// Mock helpers — replace callsites with real Smartsheet queries.
// ============================================================================

/** Deterministic per-user "count" so different testers see different numbers
 *  without needing real data plumbed in. Same email → same number. */
export function mockCount(email: string, salt: string, min: number, max: number): number {
  let h = 0
  for (const c of `${email}|${salt}`) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return min + (h % (max - min + 1))
}
