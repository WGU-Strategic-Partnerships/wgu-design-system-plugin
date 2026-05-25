'use client'

import { initialsFrom, type MasterProfile } from '@/lib/master-profile-shared'

type Size = 'sm' | 'md' | 'lg' | 'xl'
const PX: Record<Size, number> = { sm: 24, md: 32, lg: 64, xl: 128 }

type Props = {
  /**
   * The full master profile, OR a partial subset of avatar fields. Letting
   * callers pass a partial means the editor preview can pass its in-flight
   * draft without constructing a fake email.
   */
  profile: Pick<
    MasterProfile,
    'displayName' | 'avatarKind' | 'avatarEmoji' | 'avatarColor' | 'avatarUrl'
  > | null
  /** Fallback when profile is null or has no display name (usually the email). */
  fallbackName?: string | null
  size?: Size
  className?: string
}

/**
 * Render a user's avatar with three modes:
 *   photo (avatarUrl)  →  emoji + color  →  initials.
 *
 * Portable: also used by the header avatar and the settings preview.
 */
export default function UserAvatar({ profile, fallbackName, size = 'md', className }: Props) {
  const px = PX[size]
  const kind = profile?.avatarKind ?? 'initials'
  const cls = `user-avatar${className ? ' ' + className : ''}`
  const base: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flex: '0 0 auto',
  }

  if (kind === 'photo' && profile?.avatarUrl) {
    return (
      <span className={cls} style={base} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          width={px}
          height={px}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </span>
    )
  }

  if (kind === 'emoji' && profile?.avatarEmoji) {
    return (
      <span
        className={cls}
        style={{
          ...base,
          background: profile.avatarColor ?? 'var(--wgu-blue)',
          fontSize: Math.round(px * 0.55),
          color: '#fff',
          lineHeight: 1,
        }}
        aria-hidden
      >
        {profile.avatarEmoji}
      </span>
    )
  }

  const initials = initialsFrom(profile?.displayName ?? fallbackName ?? '?')
  return (
    <span
      className={cls}
      style={{
        ...base,
        background: profile?.avatarColor ?? 'var(--wgu-blue)',
        fontSize: Math.round(px * 0.4),
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.02em',
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
