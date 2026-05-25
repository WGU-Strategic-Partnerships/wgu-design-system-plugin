'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Activity, LogOut, Shield, UserCog } from 'lucide-react'
import { signOut } from '@/app/actions'
import type { MasterProfile } from '@/lib/master-profile'
import UserAvatar from './UserAvatar'

type Props = {
  name: string | null
  email: string
  /** Full master profile so the header avatar matches the user's chosen
   *  mode (photo / emoji / initials). Null on first-visit users. */
  profile: MasterProfile | null
  isAdmin?: boolean
}

/**
 * Header avatar that opens a small dropdown. The "Profile settings" entry
 * navigates to /settings/profile (which replaces the old photo-only modal).
 * Sign out and admin links live in the same dropdown.
 */
export function UserMenu({ name, email, profile, isAdmin = false }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: 0,
          background: 'transparent',
          border: 0,
          borderRadius: 999,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UserAvatar profile={profile} fallbackName={name ?? email} size="md" />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9 }}
            aria-hidden
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-monday-lg)',
              minWidth: 240,
              padding: 12,
              zIndex: 10,
              fontFamily: 'var(--font-body)',
            }}
          >
            <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--divider-soft)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg-1)' }}>
                {profile?.displayName ?? name ?? email}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{email}</div>
            </div>
            <div style={{ paddingTop: 8 }}>
              <Link
                href="/settings/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                style={menuItem('var(--fg-2)')}
              >
                <UserCog size={14} />
                <span>Profile settings</span>
              </Link>
              {isAdmin && (
                <>
                  <div style={menuDivider} aria-hidden />
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    style={menuItem('var(--wgu-blue)')}
                  >
                    <Shield size={14} />
                    <span>Manage access</span>
                  </Link>
                  <Link
                    href="/admin/usage"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    style={menuItem('var(--wgu-blue)')}
                  >
                    <Activity size={14} />
                    <span>Usage dashboard</span>
                  </Link>
                  <div style={menuDivider} aria-hidden />
                </>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => startTransition(() => signOut())}
                disabled={pending}
                style={menuItem('var(--neg)')}
              >
                <LogOut size={14} />
                <span>{pending ? 'Signing out…' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function menuItem(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    borderRadius: 6,
    color,
    fontSize: 13,
    fontWeight: 500,
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    textDecoration: 'none',
  }
}

const menuDivider: React.CSSProperties = {
  height: 1,
  background: 'var(--divider-soft)',
  margin: '6px 0',
}
