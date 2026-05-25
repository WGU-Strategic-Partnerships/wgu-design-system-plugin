/**
 * Shareable subset of master-profile — types, constants, and pure helpers
 * that are safe to import from client components. The Smartsheet I/O
 * lives in master-profile.ts (server-only) and re-exports these.
 */

export type AvatarKind = 'initials' | 'emoji' | 'photo'

export type MasterProfile = {
  email: string
  displayName: string | null
  avatarKind: AvatarKind
  avatarEmoji: string | null
  avatarColor: string | null
  avatarUrl: string | null
}

export const AVATAR_COLOR_PALETTE = [
  '#002855', '#0070F0', '#46B1EF', '#97E152', '#F2A900',
  '#B53A2A', '#7B61FF', '#FF6B9D', '#2D9CDB', '#264468',
] as const

export const AVATAR_EMOJI_SUGGESTIONS = [
  '👋', '🚀', '⭐', '🎯', '💡', '🦊', '🐝', '🦉', '🌊',
  '🌈', '🔥', '✨', '🪐', '🌱', '☀️', '🎨', '📊', '🧭',
] as const

export function initialsFrom(nameOrEmail: string | null): string {
  if (!nameOrEmail) return '?'
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
