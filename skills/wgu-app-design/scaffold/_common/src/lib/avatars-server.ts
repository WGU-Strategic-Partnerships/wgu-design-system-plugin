import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  ALLOWED_AVATAR_TYPES,
  AVATARS_BUCKET,
  MAX_AVATAR_BYTES,
  extensionFor,
  slugifyEmail,
} from './avatars'

/**
 * Server-side avatar upload using the Supabase service-role key. The
 * service role bypasses RLS, so there's no need for storage policies —
 * the bucket is auto-created on first call.
 *
 * Path: `{email-slug}-{timestamp}.{ext}` so each upload writes to a fresh
 * path. Old photos are best-effort deleted in deleteAvatarFromUrl.
 */

let cachedClient: SupabaseClient | null = null
let bucketEnsured = false

function adminClient(): SupabaseClient {
  if (cachedClient) return cachedClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL env var is required')
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY env var is required for avatar uploads',
    )
  }
  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/**
 * Idempotent. Once the bucket is confirmed in this process the flag
 * short-circuits future calls; the API call only happens once per
 * cold-start.
 */
async function ensureBucket() {
  if (bucketEnsured) return
  const client = adminClient()
  const { data } = await client.storage.getBucket(AVATARS_BUCKET)
  if (data) {
    bucketEnsured = true
    return
  }
  const { error: createErr } = await client.storage.createBucket(AVATARS_BUCKET, {
    public: true,
    allowedMimeTypes: Array.from(ALLOWED_AVATAR_TYPES),
    fileSizeLimit: MAX_AVATAR_BYTES,
  })
  if (createErr && !createErr.message.toLowerCase().includes('already exists')) {
    throw new Error(`Could not create avatars bucket: ${createErr.message}`)
  }
  bucketEnsured = true
}

export type UploadAvatarInput = { email: string; file: File }

export async function uploadAvatar({
  email,
  file,
}: UploadAvatarInput): Promise<{ url: string; path: string }> {
  if (!file || file.size === 0) throw new Error('No image selected')
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as never)) {
    throw new Error(
      `Unsupported image type: ${file.type || 'unknown'}. Use PNG, JPEG, WebP, or GIF.`,
    )
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error(
      `Image too large — max 2 MB. Got ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    )
  }

  await ensureBucket()

  const slug = slugifyEmail(email)
  if (!slug) throw new Error(`Invalid email for avatar path: ${email}`)
  const path = `${slug}-${Date.now()}.${extensionFor(file.type)}`

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error } = await adminClient().storage.from(AVATARS_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(`Avatar upload failed: ${error.message}`)

  const { data } = adminClient().storage.from(AVATARS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deleteAvatarFromUrl(previousUrl: string | null | undefined): Promise<void> {
  if (!previousUrl) return
  const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`
  const i = previousUrl.indexOf(marker)
  if (i < 0) return
  const path = previousUrl.slice(i + marker.length)
  if (!path) return
  try {
    await adminClient().storage.from(AVATARS_BUCKET).remove([path])
  } catch (err) {
    console.warn('[avatars] orphan cleanup failed for', path, err)
  }
}
