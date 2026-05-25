'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AVATAR_COLOR_PALETTE,
  AVATAR_EMOJI_SUGGESTIONS,
  initialsFrom,
  type AvatarKind,
  type MasterProfile,
} from '@/lib/master-profile-shared'
import UserAvatar from '@/components/UserAvatar'
import {
  clearProfilePhoto,
  saveProfile,
  uploadProfilePhotoAndSave,
} from '@/app/actions'

type DraftProfile = Omit<MasterProfile, 'email'>

type Props = {
  email: string
  googleName: string | null
  initialProfile: MasterProfile
  isImpersonating: boolean
}

export function ProfileEditor({ email, googleName, initialProfile, isImpersonating }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState<DraftProfile>(toDraft(initialProfile))
  const [draft, setDraft] = useState<DraftProfile>(toDraft(initialProfile))
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft)
  const disabled = pending || isImpersonating

  function update<K extends keyof DraftProfile>(key: K, value: DraftProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const result = await saveProfile({
        displayName: draft.displayName,
        avatarKind: draft.avatarKind,
        avatarEmoji: draft.avatarEmoji,
        avatarColor: draft.avatarColor,
      })
      if (!result.ok) {
        setMessage({ kind: 'err', text: result.error })
        return
      }
      const next = toDraft(result.profile)
      setSaved(next)
      setDraft(next)
      setMessage({ kind: 'ok', text: 'Profile saved.' })
      router.refresh()
    })
  }

  function handlePhotoUpload(file: File) {
    setMessage(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('photo', file)
      const result = await uploadProfilePhotoAndSave(fd)
      if (!result.ok) {
        setMessage({ kind: 'err', text: result.error })
        return
      }
      const next = toDraft(result.profile)
      setSaved(next)
      setDraft(next)
      setMessage({ kind: 'ok', text: 'Photo uploaded.' })
      router.refresh()
    })
  }

  function handleClearPhoto() {
    if (!confirm('Remove your profile photo? Avatar falls back to initials.')) return
    setMessage(null)
    startTransition(async () => {
      const result = await clearProfilePhoto()
      if (!result.ok) {
        setMessage({ kind: 'err', text: result.error })
        return
      }
      const next = toDraft(result.profile)
      setSaved(next)
      setDraft(next)
      setMessage({ kind: 'ok', text: 'Photo removed.' })
      router.refresh()
    })
  }

  return (
    <main className="page" style={{ maxWidth: 880 }}>
      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">Settings</p>
          <h1 className="page-title">Your profile</h1>
          <p className="page-sub">
            Choose how your name and avatar appear across every WGU.tools app. Saves
            propagate to all apps on the next page load.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!dirty || disabled}
        >
          {pending ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {isImpersonating && (
        <div
          role="status"
          style={{
            margin: '12px 0 16px',
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            background: 'var(--st-warn-bg, #fff5d6)',
            color: 'var(--st-warn-fg, #5b4500)',
            fontSize: 13,
          }}
        >
          You are viewing as another member. Profile edits are disabled until you stop impersonating.
        </div>
      )}

      <div
        className="card"
        style={{
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <UserAvatar profile={draft} fallbackName={googleName ?? email} size="xl" />
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Preview</span>
        </div>

        <div>
          <label className="label" htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            type="text"
            className="input"
            placeholder={googleName ?? email}
            value={draft.displayName ?? ''}
            onChange={(e) => update('displayName', e.target.value || null)}
            disabled={disabled}
            style={{ maxWidth: 420, marginBottom: 16 }}
          />

          <p className="label" style={{ marginBottom: 8 }}>Avatar style</p>
          <KindTabs value={draft.avatarKind} onChange={(k) => update('avatarKind', k)} disabled={disabled} />

          {draft.avatarKind === 'photo' && (
            <PhotoEditor
              avatarUrl={draft.avatarUrl}
              pending={pending}
              disabled={disabled}
              onUpload={handlePhotoUpload}
              onClear={handleClearPhoto}
            />
          )}

          {draft.avatarKind === 'emoji' && (
            <EmojiEditor
              emoji={draft.avatarEmoji}
              color={draft.avatarColor}
              disabled={disabled}
              onEmojiChange={(e) => update('avatarEmoji', e || null)}
              onColorChange={(c) => update('avatarColor', c)}
            />
          )}

          {draft.avatarKind === 'initials' && (
            <InitialsEditor
              source={draft.displayName || googleName || email}
              color={draft.avatarColor}
              disabled={disabled}
              onColorChange={(c) => update('avatarColor', c)}
            />
          )}

          {message && (
            <div
              role="status"
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                background:
                  message.kind === 'ok' ? 'var(--st-saved-bg, #e3f4e2)' : 'var(--st-error-bg, #fde2e2)',
                color: message.kind === 'ok' ? 'var(--st-saved-fg, #1d4d1b)' : 'var(--st-error-fg, #7a1f1f)',
                fontSize: 13,
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function toDraft(p: MasterProfile): DraftProfile {
  return {
    displayName: p.displayName,
    avatarKind: p.avatarKind,
    avatarEmoji: p.avatarEmoji,
    avatarColor: p.avatarColor,
    avatarUrl: p.avatarUrl,
  }
}

// ─── sub-components ─────────────────────────────────────────────────────

function KindTabs({
  value,
  onChange,
  disabled,
}: {
  value: AvatarKind
  onChange: (k: AvatarKind) => void
  disabled: boolean
}) {
  const items: { id: AvatarKind; label: string }[] = [
    { id: 'photo', label: 'Photo' },
    { id: 'emoji', label: 'Emoji + color' },
    { id: 'initials', label: 'Initials' },
  ]
  return (
    <div
      role="tablist"
      aria-label="Avatar style"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            background: value === it.id ? 'var(--wgu-blue)' : 'var(--bg-surface)',
            color: value === it.id ? '#fff' : 'var(--fg-1)',
            border: 0,
            borderRight: i < items.length - 1 ? '1px solid var(--border)' : 0,
            fontSize: 13,
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

function PhotoEditor({
  avatarUrl,
  pending,
  disabled,
  onUpload,
  onClear,
}: {
  avatarUrl: string | null
  pending: boolean
  disabled: boolean
  onUpload: (file: File) => void
  onClear: () => void
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: '0 0 12px' }}>
        PNG, JPEG, WebP, or GIF. 2 MB max. Square crops best.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f)
          if (fileRef.current) fileRef.current.value = ''
        }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
        >
          {pending ? 'Uploading…' : avatarUrl ? 'Replace photo' : 'Upload photo'}
        </button>
        {avatarUrl && (
          <button type="button" className="btn btn-ghost" onClick={onClear} disabled={disabled}>
            Remove photo
          </button>
        )}
      </div>
    </div>
  )
}

function EmojiEditor({
  emoji,
  color,
  disabled,
  onEmojiChange,
  onColorChange,
}: {
  emoji: string | null
  color: string | null
  disabled: boolean
  onEmojiChange: (e: string) => void
  onColorChange: (c: string) => void
}) {
  return (
    <div>
      <label className="label" htmlFor="emoji-input" style={{ marginBottom: 4 }}>Emoji</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          id="emoji-input"
          type="text"
          className="input"
          maxLength={4}
          value={emoji ?? ''}
          onChange={(e) => onEmojiChange(e.target.value)}
          placeholder="🦊"
          disabled={disabled}
          style={{ width: 80, fontSize: 22, textAlign: 'center' }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {AVATAR_EMOJI_SUGGESTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onEmojiChange(e)}
              disabled={disabled}
              aria-label={`Use ${e}`}
              style={{
                fontSize: 18,
                background: emoji === e ? 'var(--bg-muted)' : 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 6px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                lineHeight: 1,
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <p className="label" style={{ marginBottom: 4 }}>Background color</p>
      <ColorSwatches value={color} onChange={onColorChange} disabled={disabled} />
    </div>
  )
}

function InitialsEditor({
  source,
  color,
  disabled,
  onColorChange,
}: {
  source: string
  color: string | null
  disabled: boolean
  onColorChange: (c: string) => void
}) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: '0 0 12px' }}>
        Initials from your display name: <strong style={{ color: 'var(--wgu-blue)' }}>{initialsFrom(source)}</strong>
      </p>
      <p className="label" style={{ marginBottom: 4 }}>Background color</p>
      <ColorSwatches value={color} onChange={onColorChange} disabled={disabled} />
    </div>
  )
}

function ColorSwatches({
  value,
  onChange,
  disabled,
}: {
  value: string | null
  onChange: (c: string) => void
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {AVATAR_COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          disabled={disabled}
          aria-label={`Choose ${c}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: c,
            border: value === c ? '3px solid var(--fg-1)' : '1px solid var(--border)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: 0,
          }}
        />
      ))}
      <input
        type="color"
        value={value ?? '#002855'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        title="Custom color"
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          border: '1px solid var(--border)',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'transparent',
        }}
      />
    </div>
  )
}
