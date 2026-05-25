'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Download, Eye, Loader2, Plus, Trash2, X } from 'lucide-react'
import { APPS, MEMBER_ROLES, type MemberRole } from '@/lib/apps'
import type { AppSlug } from '@/lib/sheets'
import { CATEGORY_ACCENT } from '@/components/AppLauncher'
import {
  adminAddMember,
  adminImportAvatars,
  adminRemoveMember,
  adminSetGrant,
  adminSetRole,
  adminStartViewAs,
} from '@/app/actions'

export type AdminRow = {
  email: string
  displayName: string | null
  addedBy: string | null
  addedAt: string | null
  notes: string | null
  avatarUrl: string | null
  isAdmin: boolean
  /** True when the user is in ADMIN_EMAILS in auth.ts — they keep admin
   *  regardless of the Smartsheet flag. Toggle is still clickable but the
   *  effective status doesn't change. */
  isHardCodedAdmin: boolean
  role: MemberRole | null
  grants: string[]
}

export function AdminClient({
  initialRows,
  currentAdminEmail,
}: {
  initialRows: AdminRow[]
  currentAdminEmail: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState<AdminRow[]>(initialRows)
  const [adding, setAdding] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  // Per-cell pending state so we can show a spinner on the exact checkbox.
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const refresh = () => startTransition(() => router.refresh())

  const onToggleGrant = async (email: string, appSlug: AppSlug, currentlyGranted: boolean) => {
    const key = `${email}|${appSlug}`
    setPendingKey(key)
    setErrorMsg(null)
    // Optimistic update
    setRows((curr) =>
      curr.map((r) =>
        r.email === email
          ? {
              ...r,
              grants: currentlyGranted
                ? r.grants.filter((s) => s !== appSlug)
                : [...r.grants, appSlug],
            }
          : r,
      ),
    )
    try {
      await adminSetGrant(email, appSlug, !currentlyGranted)
      refresh()
    } catch (e) {
      // Rollback
      setRows((curr) =>
        curr.map((r) =>
          r.email === email
            ? {
                ...r,
                grants: currentlyGranted
                  ? [...r.grants, appSlug]
                  : r.grants.filter((s) => s !== appSlug),
              }
            : r,
        ),
      )
      setErrorMsg(e instanceof Error ? e.message : 'Failed to update grant.')
    } finally {
      setPendingKey(null)
    }
  }

  const onStartViewAs = async (email: string) => {
    setPendingKey(`view|${email}`)
    setErrorMsg(null)
    try {
      await adminStartViewAs(email)
      // After cookie is set, send the admin to the home page so they
      // see the launcher exactly as the impersonated user would.
      router.push('/')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to start View as.')
      setPendingKey(null)
    }
  }

  const onChangeRole = async (email: string, nextRole: MemberRole | null) => {
    const key = `role|${email}`
    setPendingKey(key)
    setErrorMsg(null)
    const prevRow = rows.find((r) => r.email === email)
    // Optimistic: update role; grants will be reconciled server-side and
    // we'll refresh to pick up the new checkbox state.
    setRows((curr) => curr.map((r) => (r.email === email ? { ...r, role: nextRole } : r)))
    try {
      await adminSetRole(email, nextRole)
      refresh()
    } catch (e) {
      // Rollback role on failure.
      if (prevRow) {
        setRows((curr) => curr.map((r) => (r.email === email ? { ...r, role: prevRow.role } : r)))
      }
      setErrorMsg(e instanceof Error ? e.message : 'Failed to update role.')
    } finally {
      setPendingKey(null)
    }
  }

  const onRemoveMember = async (email: string) => {
    if (email === currentAdminEmail) {
      setErrorMsg("You can't remove yourself.")
      return
    }
    if (!confirm(`Remove ${email}? This revokes all app grants and locks them out of the launcher.`)) {
      return
    }
    setPendingKey(`remove|${email}`)
    setErrorMsg(null)
    try {
      await adminRemoveMember(email)
      setRows((curr) => curr.filter((r) => r.email !== email))
      refresh()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to remove member.')
    } finally {
      setPendingKey(null)
    }
  }

  return (
    <>
      {errorMsg && (
        <div className="error-text" role="alert" style={{ marginBottom: 16 }}>
          <X size={16} />
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="btn btn-ghost btn-sm">
            Dismiss
          </button>
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--divider-soft)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--wgu-blue)' }}>
              Members
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-3)' }}>
              {rows.length} {rows.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ImportAvatarsButton onDone={refresh} onError={setErrorMsg} />
            <button
              type="button"
              onClick={() => setAdding((a) => !a)}
              className="btn btn-primary btn-sm"
            >
              {adding ? <X size={14} /> : <Plus size={14} />}
              <span>{adding ? 'Cancel' : 'Add member'}</span>
            </button>
          </div>
        </div>

        {adding && (
          <AddMemberForm
            onAdded={() => {
              setAdding(false)
              refresh()
            }}
            onError={setErrorMsg}
          />
        )}

        {/* No overflow wrapper — `position: sticky` on thead cells needs an
            ancestor chain with `overflow: visible` to stick to the viewport.
            Removing the wrapper lets the table scroll horizontally at the
            page level when it exceeds the viewport width. */}
        <div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr>
                <th style={th({ textAlign: 'left', minWidth: 220 })}>Member</th>
                <th style={th({ textAlign: 'left', minWidth: 130 })}>Role</th>
                {APPS.map((a) => (
                  <th
                    key={a.id}
                    style={th({
                      textAlign: 'center',
                      writingMode: 'sideways-lr',
                      minWidth: 36,
                      maxWidth: 36,
                      height: 100,
                      verticalAlign: 'bottom',
                      color: CATEGORY_ACCENT[a.category],
                    })}
                    title={`${a.name} — ${a.category}`}
                  >
                    {a.name}
                  </th>
                ))}
                <th style={th({ textAlign: 'center', width: 70 })}>View</th>
                <th style={th({ textAlign: 'right', width: 40 })}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={APPS.length + 4} style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)' }}>
                    No members yet. Add the first one above.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const grantSet = new Set(r.grants)
                const isRemoving = pendingKey === `remove|${r.email}`
                return (
                  <tr key={r.email} style={{ borderTop: '1px solid var(--divider-soft)' }}>
                    <td style={td()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={r.displayName ?? r.email} src={r.avatarUrl} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--fg-1)' }}>
                            {r.displayName || r.email.split('@')[0]}
                            {r.email === currentAdminEmail && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  color: 'var(--wgu-medium-blue)',
                                  background: 'var(--bg-tinted)',
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-pill)',
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={td({ padding: '6px 8px' })}>
                      {(() => {
                        const roleKey = `role|${r.email}`
                        const rolePending = pendingKey === roleKey
                        return (
                          <select
                            value={r.role ?? ''}
                            onChange={(e) => {
                              const next = e.target.value
                              onChangeRole(
                                r.email,
                                next === '' ? null : (next as MemberRole),
                              )
                            }}
                            disabled={rolePending}
                            title="Setting a role auto-replaces this member's app-access grants with the role's defaults. You can then toggle individual apps below."
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--rule-strong-1)',
                              background: rolePending ? 'var(--bg-muted)' : 'var(--bg-surface)',
                              color: r.role ? 'var(--fg-1)' : 'var(--fg-3)',
                              fontFamily: 'var(--font-body)',
                              fontSize: 13,
                              cursor: rolePending ? 'wait' : 'pointer',
                            }}
                          >
                            <option value="">— No role —</option>
                            {MEMBER_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )
                      })()}
                    </td>
                    {APPS.map((a) => {
                      const granted = grantSet.has(a.id)
                      const key = `${r.email}|${a.id}`
                      const cellPending = pendingKey === key
                      // Admins always have implicit access — show ghosted check, disable toggle
                      if (r.isAdmin) {
                        return (
                          <td key={a.id} style={td({ textAlign: 'center', padding: '6px 4px', background: 'rgba(0, 40, 85, 0.04)' })}>
                            <span
                              title="Master admin — implicit access to every tile"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: '1px dashed var(--rule-strong-1)',
                                color: CATEGORY_ACCENT[a.category],
                              }}
                            >
                              <Check size={14} />
                            </span>
                          </td>
                        )
                      }
                      return (
                        <td key={a.id} style={td({ textAlign: 'center', padding: '6px 4px' })}>
                          <button
                            type="button"
                            aria-label={`${granted ? 'Revoke' : 'Grant'} ${a.name} for ${r.email}`}
                            aria-pressed={granted}
                            disabled={cellPending}
                            onClick={() => onToggleGrant(r.email, a.id as AppSlug, granted)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 4,
                              border: granted
                                ? `1px solid ${CATEGORY_ACCENT[a.category]}`
                                : '1px solid var(--rule-strong-1)',
                              background: granted ? CATEGORY_ACCENT[a.category] : 'var(--bg-surface)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: granted ? 'var(--wgu-white)' : 'transparent',
                              padding: 0,
                            }}
                          >
                            {cellPending ? <Loader2 size={12} className="spin" /> : granted ? <Check size={14} /> : null}
                          </button>
                        </td>
                      )
                    })}
                    <td style={td({ textAlign: 'center', padding: '6px 4px' })}>
                      {r.email !== currentAdminEmail && (
                        <button
                          type="button"
                          onClick={() => onStartViewAs(r.email)}
                          disabled={pendingKey === `view|${r.email}`}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px 8px' }}
                          title={`View the launcher as ${r.displayName ?? r.email} would see it`}
                          aria-label={`View as ${r.email}`}
                        >
                          {pendingKey === `view|${r.email}` ? <Loader2 size={14} className="spin" /> : <Eye size={14} />}
                        </button>
                      )}
                    </td>
                    <td style={td({ textAlign: 'right' })}>
                      <button
                        type="button"
                        onClick={() => onRemoveMember(r.email)}
                        disabled={isRemoving || r.email === currentAdminEmail}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 8px', color: 'var(--neg)' }}
                        aria-label={`Remove ${r.email}`}
                      >
                        {isRemoving ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="help-text" style={{ marginTop: 0 }}>
        Grants take effect on the user&rsquo;s next page load. The launcher itself reads the roster
        live; per-app rosters in individual tools still need to be updated separately for now.
      </p>
    </>
  )
}

function AddMemberForm({
  onAdded,
  onError,
}: {
  onAdded: () => void
  onError: (msg: string) => void
}) {
  const [pending, setPending] = useState(false)

  const onSubmit = async (formData: FormData) => {
    setPending(true)
    try {
      await adminAddMember(formData)
      onAdded()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to add member.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      action={onSubmit}
      style={{
        padding: 20,
        background: 'var(--bg-tinted)',
        borderBottom: '1px solid var(--divider-soft)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: 12,
        alignItems: 'end',
      }}
    >
      <Field label="Email">
        <input
          type="email"
          name="email"
          required
          placeholder="firstname.lastname@example.com"
          className="input"
          autoFocus
        />
      </Field>
      <Field label="Display name">
        <input
          type="text"
          name="displayName"
          required
          placeholder="First Last"
          className="input"
        />
      </Field>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
        <span>{pending ? 'Adding…' : 'Add'}</span>
      </button>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Notes (optional)">
          <input
            type="text"
            name="notes"
            placeholder="e.g. partner exec, joined May 2026"
            className="input"
          />
        </Field>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 12,
          color: 'var(--fg-1)',
          marginBottom: 6,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initials = getInitials(name)
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 999,
        background: 'var(--wgu-blue)',
        color: 'var(--wgu-white)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: '0.02em',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initials
      )}
    </span>
  )
}

function getInitials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim()
  if (cleaned.includes('@')) {
    const [local] = cleaned.split('@')
    const parts = local.split(/[._-]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return local.slice(0, 2).toUpperCase()
  }
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return cleaned.slice(0, 2).toUpperCase()
}

function ImportAvatarsButton({
  onDone,
  onError,
}: {
  onDone: () => void
  onError: (msg: string) => void
}) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    if (!confirm('Pull avatars from linked app rosters into __APP_NAME__? Photos already set here are skipped.')) {
      return
    }
    startTransition(async () => {
      try {
        const res = await adminImportAvatars()
        if (res.errors.length) {
          onError(`Imported ${res.imported}, skipped ${res.skipped}. Errors: ${res.errors.join('; ')}`)
        } else {
          onError('') // clear any prior error — using onError as a status sink keeps the API minimal
          alert(`Imported ${res.imported} avatars, skipped ${res.skipped}.`)
        }
        onDone()
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Import failed.')
      }
    })
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn btn-secondary btn-sm">
      {pending ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
      <span>{pending ? 'Importing…' : 'Import avatars'}</span>
    </button>
  )
}

function th(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--fg-3)',
    padding: '12px 16px',
    background: 'var(--bg-page)',
    borderBottom: '1px solid var(--divider-soft)',
    // Stick the header row to the viewport top, just below the app-header
    // (60px tall). z-index 5 keeps the row above body cells when scrolling
    // long member lists. Box-shadow below the row hides the top edge of
    // tbody cells as they pass beneath.
    position: 'sticky',
    top: 60,
    zIndex: 5,
    boxShadow: 'inset 0 -1px 0 var(--divider-soft)',
    ...extra,
  }
}

function td(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: '12px 16px',
    color: 'var(--fg-1)',
    verticalAlign: 'middle',
    ...extra,
  }
}
