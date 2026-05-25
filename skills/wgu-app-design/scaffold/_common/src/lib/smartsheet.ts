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
