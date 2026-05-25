# Data layer

Every WGU app touches at least one of three data sources. This document codifies the patterns, helper files, and env vars for each.

## Data sources at a glance

| Source | Used for | Read pattern |
|---|---|---|
| Supabase Postgres | App-specific data (records, settings, sessions, history) | RLS-gated; client + server SDKs |
| Smartsheet | Master roster (members, roles, app access grants); some line-of-business data | Server-only via REST; `lib/smartsheet.ts` helper |
| Salesforce | Read-only business data (accounts, opportunities, partners) | Server-only via REST + bulk; `lib/salesforce.ts` helper |

---

## Supabase as the default

Every WGU app has a Supabase project. Use it for anything app-specific: user-generated records, settings, session state, run history. RLS keys off `auth.uid()` for per-row access control and off `auth.email()` when matching against an external roster (the Smartsheet master roster is not in Supabase, so email is the join key). Never use the service-role key on the client — it bypasses all row-level security and would expose every row in the database to any user who can read the page source.

### RLS pattern

```sql
-- illustrative SQL, not lifted from source
create policy "members read their own rows"
  on app_records
  for select
  using (created_by_email = auth.email());

create policy "admins read all rows"
  on app_records
  for select
  using (
    exists (
      select 1 from members
      where members.email = auth.email()
        and members.role in ('Admin', 'Superadmin')
    )
  );
```

---

## Smartsheet — master roster pattern

The master roster is a Smartsheet sheet with columns Email, DisplayName, Role, AvatarUrl, and AccessibleApps (a multi-select listing which app slugs a member may access). The typed-reads layer is `lib/master-roster.ts` (full source pasted in [auth.md](./auth.md) — the master roster reader feeds `getCurrentUser()` and the access-gate middleware). The lower-level Smartsheet API client lives in `lib/smartsheet.ts`, pasted below.

## Smartsheet helper: `lib/smartsheet.ts`

Thin REST wrapper — error class, authenticated fetch, generic row/cell types, and `readCell` / `readContactEmails` helpers for extracting typed values from Smartsheet's column-indexed cell format.

```typescript
// /Users/bentley/Documents/Claude/Projects/wgu-tools/src/lib/smartsheet.ts
import 'server-only'

const BASE_URL = 'https://api.smartsheet.com/2.0'

export class SmartsheetError extends Error {
  constructor(
    public status: number,
    public errorCode: number | undefined,
    message: string,
    public refId?: string,
  ) {
    super(message)
    this.name = 'SmartsheetError'
  }
}

function token(): string {
  const t = process.env.SMARTSHEET_API_TOKEN
  if (!t) throw new Error('SMARTSHEET_API_TOKEN env var is required')
  return t
}

export async function smartsheetFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    let errorCode: number | undefined
    let message = text
    let refId: string | undefined
    try {
      const parsed = JSON.parse(text) as { errorCode?: number; message?: string; refId?: string }
      errorCode = parsed.errorCode
      message = parsed.message ?? text
      refId = parsed.refId
    } catch {
      // not JSON
    }
    throw new SmartsheetError(res.status, errorCode, message, refId)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ===== Generic row shape =====

export type SmartsheetCell = {
  columnId: number
  value?: unknown
  displayValue?: string
}

export type SmartsheetRow = {
  id: number
  rowNumber?: number
  createdAt?: string
  modifiedAt?: string
  cells: SmartsheetCell[]
}

export type SheetGetResponse = {
  id: number
  name: string
  totalRowCount: number
  rows: SmartsheetRow[]
}

export function readCell(row: SmartsheetRow, columnId: number): string | null {
  const cell = row.cells.find((c) => c.columnId === columnId)
  if (!cell) return null
  const v = cell.value ?? cell.displayValue
  if (v === null || v === undefined || v === '') return null
  return typeof v === 'string' ? v : String(v)
}

/**
 * Extract emails from a MULTI_CONTACT_LIST cell. Smartsheet returns
 * either `{ objectType: 'MULTI_CONTACT', values: [{email, name}, ...] }`
 * via `value`, or a CONTACT object via `objectValue` with the same
 * shape. Returns the emails (lowercased) — empty array if the cell is
 * empty or any other shape.
 */
export function readContactEmails(row: SmartsheetRow, columnId: number): string[] {
  const cell = row.cells.find((c) => c.columnId === columnId)
  if (!cell) return []
  const out: string[] = []

  // Multi-contact: value is an object with a `values` array.
  const v = cell.value as unknown
  if (v && typeof v === 'object' && 'values' in v) {
    const values = (v as { values?: Array<{ email?: string }> }).values ?? []
    for (const entry of values) {
      if (entry?.email) out.push(entry.email.toLowerCase())
    }
    return out
  }

  // Single contact stored as a string email.
  if (typeof v === 'string' && v.includes('@')) {
    out.push(v.toLowerCase())
    return out
  }

  return out
}
```

MBR Builder's `src/lib/smartsheet.ts` is substantively the same fetch wrapper and error class, but diverges in two ways: (1) it adds a `SmartsheetColumn` type (with `systemColumnType` guard used by `mbr-fields.ts` to skip auto-managed columns on writes), (2) it omits `readContactEmails` (MBR Builder never needs multi-contact cell parsing), and (3) it returns `(await res.json()) as T` directly on 200 rather than handling the 204 edge case. WGU.tools' version is the canon — it handles 204 and includes the multi-contact helper.

---

## Salesforce — when to use

Salesforce is read-only business data: account hierarchies, opportunity status, partner vertical assignments, enrollment KPIs, pipeline stage counts. Never use it for app state — anything a user writes should go to Supabase. Always call Salesforce from server-only helpers; the credentials (client secret, refresh token) must never reach the browser. The OAuth flow uses Authorization Code with PKCE (not JWT bearer) because it avoids the cert-upload ceremony and matches Salesforce's PKCE-required modern defaults; a single admin connects once, and the refresh token persists for all subsequent sync runs.

## Salesforce auth + client: `lib/salesforce.ts`

PKCE OAuth flow, token exchange, token refresh, and the `SalesforceTokens` type. All downstream callers get tokens from here.

```typescript
// /Users/bentley/Documents/Claude/Projects/mbr-builder/src/lib/salesforce.ts
import 'server-only'
import { createHash, randomBytes } from 'crypto'

/**
 * Salesforce OAuth (Authorization Code with PKCE) helpers.
 *
 * The flow we use:
 *   1. Admin clicks "Connect Salesforce" → /api/admin/sf-oauth-start.
 *   2. Server generates a PKCE code_verifier + code_challenge, stashes
 *      the verifier in an httpOnly cookie, and 302-redirects to the
 *      Salesforce authorize endpoint.
 *   3. Admin signs into Salesforce, approves our External Client App.
 *   4. SF redirects back to /api/admin/sf-oauth-callback?code=...&state=...
 *   5. Server reads the verifier cookie, POSTs to SF's token endpoint,
 *      gets back { access_token, refresh_token, instance_url }.
 *   6. Server writes the refresh_token + instance_url onto the admin's
 *      User Accounts row in Smartsheet (we don't add a separate
 *      database — the admin sheet already exists and is admin-gated).
 *   7. For each subsequent sync run, server reads the refresh_token
 *      from the sheet, exchanges it for a fresh access_token, queries
 *      Salesforce, writes results back to the MBR sheets.
 *
 * Why External Client App OAuth (not JWT bearer): JWT requires
 * generating + uploading a self-signed cert and pre-authorizing the
 * service account user. Authorization Code with PKCE is simpler for
 * the "Bentley clicks once, refresh token persists" model and matches
 * Salesforce's modern PKCE-required defaults.
 *
 * Env vars (set in Vercel):
 *   - SALESFORCE_CLIENT_ID       External Client App Consumer Key
 *   - SALESFORCE_CLIENT_SECRET   External Client App Consumer Secret
 *   - SALESFORCE_LOGIN_URL       e.g. https://wgu.my.salesforce.com
 *   - SALESFORCE_REDIRECT_URI    e.g. https://mbr-builder.vercel.app/api/admin/sf-oauth-callback
 */

export type SalesforceTokens = {
  /** Short-lived bearer token for API calls (TTL ~1h). */
  accessToken: string
  /** Long-lived refresh token for getting fresh access tokens. */
  refreshToken: string
  /** The org-specific REST API base URL, e.g. https://wgu.my.salesforce.com */
  instanceUrl: string
  /** Granted scope string returned by SF. */
  scope?: string
  /** Identity URL — useful for confirming which user/org we're connected as. */
  id?: string
  /** Issued-at timestamp from SF (ms since epoch as a string). */
  issuedAt?: string
  /** Signature SF uses for tamper detection. */
  signature?: string
}

export function getSalesforceConfig(): {
  clientId: string
  clientSecret: string
  loginUrl: string
  redirectUri: string
} {
  const clientId = process.env.SALESFORCE_CLIENT_ID
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://wgu.my.salesforce.com'
  const redirectUri =
    process.env.SALESFORCE_REDIRECT_URI ||
    'https://mbr-builder.vercel.app/api/admin/sf-oauth-callback'
  if (!clientId) throw new Error('SALESFORCE_CLIENT_ID env var is not set')
  if (!clientSecret) throw new Error('SALESFORCE_CLIENT_SECRET env var is not set')
  return { clientId, clientSecret, loginUrl, redirectUri }
}

// =============================================================================
// PKCE
// =============================================================================

/** Random URL-safe string, 43–128 chars per RFC 7636. */
export function generateCodeVerifier(): string {
  // 32 random bytes → 43-char base64url string, comfortably within the spec.
  return base64UrlEncode(randomBytes(32))
}

/** SHA-256(code_verifier), base64url-encoded. */
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest()
  return base64UrlEncode(hash)
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Random opaque string used as OAuth `state` (CSRF mitigation). */
export function generateState(): string {
  return base64UrlEncode(randomBytes(16))
}

// =============================================================================
// URL builders
// =============================================================================

/**
 * The URL we redirect the admin to so they can sign into Salesforce and
 * approve our External Client App. After approval, Salesforce redirects
 * to redirectUri with `code` + `state` query params.
 */
export function buildAuthorizeUrl(input: {
  codeChallenge: string
  state: string
}): string {
  const { clientId, loginUrl, redirectUri } = getSalesforceConfig()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'api refresh_token offline_access',
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    state: input.state,
  })
  return `${loginUrl}/services/oauth2/authorize?${params.toString()}`
}

// =============================================================================
// Token endpoint
// =============================================================================

/**
 * Exchange the one-time `code` from the OAuth redirect for a refresh
 * token + access token + instance URL. Called once at the end of the
 * authorize flow.
 */
export async function exchangeCodeForTokens(input: {
  code: string
  codeVerifier: string
}): Promise<SalesforceTokens> {
  const { clientId, clientSecret, loginUrl, redirectUri } = getSalesforceConfig()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: input.code,
    code_verifier: input.codeVerifier,
  })
  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Salesforce token exchange failed (${res.status}): ${text.slice(0, 500)}`,
    )
  }
  const json = (await res.json()) as Record<string, unknown>
  return parseTokenResponse(json, { requireRefresh: true })
}

/**
 * Trade a stored refresh token for a fresh access token. Called at the
 * start of every sync run. The refresh token doesn't change (we left
 * Refresh Token Rotation off in the External Client App).
 */
export async function refreshAccessToken(input: {
  refreshToken: string
  /**
   * Instance URL we got at OAuth time. Salesforce's token endpoint
   * actually accepts a refresh request at the org's My Domain URL OR
   * at the generic login URL — we use the instance URL when we have
   * it because some orgs have stricter routing rules.
   */
  instanceUrl?: string
}): Promise<SalesforceTokens> {
  const { clientId, clientSecret, loginUrl } = getSalesforceConfig()
  const tokenBase = input.instanceUrl || loginUrl
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: input.refreshToken,
  })
  const res = await fetch(`${tokenBase}/services/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Salesforce refresh-token exchange failed (${res.status}): ${text.slice(0, 500)}`,
    )
  }
  const json = (await res.json()) as Record<string, unknown>
  return parseTokenResponse(json, { requireRefresh: false, fallbackRefresh: input.refreshToken })
}

function parseTokenResponse(
  json: Record<string, unknown>,
  opts: { requireRefresh: boolean; fallbackRefresh?: string },
): SalesforceTokens {
  const accessToken = typeof json.access_token === 'string' ? json.access_token : undefined
  const instanceUrl = typeof json.instance_url === 'string' ? json.instance_url : undefined
  const refreshFromResponse =
    typeof json.refresh_token === 'string' ? json.refresh_token : undefined
  const refreshToken = refreshFromResponse ?? opts.fallbackRefresh
  if (!accessToken) throw new Error('Salesforce token response missing access_token')
  if (!instanceUrl) throw new Error('Salesforce token response missing instance_url')
  if (opts.requireRefresh && !refreshToken) {
    throw new Error('Salesforce token response missing refresh_token')
  }
  return {
    accessToken,
    refreshToken: refreshToken ?? '',
    instanceUrl,
    scope: typeof json.scope === 'string' ? json.scope : undefined,
    id: typeof json.id === 'string' ? json.id : undefined,
    issuedAt: typeof json.issued_at === 'string' ? json.issued_at : undefined,
    signature: typeof json.signature === 'string' ? json.signature : undefined,
  }
}
```

## Salesforce queries: `lib/salesforce-query.ts`

Query helpers — SOQL builders, paginated reads. Manages an in-process access-token cache (50 min TTL, coalesced refresh) and exposes typed helpers for every MBR-Builder query: enrollment KPIs, closed business, pipeline matrix, advancers/decliners, event counts, opportunity progression, new opps, lead source counts, and ReNEW pipeline.

```typescript
// /Users/bentley/Documents/Claude/Projects/mbr-builder/src/lib/salesforce-query.ts
import 'server-only'
import { getActiveSalesforceConnection } from './user-accounts'
import { refreshAccessToken, type SalesforceTokens } from './salesforce'
import { getRosterEmails } from './sales-roster'
import type { Role, Vertical } from './mbr-sheets'

/**
 * Salesforce SOQL query helpers. Sits on top of the auth layer in
 * `salesforce.ts` — pulls the active refresh token from the User Accounts
 * sheet, exchanges it for a fresh access token (cached ~50 min), and
 * exposes typed helpers for the MBR-specific queries.
 *
 * Scope: every query is scoped to a `verticalSfdc` value (a Partner__c
 * picklist value on Account) + `Active_Partnership__c = TRUE` (the
 * "Executive Portfolio" boolean). All managers in the same vertical see
 * the same data — the MBR is a portfolio-level review, not a per-rep
 * book of business. Manager attribution still lives in the Smartsheet
 * row metadata (manager_email / manager_name), not in the SFDC filter.
 *
 * Verified live 2026-05-13:
 *   - Partnership stages picklist: Discovery, Intake, Pitch, Negotiation, Signing
 *   - Tier: Account.Account_Tier__c picklist (Tier 1 / Tier 2 / Tier 3)
 *   - Fortune 1000: Account.Fortune_1000__c (boolean)
 *   - Enrollment YTD: Account.New_Starts_Current_FY_To_Date__c
 *   - Enrollment target: Account.B2B_Current_FY_New_Starts_Target__c
 *   - Cert YTD: Account.Certificate_New_Starts__c
 *   - Partner Vertical: Account.Partner__c picklist
 *     (values: Corporate / Healthcare / Military / K12 Partner /
 *      Transfer Partner / Region)
 *   - Executive Portfolio flag: Account.Active_Partnership__c (boolean)
 */

const API_VERSION = 'v60.0'

/**
 * Opportunity RecordTypes that count as "partnership" for every query in
 * this file. Updated 2026-05-14: swapped Career_and_Professional_Services
 * (out of scope per stakeholder review) for Healthcare_Fund (in scope).
 *
 * Display names (Salesforce UI):
 *   Strategic_Partnership_Opportunity → Prospective Partnership
 *   Partner_Expansion                  → Partner Expansion
 *   PartnerRenewal                     → Partner Renewal
 *   ReNew_Fund                         → ReNEW Fund/Healthcare
 *   Healthcare_Fund                    → Healthcare Fund
 */
export const PARTNERSHIP_RECORD_TYPES = [
  'Strategic_Partnership_Opportunity',
  'Partner_Expansion',
  'PartnerRenewal',
  'ReNew_Fund',
  'Healthcare_Fund',
] as const

export const PARTNERSHIP_STAGES = ['Discovery', 'Intake', 'Pitch', 'Negotiation', 'Signing'] as const
export type PartnershipStage = (typeof PARTNERSHIP_STAGES)[number]

/**
 * Stages an Opportunity can be in to count as a "progression" for the
 * Opportunity Progression table. Same as PARTNERSHIP_STAGES (the active
 * funnel) plus Closed Won — moving to Closed Won IS a meaningful
 * progression. Closed Lost variants are intentionally excluded — those
 * are exits, not progressions.
 */
export const PROGRESSION_STAGES = [
  'Discovery',
  'Intake',
  'Pitch',
  'Negotiation',
  'Signing',
  'Closed Won',
] as const

export const ACCOUNT_TIERS = ['Tier 1', 'Tier 2', 'Tier 3'] as const
export type AccountTier = (typeof ACCOUNT_TIERS)[number]

/**
 * MBR Vertical → Account.Partner__c picklist value. SFDC uses verbose
 * values ('K12 Partner', 'Transfer Partner') that don't match the
 * MBR's UI labels exactly.
 */
export const MBR_VERTICAL_TO_SFDC_PARTNER: Record<string, string> = {
  Corporate: 'Corporate',
  Healthcare: 'Healthcare',
  Military: 'Military',
  'K-12': 'K12 Partner',
  Transfer: 'Transfer Partner',
}

export function mbrVerticalToSfdc(vertical: string): string {
  const mapped = MBR_VERTICAL_TO_SFDC_PARTNER[vertical]
  if (!mapped) {
    throw new Error(
      `No Account.Partner__c mapping for MBR vertical "${vertical}". Add it to MBR_VERTICAL_TO_SFDC_PARTNER.`,
    )
  }
  return mapped
}

export const LEAD_SOURCE_BUCKETS: Record<string, string[]> = {
  ls_partner_ref: ['Partner', 'External Referral'],
  ls_event: ['Trade Show', 'Seminar - Internal', 'Seminar - Partner'],
  ls_mktg: ['Advertisement', 'Public Relations'],
  ls_cold: ['Cold Call/Prospecting'],
  ls_organic: ['Web', 'Word of mouth'],
}

// =============================================================================
// Access-token cache (in-process)
// =============================================================================

type CachedToken = SalesforceTokens & { expiresAt: number }
let _cachedToken: CachedToken | null = null
const TOKEN_TTL_MS = 50 * 60 * 1000

/**
 * Coalesces concurrent token-refresh requests into a single in-flight
 * promise. Without this, the PE sync (10+ parallel SOQL queries) racing
 * to refresh on an empty cache triggers SFDC's "token request is already
 * being processed" / `invalid_grant` rejection — Salesforce serializes
 * refresh-token exchanges per refresh_token and bounces the duplicates.
 */
let _refreshInFlight: Promise<SalesforceTokens> | null = null

async function getActiveTokens(): Promise<SalesforceTokens> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) return _cachedToken
  if (_refreshInFlight) return _refreshInFlight

  _refreshInFlight = (async () => {
    try {
      const connection = await getActiveSalesforceConnection()
      if (!connection) {
        throw new Error(
          'No Salesforce connection found. An admin must click "Connect Salesforce" on the admin page first.',
        )
      }
      const tokens = await refreshAccessToken({
        refreshToken: connection.refreshToken,
        instanceUrl: connection.instanceUrl,
      })
      _cachedToken = { ...tokens, expiresAt: Date.now() + TOKEN_TTL_MS }
      return tokens
    } finally {
      // Always clear the in-flight slot, even on failure, so the next caller
      // can attempt a fresh refresh instead of awaiting a rejected promise.
      _refreshInFlight = null
    }
  })()
  return _refreshInFlight
}

function invalidateTokenCache() {
  _cachedToken = null
}

// =============================================================================
// Generic SOQL
// =============================================================================

type SoqlResult<T> = {
  totalSize: number
  done: boolean
  nextRecordsUrl?: string
  records: T[]
}

export async function sfQuery<T>(soql: string): Promise<T[]> {
  return sfQueryInternal<T>(soql, /* retryOn401 */ true)
}

async function sfQueryInternal<T>(soql: string, retryOn401: boolean): Promise<T[]> {
  const tokens = await getActiveTokens()
  const url = new URL(`${tokens.instanceUrl}/services/data/${API_VERSION}/query`)
  url.searchParams.set('q', soql)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    cache: 'no-store',
  })
  if (res.status === 401 && retryOn401) {
    invalidateTokenCache()
    return sfQueryInternal<T>(soql, false)
  }
  if (!res.ok) {
    throw new Error(`Salesforce query failed (${res.status}): ${(await res.text()).slice(0, 500)}`)
  }
  const data = (await res.json()) as SoqlResult<T>
  let allRecords = data.records
  let nextUrl = data.nextRecordsUrl
  while (nextUrl) {
    const page = await fetch(`${tokens.instanceUrl}${nextUrl}`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      cache: 'no-store',
    })
    if (!page.ok) throw new Error(`Salesforce pagination failed (${page.status})`)
    const pageData = (await page.json()) as SoqlResult<T>
    allRecords = allRecords.concat(pageData.records)
    nextUrl = pageData.nextRecordsUrl
  }
  return allRecords
}

export async function sfCount(soql: string): Promise<number> {
  const tokens = await getActiveTokens()
  const url = new URL(`${tokens.instanceUrl}/services/data/${API_VERSION}/query`)
  url.searchParams.set('q', soql)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
    cache: 'no-store',
  })
  if (res.status === 401) {
    invalidateTokenCache()
    return sfCount(soql)
  }
  if (!res.ok) {
    throw new Error(`Salesforce count failed (${res.status}): ${(await res.text()).slice(0, 500)}`)
  }
  const data = (await res.json()) as { totalSize: number }
  return data.totalSize
}

// =============================================================================
// Cached lookups
// =============================================================================

let _partnershipRtIds: string[] | null = null

export async function getPartnershipRecordTypeIds(): Promise<string[]> {
  if (_partnershipRtIds) return _partnershipRtIds
  const names = PARTNERSHIP_RECORD_TYPES.map((n) => `'${n}'`).join(', ')
  const rows = await sfQuery<{ Id: string }>(
    `SELECT Id FROM RecordType WHERE SObjectType = 'Opportunity' AND DeveloperName IN (${names})`,
  )
  _partnershipRtIds = rows.map((r) => r.Id)
  return _partnershipRtIds
}

async function partnershipRtClause(): Promise<string> {
  const ids = await getPartnershipRecordTypeIds()
  return `RecordTypeId IN (${ids.map((i) => `'${i}'`).join(', ')})`
}

/** Account-side scope used by every query in this file. */
function accountScope(verticalSfdc: string): string {
  const safe = verticalSfdc.replace(/'/g, "\\'")
  return `Partner__c = '${safe}' AND Active_Partnership__c = TRUE`
}

/** Vertical-only Account scope — no Executive Portfolio filter. Used by
 *  the Events table (mirroring the Pipeline by Type policy: show the
 *  full vertical, not just the exec portfolio slice). */
function accountScopeVerticalOnly(verticalSfdc: string): string {
  const safe = verticalSfdc.replace(/'/g, "\\'")
  return `Partner__c = '${safe}'`
}

/** Same scope but reached via Opportunity → Account relationship. */
function opportunityAccountScope(verticalSfdc: string): string {
  const safe = verticalSfdc.replace(/'/g, "\\'")
  return `Account.Partner__c = '${safe}' AND Account.Active_Partnership__c = TRUE`
}

/**
 * Vertical-only Opportunity scope — no Executive Portfolio filter.
 * Used by the Pipeline by Type / Tier 1 / ReNEW pipeline tables, which
 * are supposed to show the FULL open pipeline in a vertical, not just
 * the slice owned by the exec portfolio.
 *
 * The closed-business KPIs (closed_won, tier1_won, fortune1000_won,
 * etc.) and the progressed-opps + lead-source queries continue to use
 * opportunityAccountScope (vertical + EP) because those metrics
 * represent the exec portfolio's performance specifically.
 */
function opportunityVerticalOnlyScope(verticalSfdc: string): string {
  const safe = verticalSfdc.replace(/'/g, "\\'")
  return `Account.Partner__c = '${safe}'`
}

// =============================================================================
// Typed helpers
// =============================================================================

export type EnrollmentKpis = {
  newStartActual: number
  newStartTarget: number
  certStarts: number
  accountCount: number
}

export async function getEnrollmentKpis(verticalSfdc: string): Promise<EnrollmentKpis> {
  const rows = await sfQuery<{
    starts: number | null
    target: number | null
    certs: number | null
    accounts: number
  }>(
    `SELECT
       SUM(New_Starts_Current_FY_To_Date__c) starts,
       SUM(B2B_Current_FY_New_Starts_Target__c) target,
       SUM(Certificate_New_Starts__c) certs,
       COUNT(Id) accounts
     FROM Account WHERE ${accountScope(verticalSfdc)}`,
  )
  const r = rows[0]
  return {
    newStartActual: r?.starts ?? 0,
    newStartTarget: r?.target ?? 0,
    certStarts: r?.certs ?? 0,
    accountCount: r?.accounts ?? 0,
  }
}

export type ClosedBusinessKpis = {
  closedWon: number
  tier1Won: number
  closedLost: number
  fortune1000Won: number
  avgDaysToClose: number | null
}

export async function getClosedBusinessKpis(verticalSfdc: string): Promise<ClosedBusinessKpis> {
  const rt = await partnershipRtClause()
  const scope = opportunityAccountScope(verticalSfdc)
  const fy = 'CloseDate = THIS_FISCAL_YEAR'
  const [closedWon, tier1Won, closedLost, fortune1000Won, avgRows] = await Promise.all([
    sfCount(`SELECT COUNT() FROM Opportunity WHERE IsWon = TRUE AND ${fy} AND ${scope} AND ${rt}`),
    sfCount(
      `SELECT COUNT() FROM Opportunity WHERE IsWon = TRUE AND ${fy} AND Account.Account_Tier__c = 'Tier 1' AND ${scope} AND ${rt}`,
    ),
    sfCount(
      `SELECT COUNT() FROM Opportunity WHERE IsClosed = TRUE AND IsWon = FALSE AND ${fy} AND ${scope} AND ${rt}`,
    ),
    sfCount(
      `SELECT COUNT() FROM Opportunity WHERE IsWon = TRUE AND ${fy} AND Account.Fortune_1000__c = TRUE AND ${scope} AND ${rt}`,
    ),
    // SOQL doesn't support date arithmetic inside aggregate functions
    // (`AVG(CloseDate - DAY_ONLY(CreatedDate))` is rejected with
    // MALFORMED_QUERY). Pull the two columns and average client-side.
    sfQuery<{ CloseDate: string; CreatedDate: string }>(
      `SELECT CloseDate, CreatedDate FROM Opportunity WHERE IsWon = TRUE AND ${fy} AND ${scope} AND ${rt}`,
    ),
  ])
  return {
    closedWon,
    tier1Won,
    closedLost,
    fortune1000Won,
    avgDaysToClose: avgDays(avgRows),
  }
}

/** Avg days between CreatedDate and CloseDate. Null when no rows. */
function avgDays(rows: { CloseDate: string; CreatedDate: string }[]): number | null {
  if (rows.length === 0) return null
  let total = 0
  let counted = 0
  for (const r of rows) {
    if (!r.CloseDate || !r.CreatedDate) continue
    const close = new Date(r.CloseDate).getTime()
    const created = new Date(r.CreatedDate).getTime()
    if (Number.isNaN(close) || Number.isNaN(created)) continue
    total += (close - created) / 86_400_000
    counted += 1
  }
  return counted === 0 ? null : Math.round(total / counted)
}

export type PipelineMatrix = {
  byStage: Record<PartnershipStage, Record<string, number>>
  totalActive: number
}

export async function getPipelineMatrix(verticalSfdc: string): Promise<PipelineMatrix> {
  const rt = await partnershipRtClause()
  // Vertical-only — Pipeline by Type table shows the full open pipeline
  // for the vertical, NOT just the exec portfolio slice. The headline
  // "Total Active Opportunities" KPI is derived from this same total.
  const scope = opportunityVerticalOnlyScope(verticalSfdc)
  const stages = PARTNERSHIP_STAGES.map((s) => `'${s}'`).join(', ')
  type Row = { StageName: PartnershipStage; Name: string; cnt: number }
  const rows = await sfQuery<Row>(
    `SELECT StageName, RecordType.DeveloperName Name, COUNT(Id) cnt
     FROM Opportunity
     WHERE IsClosed = FALSE AND StageName IN (${stages}) AND ${scope} AND ${rt}
     GROUP BY StageName, RecordType.DeveloperName`,
  )
  const byStage: Record<PartnershipStage, Record<string, number>> = {
    Discovery: {}, Intake: {}, Pitch: {}, Negotiation: {}, Signing: {},
  }
  let totalActive = 0
  for (const r of rows) {
    byStage[r.StageName] ||= {}
    byStage[r.StageName][r.Name] = (byStage[r.StageName][r.Name] || 0) + r.cnt
    totalActive += r.cnt
  }
  return { byStage, totalActive }
}

export async function getTier1PipelineByStage(
  verticalSfdc: string,
): Promise<Record<PartnershipStage, number>> {
  const rt = await partnershipRtClause()
  // Vertical-only (Tier 1 cross-cut row in the same Pipeline by Type table).
  const scope = opportunityVerticalOnlyScope(verticalSfdc)
  const stages = PARTNERSHIP_STAGES.map((s) => `'${s}'`).join(', ')
  type Row = { StageName: PartnershipStage; cnt: number }
  const rows = await sfQuery<Row>(
    `SELECT StageName, COUNT(Id) cnt
     FROM Opportunity
     WHERE IsClosed = FALSE AND StageName IN (${stages})
       AND Account.Account_Tier__c = 'Tier 1' AND ${scope} AND ${rt}
     GROUP BY StageName`,
  )
  const out: Record<PartnershipStage, number> = {
    Discovery: 0, Intake: 0, Pitch: 0, Negotiation: 0, Signing: 0,
  }
  for (const r of rows) out[r.StageName] = r.cnt
  return out
}

export type AccountRanked = {
  id: string
  name: string
  vertical: string | null
  startsYtd: number
  target: number
  pctToTarget: number
}

export async function getAdvancersAndDecliners(
  verticalSfdc: string,
): Promise<{ advancers: AccountRanked[]; decliners: AccountRanked[] }> {
  type Row = {
    Id: string
    Name: string
    Partner__c: string | null
    New_Starts_Current_FY_To_Date__c: number | null
    B2B_Current_FY_New_Starts_Target__c: number
  }
  const rows = await sfQuery<Row>(
    `SELECT Id, Name, Partner__c, New_Starts_Current_FY_To_Date__c, B2B_Current_FY_New_Starts_Target__c
     FROM Account
     WHERE ${accountScope(verticalSfdc)} AND B2B_Current_FY_New_Starts_Target__c > 0`,
  )
  const ranked: AccountRanked[] = rows
    .map((r) => ({
      id: r.Id,
      name: r.Name,
      vertical: r.Partner__c,
      startsYtd: r.New_Starts_Current_FY_To_Date__c ?? 0,
      target: r.B2B_Current_FY_New_Starts_Target__c,
      pctToTarget:
        (r.New_Starts_Current_FY_To_Date__c ?? 0) / r.B2B_Current_FY_New_Starts_Target__c,
    }))
    .sort((a, b) => b.pctToTarget - a.pctToTarget)
  return {
    advancers: ranked.slice(0, 3),
    decliners: ranked.slice(-3).reverse(),
  }
}

export type EventCounts = {
  total: number
  byTier: Record<AccountTier, number>
}

export type EventPeriod = 'LAST_MONTH' | 'THIS_MONTH'

/**
 * Resolve roster emails to SFDC User Ids. Needed because SOQL doesn't
 * allow `(OwnerId IN (sub) OR SecondaryAssignee__c IN (sub))` — both
 * subqueries OR'd together gets rejected with "Semi join sub-selects
 * are only allowed at the top level WHERE expressions." Workaround:
 * one extra round-trip to resolve the User Ids, then inline them as
 * literals in the Event filter.
 */
async function resolveUserIds(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return []
  const escaped = emails.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(', ')
  const rows = await sfQuery<{ Id: string }>(
    `SELECT Id FROM User WHERE Email IN (${escaped}) AND IsActive = TRUE`,
  )
  return rows.map((r) => r.Id)
}

/**
 * Events scoped by the sales roster, not by partner account. The sales
 * team's meetings are with PROSPECTIVE partners that aren't tagged as
 * Active_Partnership__c yet — so we can't filter via Event.WhatId →
 * Account. Instead: pull the (role, vertical) tuple's roster emails
 * from the Sales Roster Smartsheet, resolve them to SFDC User Ids,
 * then filter Event where OwnerId IN (...) OR SecondaryAssignee__c
 * IN (...) — both lists inlined as literals.
 *
 * Returns zeros for (role, vertical) combos with no roster entries
 * (e.g., Military — explicitly skipped per stakeholder).
 *
 * Per-tier rows still use Account.Account_Tier__c via WhatId → Account.
 * Events without an Account link count toward the total but not toward
 * any tier row.
 */
export async function getEventCounts(
  role: Role,
  vertical: Vertical,
  period: EventPeriod,
): Promise<EventCounts> {
  const emails = await getRosterEmails(role, vertical)
  if (emails.length === 0) {
    return { total: 0, byTier: { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0 } }
  }
  const userIds = await resolveUserIds(emails)
  if (userIds.length === 0) {
    return { total: 0, byTier: { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0 } }
  }
  const idList = userIds.map((id) => `'${id}'`).join(', ')
  const ownership = `(OwnerId IN (${idList}) OR SecondaryAssignee__c IN (${idList}))`

  // NB: `SELECT COUNT()` (no field) — NOT `SELECT COUNT(Id)`. The latter
  // is an aggregate function whose response has one envelope row, so
  // sfCount reading totalSize gets 1 instead of the real count. Same
  // gotcha SFDC docs call out: COUNT() vs COUNT(fieldName) have very
  // different return shapes.
  const [total, t1, t2, t3] = await Promise.all([
    sfCount(
      `SELECT COUNT() FROM Event WHERE ActivityDate = ${period} AND ${ownership}`,
    ),
    sfCount(
      `SELECT COUNT() FROM Event WHERE ActivityDate = ${period} AND ${ownership} AND WhatId IN (SELECT Id FROM Account WHERE Account_Tier__c = 'Tier 1')`,
    ),
    sfCount(
      `SELECT COUNT() FROM Event WHERE ActivityDate = ${period} AND ${ownership} AND WhatId IN (SELECT Id FROM Account WHERE Account_Tier__c = 'Tier 2')`,
    ),
    sfCount(
      `SELECT COUNT() FROM Event WHERE ActivityDate = ${period} AND ${ownership} AND WhatId IN (SELECT Id FROM Account WHERE Account_Tier__c = 'Tier 3')`,
    ),
  ])
  return { total, byTier: { 'Tier 1': t1, 'Tier 2': t2, 'Tier 3': t3 } }
}

export type ActivityGap = { name: string; daysSince: number | null }

export async function getExecPortfolioActivityGaps(verticalSfdc: string): Promise<ActivityGap[]> {
  type Row = { Name: string; LastActivityDate: string | null }
  const rows = await sfQuery<Row>(
    `SELECT Name, LastActivityDate FROM Account
     WHERE ${accountScope(verticalSfdc)}
     ORDER BY LastActivityDate ASC NULLS FIRST`,
  )
  const today = Date.now()
  return rows.map((r) => ({
    name: r.Name,
    daysSince: r.LastActivityDate
      ? Math.floor((today - new Date(r.LastActivityDate).getTime()) / 86400000)
      : null,
  }))
}

export type OppProgression = {
  accountName: string
  oppName: string
  fromStageToStage: string | null
  priorStage: string | null
  currentStage: string
  tier: AccountTier | null
}

export async function getProgressedOpps(
  verticalSfdc: string,
  limit = 200,
): Promise<OppProgression[]> {
  const rt = await partnershipRtClause()
  const scope = opportunityAccountScope(verticalSfdc)
  type Row = {
    Id: string
    Name: string
    StageName: string
    Account: { Name: string; Account_Tier__c: AccountTier | null } | null
  }
  // NB: The org has a CUSTOM `Last_Stage_Change_Date__c` field that's empty
  // on every Opportunity — it was provisioned but never populated. The
  // STANDARD `LastStageChangeDate` field (no `__c`) is SFDC-managed and
  // accurate. Use it.
  //
  // Restrict to PROGRESSION_STAGES (Discovery / Intake / Pitch / Negotiation
  // / Signing / Closed Won). Any other stage — Closed Lost*, donor-flavored
  // stages from the shared Ascend org, transitional states like Intro /
  // Qualification — is intentionally out of scope for this table.
  const stagesIn = PROGRESSION_STAGES.map((s) => `'${s}'`).join(', ')
  const rows = await sfQuery<Row>(
    `SELECT Id, Name, StageName, Account.Name, Account.Account_Tier__c
     FROM Opportunity
     WHERE LastStageChangeDate = LAST_MONTH
       AND StageName IN (${stagesIn})
       AND ${scope} AND ${rt}
     ORDER BY LastStageChangeDate DESC LIMIT ${limit}`,
  )

  // Prior stage requires a second query against OpportunityFieldHistory.
  // Done in parallel for the small N (limit ≤ 2 today).
  let priorStageMap: Map<string, string> = new Map()
  if (rows.length > 0) {
    const ids = rows.map((r) => `'${r.Id}'`).join(', ')
    try {
      type HistRow = { OpportunityId: string; OldValue: string | null; CreatedDate: string }
      const hist = await sfQuery<HistRow>(
        `SELECT OpportunityId, OldValue, CreatedDate FROM OpportunityFieldHistory
         WHERE OpportunityId IN (${ids}) AND Field = 'StageName'
         ORDER BY CreatedDate DESC`,
      )
      // First match per OpportunityId is the most recent transition; its
      // OldValue is the prior stage.
      for (const h of hist) {
        if (!priorStageMap.has(h.OpportunityId) && h.OldValue) {
          priorStageMap.set(h.OpportunityId, h.OldValue)
        }
      }
    } catch {
      // History tracking may be disabled or insufficient permissions —
      // surface the rows without prior stages rather than failing the pull.
      priorStageMap = new Map()
    }
  }

  return rows.map((r) => ({
    accountName: r.Account?.Name ?? '',
    oppName: r.Name,
    fromStageToStage: null,
    priorStage: priorStageMap.get(r.Id) ?? null,
    currentStage: r.StageName,
    tier: r.Account?.Account_Tier__c ?? null,
  }))
}

export type NewOpp = {
  accountName: string
  oppName: string
  stage: string
  leadSource: string | null
  tier: AccountTier | null
}

export async function getNewOpps(verticalSfdc: string, limit = 200): Promise<NewOpp[]> {
  const rt = await partnershipRtClause()
  const scope = opportunityAccountScope(verticalSfdc)
  type Row = {
    Name: string
    StageName: string
    LeadSource: string | null
    Account: { Name: string; Account_Tier__c: AccountTier | null } | null
  }
  const rows = await sfQuery<Row>(
    `SELECT Name, StageName, LeadSource, Account.Name, Account.Account_Tier__c
     FROM Opportunity
     WHERE CreatedDate = THIS_MONTH AND ${scope} AND ${rt}
     ORDER BY CreatedDate DESC LIMIT ${limit}`,
  )
  return rows.map((r) => ({
    accountName: r.Account?.Name ?? '',
    oppName: r.Name,
    stage: r.StageName,
    leadSource: r.LeadSource,
    tier: r.Account?.Account_Tier__c ?? null,
  }))
}

export async function getLeadSourceCounts(verticalSfdc: string): Promise<Record<string, number>> {
  const rt = await partnershipRtClause()
  const scope = opportunityAccountScope(verticalSfdc)
  type Row = { LeadSource: string | null; cnt: number }
  const rows = await sfQuery<Row>(
    `SELECT LeadSource, COUNT(Id) cnt FROM Opportunity
     WHERE CreatedDate = THIS_FISCAL_YEAR AND ${scope} AND ${rt}
     GROUP BY LeadSource`,
  )
  const bucketed: Record<string, number> = {
    ls_partner_ref: 0, ls_event: 0, ls_mktg: 0, ls_cold: 0, ls_organic: 0, ls_other: 0,
  }
  const bucketedValues = new Set<string>()
  for (const [bucket, values] of Object.entries(LEAD_SOURCE_BUCKETS)) {
    for (const v of values) bucketedValues.add(v)
    for (const r of rows) {
      if (r.LeadSource && values.includes(r.LeadSource)) bucketed[bucket] += r.cnt
    }
  }
  for (const r of rows) {
    if (!r.LeadSource || !bucketedValues.has(r.LeadSource)) bucketed.ls_other += r.cnt
  }
  return bucketed
}

// =============================================================================
// ReNEW (Healthcare RecordType-specific)
// =============================================================================

export async function getRenewPipelineByStage(
  verticalSfdc: string,
): Promise<Record<PartnershipStage, number>> {
  // Vertical-only — ReNEW pipeline is also a "show all open opps in
  // this RT" view, not an exec portfolio slice.
  const scope = opportunityVerticalOnlyScope(verticalSfdc)
  const stages = PARTNERSHIP_STAGES.map((s) => `'${s}'`).join(', ')
  type Row = { StageName: PartnershipStage; cnt: number }
  const rows = await sfQuery<Row>(
    `SELECT StageName, COUNT(Id) cnt FROM Opportunity
     WHERE IsClosed = FALSE AND StageName IN (${stages})
       AND RecordType.DeveloperName = 'ReNew_Fund' AND ${scope}
     GROUP BY StageName`,
  )
  const out: Record<PartnershipStage, number> = {
    Discovery: 0, Intake: 0, Pitch: 0, Negotiation: 0, Signing: 0,
  }
  for (const r of rows) out[r.StageName] = r.cnt
  return out
}

export async function getRenewWon(verticalSfdc: string): Promise<number> {
  const scope = opportunityAccountScope(verticalSfdc)
  return sfCount(
    `SELECT COUNT() FROM Opportunity WHERE IsWon = TRUE AND CloseDate = THIS_FISCAL_YEAR AND RecordType.DeveloperName = 'ReNew_Fund' AND ${scope}`,
  )
}
```

## Salesforce sync: `lib/salesforce-sync.ts`

Sync orchestration — schedules and runs upserts into Supabase. Pulls all SFDC-sourced fields for a (role, vertical) pair using the query helpers above and returns a `{ field_id: value }` map ready to merge into the form data and hand to `upsertRow`.

```typescript
// /Users/bentley/Documents/Claude/Projects/mbr-builder/src/lib/salesforce-sync.ts
import 'server-only'
import type { Role, Vertical } from './mbr-sheets'
import {
  getAdvancersAndDecliners,
  getClosedBusinessKpis,
  getEnrollmentKpis,
  getEventCounts,
  getExecPortfolioActivityGaps,
  getLeadSourceCounts,
  getNewOpps,
  getPipelineMatrix,
  getProgressedOpps,
  getRenewPipelineByStage,
  getRenewWon,
  getTier1PipelineByStage,
  mbrVerticalToSfdc,
  type PartnershipStage,
} from './salesforce-query'

/**
 * Pulls all SFDC-sourced fields for a (role, vertical) pair and returns
 * a `{ field_id: string }` map ready to merge into the form's FormData
 * and hand to `upsertRow`.
 *
 * Scope semantics — every query runs against:
 *   Account.Partner__c = <vertical>
 *   Account.Active_Partnership__c = TRUE   (Executive Portfolio)
 *
 * All managers in a vertical see the same numbers — the MBR is a
 * portfolio-level review, not a per-rep book of business. Per-manager
 * attribution lives in the Smartsheet row metadata (manager_email,
 * manager_name), not in the SFDC filter.
 *
 * Field IDs match `src/lib/mbr-fields.ts` exactly — column descriptions
 * in the Smartsheet sheets are the contract.
 */

function toStr(n: number | null | undefined): string {
  if (n == null) return ''
  return String(Math.round(n))
}

function toPct(num: number, denom: number): string {
  if (!denom) return ''
  return `${((num / denom) * 100).toFixed(1)}%`
}

/**
 * Pro-rate an annual target to YTD, linearly, on the WGU fiscal year
 * (July–June). Current month counts as elapsed so mid-month MBRs
 * compare against a target that includes the in-progress month.
 *
 *   Jul → 1/12   ·   Dec → 6/12   ·   Jun → 12/12
 */
const WGU_FY_START_MONTH = 6 // July, zero-indexed
function monthsElapsedInFy(now: Date = new Date()): number {
  const m = now.getMonth()
  return m >= WGU_FY_START_MONTH
    ? m - WGU_FY_START_MONTH + 1
    : m + (12 - WGU_FY_START_MONTH) + 1
}
function prorateYtd(annualTarget: number, now: Date = new Date()): number {
  if (!annualTarget) return 0
  return Math.round((annualTarget * monthsElapsedInFy(now)) / 12)
}

function getStageCount(
  byStage: Record<PartnershipStage, Record<string, number>>,
  stage: PartnershipStage,
  rt: string,
): string {
  return toStr(byStage[stage]?.[rt] ?? 0)
}

// =============================================================================
// PSM
// =============================================================================

async function buildPsmFields(
  vertical: Vertical,
  verticalSfdc: string,
): Promise<Record<string, string>> {
  const [enrollment, eventsLast, eventsThis, ranking, activityGaps] = await Promise.all([
    getEnrollmentKpis(verticalSfdc),
    getEventCounts('PSM', vertical, 'LAST_MONTH'),
    getEventCounts('PSM', vertical, 'THIS_MONTH'),
    getAdvancersAndDecliners(verticalSfdc),
    getExecPortfolioActivityGaps(verticalSfdc),
  ])

  const targetYtd = prorateYtd(enrollment.newStartTarget)
  const out: Record<string, string> = {
    new_start_actual: toStr(enrollment.newStartActual),
    // SFDC stores the annual target (B2B_Current_FY_New_Starts_Target__c).
    // The MBR's "Target YTD" expects the pro-rated YTD figure, so we
    // multiply by months_elapsed / 12 (WGU FY = Jul–Jun, current month
    // counts as elapsed).
    target_ytd: toStr(targetYtd),
    pct_to_target: toPct(enrollment.newStartActual, targetYtd),
    cert_starts: toStr(enrollment.certStarts),
    events_last_month: toStr(eventsLast.total),
    events_this_month: toStr(eventsThis.total),
    // Note: events_last_month_with_exec / events_this_month_with_exec used to
    // mean "events linked to an exec-portfolio account." With the scope now
    // pinned to the exec portfolio, that subset equals the total — meaningless.
    // Omit these fields so the manager's manually-entered value is preserved.
    days_since_last_activity: (() => {
      const valid = activityGaps.filter((g) => g.daysSince != null).map((g) => g.daysSince!)
      return valid.length === 0 ? '' : String(Math.max(...valid))
    })(),
  }

  // Pro-rate each row's target the same way as the headline target_ytd.
  // The advancer/decliner ranking by % to target uses the proration too —
  // the relative ranking is unchanged (every row scales by the same factor)
  // but the displayed % matches the headline KPI.
  ranking.advancers.forEach((a, i) => {
    const n = i + 1
    const ytdTarget = prorateYtd(a.target)
    out[`adv${n}_name`] = a.name
    out[`adv${n}_vertical`] = a.vertical ?? ''
    out[`adv${n}_starts_ytd`] = toStr(a.startsYtd)
    out[`adv${n}_starts_target`] = toStr(ytdTarget)
    out[`adv${n}_pct`] = toPct(a.startsYtd, ytdTarget)
  })
  ranking.decliners.forEach((d, i) => {
    const n = i + 1
    const ytdTarget = prorateYtd(d.target)
    out[`dec${n}_name`] = d.name
    out[`dec${n}_vertical`] = d.vertical ?? ''
    out[`dec${n}_starts_ytd`] = toStr(d.startsYtd)
    out[`dec${n}_starts_target`] = toStr(ytdTarget)
    out[`dec${n}_pct`] = toPct(d.startsYtd, ytdTarget)
  })

  return out
}

// =============================================================================
// PE
// =============================================================================

async function buildPeFields(
  vertical: Vertical,
  verticalSfdc: string,
): Promise<Record<string, string>> {
  const [
    closed,
    matrix,
    tier1Pipeline,
    progressed,
    newOpps,
    leadSources,
    eventsLast,
    eventsThis,
    renewPipeline,
    renewWon,
  ] = await Promise.all([
    getClosedBusinessKpis(verticalSfdc),
    getPipelineMatrix(verticalSfdc),
    getTier1PipelineByStage(verticalSfdc),
    getProgressedOpps(verticalSfdc),
    getNewOpps(verticalSfdc),
    getLeadSourceCounts(verticalSfdc),
    getEventCounts('PE', vertical, 'LAST_MONTH'),
    getEventCounts('PE', vertical, 'THIS_MONTH'),
    getRenewPipelineByStage(verticalSfdc),
    getRenewWon(verticalSfdc),
  ])

  const out: Record<string, string> = {
    closed_won: toStr(closed.closedWon),
    tier1_won: toStr(closed.tier1Won),
    closed_lost: toStr(closed.closedLost),
    avg_days_close: toStr(closed.avgDaysToClose),
    total_pipeline: toStr(matrix.totalActive),
    fortune1000_won: toStr(closed.fortune1000Won),

    pipe_new_discovery: getStageCount(matrix.byStage, 'Discovery', 'Strategic_Partnership_Opportunity'),
    pipe_new_intake: getStageCount(matrix.byStage, 'Intake', 'Strategic_Partnership_Opportunity'),
    pipe_new_pitch: getStageCount(matrix.byStage, 'Pitch', 'Strategic_Partnership_Opportunity'),
    pipe_new_negotiation: getStageCount(matrix.byStage, 'Negotiation', 'Strategic_Partnership_Opportunity'),
    pipe_new_signing: getStageCount(matrix.byStage, 'Signing', 'Strategic_Partnership_Opportunity'),

    pipe_renewal_discovery: getStageCount(matrix.byStage, 'Discovery', 'PartnerRenewal'),
    pipe_renewal_intake: getStageCount(matrix.byStage, 'Intake', 'PartnerRenewal'),
    pipe_renewal_pitch: getStageCount(matrix.byStage, 'Pitch', 'PartnerRenewal'),
    pipe_renewal_negotiation: getStageCount(matrix.byStage, 'Negotiation', 'PartnerRenewal'),
    pipe_renewal_signing: getStageCount(matrix.byStage, 'Signing', 'PartnerRenewal'),

    pipe_expansion_discovery: getStageCount(matrix.byStage, 'Discovery', 'Partner_Expansion'),
    pipe_expansion_intake: getStageCount(matrix.byStage, 'Intake', 'Partner_Expansion'),
    pipe_expansion_pitch: getStageCount(matrix.byStage, 'Pitch', 'Partner_Expansion'),
    pipe_expansion_negotiation: getStageCount(matrix.byStage, 'Negotiation', 'Partner_Expansion'),
    pipe_expansion_signing: getStageCount(matrix.byStage, 'Signing', 'Partner_Expansion'),

    pipe_tier1_discovery: toStr(tier1Pipeline.Discovery),
    pipe_tier1_intake: toStr(tier1Pipeline.Intake),
    pipe_tier1_pitch: toStr(tier1Pipeline.Pitch),
    pipe_tier1_negotiation: toStr(tier1Pipeline.Negotiation),
    pipe_tier1_signing: toStr(tier1Pipeline.Signing),

    ls_partner_ref: toStr(leadSources.ls_partner_ref),
    ls_event: toStr(leadSources.ls_event),
    ls_mktg: toStr(leadSources.ls_mktg),
    ls_cold: toStr(leadSources.ls_cold),
    ls_organic: toStr(leadSources.ls_organic),
    ls_other: toStr(leadSources.ls_other),

    events_last_month: toStr(eventsLast.total),
    events_this_month: toStr(eventsThis.total),
    tier1_events: toStr(eventsThis.byTier['Tier 1']),
    tier2_events: toStr(eventsThis.byTier['Tier 2']),
    tier3_events: toStr(eventsThis.byTier['Tier 3']),
    events_last_month_t1: toStr(eventsLast.byTier['Tier 1']),
    events_last_month_t2: toStr(eventsLast.byTier['Tier 2']),
    events_last_month_t3: toStr(eventsLast.byTier['Tier 3']),

    renew_pipeline_discovery: toStr(renewPipeline.Discovery),
    renew_pipeline_intake: toStr(renewPipeline.Intake),
    renew_pipeline_pitch: toStr(renewPipeline.Pitch),
    renew_pipeline_negotiation: toStr(renewPipeline.Negotiation),
    renew_pipeline_signing: toStr(renewPipeline.Signing),
    renew_won: toStr(renewWon),
  }

  // Full lists serialized as JSON arrays → progressed_opps_json /
  // new_opps_json. The form renders dynamic rows from these.
  out.progressed_opps_json = JSON.stringify(
    progressed.map((opp) => ({
      account: opp.accountName,
      name: opp.oppName,
      prior: opp.priorStage ?? '',
      current: opp.currentStage,
      tier: opp.tier ?? '',
    })),
  )
  out.new_opps_json = JSON.stringify(
    newOpps.map((opp) => ({
      account: opp.accountName,
      name: opp.oppName,
      stage: opp.stage,
      source: opp.leadSource ?? '',
      tier: opp.tier ?? '',
    })),
  )

  // Legacy top-2 fields kept populated for the slide preview's benefit —
  // it reads opp1_*/opp2_*/new_opp1_*/new_opp2_* directly. Writing zeros
  // (empty strings) for slots 3+ would require column adds the slide
  // doesn't use, so we stop at 2.
  progressed.slice(0, 2).forEach((opp, i) => {
    const n = i + 1
    out[`opp${n}_account`] = opp.accountName
    out[`opp${n}_name`] = opp.oppName
    out[`opp${n}_prior`] = opp.priorStage ?? ''
    out[`opp${n}_current`] = opp.currentStage
    out[`opp${n}_tier`] = opp.tier ?? ''
  })

  newOpps.slice(0, 2).forEach((opp, i) => {
    const n = i + 1
    out[`new_opp${n}_account`] = opp.accountName
    out[`new_opp${n}_name`] = opp.oppName
    out[`new_opp${n}_stage`] = opp.stage
    out[`new_opp${n}_source`] = opp.leadSource ?? ''
    out[`new_opp${n}_tier`] = opp.tier ?? ''
  })

  return out
}

// =============================================================================
// Public entry point
// =============================================================================

export type SyncResult =
  | {
      ok: true
      fieldsWritten: Record<string, string>
      fieldCount: number
      vertical: Vertical
      verticalSfdc: string
      syncedAt: string
    }
  | { ok: false; error: string }

/**
 * Pull every SFDC-sourced field for a (role, vertical). Returns the field
 * map ready to merge into the form data and hand to `upsertRow`. Returns
 * an `ok: false` shape if the vertical can't be mapped to a SFDC
 * Partner__c picklist value.
 */
export async function pullSalesforceSnapshotForRole(
  role: Role,
  vertical: Vertical,
): Promise<SyncResult> {
  let verticalSfdc: string
  try {
    verticalSfdc = mbrVerticalToSfdc(vertical)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  let fields: Record<string, string>
  try {
    fields =
      role === 'PSM'
        ? await buildPsmFields(vertical, verticalSfdc)
        : await buildPeFields(vertical, verticalSfdc)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Salesforce query failed: ${msg}` }
  }

  return {
    ok: true,
    fieldsWritten: fields,
    fieldCount: Object.keys(fields).length,
    vertical,
    verticalSfdc,
    syncedAt: new Date().toISOString(),
  }
}
```

---

## Env vars summary

### Supabase

| Var | Scope | Where set | If missing |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server (`NEXT_PUBLIC_`) | Vercel environment vars | Client throws on init; all DB calls fail |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server (`NEXT_PUBLIC_`) | Vercel environment vars | Client throws on init; RLS-gated reads fail |
| `SUPABASE_SERVICE_ROLE` | Server-only (no `NEXT_PUBLIC_` prefix) | Vercel environment vars (optional) | Only matters for admin operations that bypass RLS; do not set if not needed |

### Smartsheet

| Var | Scope | Where set | If missing |
|---|---|---|---|
| `SMARTSHEET_API_TOKEN` | Server-only | Vercel environment vars | `token()` throws immediately; all roster reads and Smartsheet writes fail |

Sheet IDs (`MEMBERS_SHEET_ID`, `APP_ACCESS_SHEET_ID`) are hardcoded numeric constants in `src/lib/sheets.ts`, not env vars.

### Salesforce

All four are server-only (no `NEXT_PUBLIC_` prefix). The refresh token is stored at runtime in the admin's Smartsheet row — it is not an env var.

| Var | Scope | Where set | If missing |
|---|---|---|---|
| `SALESFORCE_CLIENT_ID` | Server-only | Vercel environment vars | `getSalesforceConfig()` throws; OAuth start and all token exchanges fail |
| `SALESFORCE_CLIENT_SECRET` | Server-only | Vercel environment vars | Same as above |
| `SALESFORCE_LOGIN_URL` | Server-only | Vercel environment vars | Defaults to `https://wgu.my.salesforce.com`; safe to omit for WGU sage org |
| `SALESFORCE_REDIRECT_URI` | Server-only | Vercel environment vars | Defaults to the mbr-builder Vercel URL; must be set explicitly in other apps |

---

## `server-only` discipline

Every file documented here — `smartsheet.ts`, `salesforce.ts`, `salesforce-query.ts`, `salesforce-sync.ts` — begins with `import 'server-only'`. The browser only ever sees the two `NEXT_PUBLIC_` Supabase vars; it never receives the Smartsheet API token, Salesforce client secret, or Salesforce refresh token. The `server-only` import makes this structural: Next.js will throw a build-time error if any of these files is accidentally imported into a client component, stopping a secret leak before it reaches production.

---

See also: [auth.md](./auth.md) for the master-roster.ts paste that feeds `getCurrentUser()`, [deploy.md](./deploy.md) for env var setup on Vercel, [archetypes-deep-app.md](./archetypes-deep-app.md) for `salesforce-sync.ts` consumers in MBR Builder.
