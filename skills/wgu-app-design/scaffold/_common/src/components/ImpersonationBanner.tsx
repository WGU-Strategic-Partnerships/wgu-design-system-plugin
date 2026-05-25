'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, X } from 'lucide-react'
import { adminStopViewAs } from '@/app/actions'

/**
 * Sticky banner shown across every wgu-tools page while an admin has
 * "View as" turned on. The actor is the real admin; the visible
 * launcher reflects the impersonated member.
 */
export function ImpersonationBanner({
  viewingAs,
  actor,
}: {
  viewingAs: { email: string; name: string | null }
  actor: { email: string; name: string | null }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const stop = () => {
    startTransition(async () => {
      await adminStopViewAs()
      router.push('/admin')
      router.refresh()
    })
  }

  const targetLabel = viewingAs.name ?? viewingAs.email.split('@')[0]
  const actorLabel = actor.name ?? actor.email.split('@')[0]

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--wgu-blue)',
        color: 'var(--wgu-white)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 13,
        letterSpacing: '0.01em',
      }}
    >
      <Eye size={14} aria-hidden />
      <span>
        Viewing as <strong style={{ fontWeight: 700 }}>{targetLabel}</strong>
        <span style={{ color: 'var(--fg-on-dark-2)', marginLeft: 8 }}>
          (signed in as {actorLabel})
        </span>
      </span>
      <button
        type="button"
        onClick={stop}
        disabled={pending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'var(--wgu-white)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.02em',
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        <X size={12} />
        <span>{pending ? 'Stopping…' : 'Stop viewing'}</span>
      </button>
    </div>
  )
}
