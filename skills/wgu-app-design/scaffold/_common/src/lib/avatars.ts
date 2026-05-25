/**
 * Profile-photo helpers.
 *
 * Architecture: the browser hands the picked File to a server action. The
 * server uploads via the Supabase service-role key — which bypasses RLS,
 * auto-creates the bucket on first call, and removes the need for any
 * manual SQL setup in Supabase.
 *
 * Constants are exported for both client (validation) and server (upload)
 * to share. The server-only helpers are below the constants block.
 */

export const AVATARS_BUCKET = 'avatars'
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024
export const ALLOWED_AVATAR_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const

export type AvatarMime = (typeof ALLOWED_AVATAR_TYPES)[number]

export function slugifyEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/png':  return 'png'
    case 'image/jpeg': return 'jpg'
    case 'image/webp': return 'webp'
    case 'image/gif':  return 'gif'
    default:           return 'bin'
  }
}

export function validateAvatarFile(file: File): string | null {
  if (!file || file.size === 0) return 'No image selected.'
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as AvatarMime)) {
    return `Unsupported image type: ${file.type || 'unknown'}. Use PNG, JPEG, WebP, or GIF.`
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return `Image too large — max 2 MB. Got ${(file.size / 1024 / 1024).toFixed(1)} MB.`
  }
  return null
}
