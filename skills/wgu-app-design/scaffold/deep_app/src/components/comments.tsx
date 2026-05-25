'use client'

/**
 * Comments thread component — renders a list of discussion comments and a
 * compose box. Generic: the only MBR-specific piece was `Role` (now a plain
 * `string`) and the `postComment` / `DisplayComment` types (inlined below).
 *
 * __APP_NAME__: wire `postComment` to your own API / server action and
 * update `DisplayComment` to match your schema. The UI is app-neutral.
 *
 * Derived from MBR Builder src/components/comments.tsx with these changes:
 *   - `Role` type from @/lib/mbr-sheets replaced with `string`
 *   - `postComment` and `DisplayComment` imports from @/app/actions replaced
 *     with local stubs; implement the real versions in your own actions file.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Types — replace with imports from your own actions file once implemented.
// ---------------------------------------------------------------------------

export type DisplayComment = {
  discussionId: number
  commentId: number
  authorEmail: string | null
  /** __APP_NAME__: rename roles to match your access model. */
  authorRole: 'Director' | 'Manager' | null
  body: string
  createdAt: string | null
}

/**
 * __APP_NAME__: replace with your real server action.
 * This stub throws so any mistaken call surfaces clearly in dev.
 */
async function postComment(_input: {
  role: string
  rowId: number
  text: string
}): Promise<{ ok: true }> {
  throw new Error('__APP_NAME__: postComment is not implemented. Wire up your own server action.')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  /** __APP_NAME__: change to match your role enum or remove if not needed. */
  role: string
  rowId: number | null
  comments: DisplayComment[]
  currentUserEmail: string
  isAdmin: boolean
}

export default function Comments({ role, rowId, comments, currentUserEmail, isAdmin }: Props) {
  const [draft, setDraft] = useState('')
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()

  const canPost = rowId != null

  const submit = () => {
    if (!canPost) return
    const text = draft.trim()
    if (!text) return
    setErr(null)
    startTransition(async () => {
      try {
        await postComment({ role, rowId: rowId!, text })
        setDraft('')
        router.refresh()
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      }
    })
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--wgu-blue)', margin: 0 }}>
          Comments
        </h3>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {!canPost && (
        <div
          style={{
            background: '#FFF8E1',
            border: '1px solid #F0CC55',
            color: '#7A5800',
            padding: '10px 12px',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          Save the submission first, then you can post comments.
        </div>
      )}

      {comments.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px dashed var(--border-soft)',
            borderRadius: 8,
            padding: '20px 16px',
            textAlign: 'center',
            color: 'var(--fg-3)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          No comments yet.{' '}
          {isAdmin ? 'Ask the contributor a question below.' : 'Wait for an admin to comment.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {comments.map((c) => {
            const isMe = c.authorEmail?.toLowerCase() === currentUserEmail.toLowerCase()
            const tagBg =
              c.authorRole === 'Director' ? 'var(--wgu-medium-blue)' : 'var(--wgu-sky-blue)'
            return (
              <div
                key={c.commentId}
                style={{
                  background: isMe ? '#F4FBE9' : '#fff',
                  border: `1px solid ${isMe ? 'var(--wgu-lime)' : 'var(--border-soft)'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {c.authorRole && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        background: tagBg,
                        color: '#fff',
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}
                    >
                      {c.authorRole}
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--wgu-blue)' }}>
                    {c.authorEmail ?? 'Unknown'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--fg-1)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {c.body}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canPost && (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            padding: 14,
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isAdmin
                ? 'Ask the contributor a question, request more context…'
                : 'Reply to the admin…'
            }
            rows={3}
            disabled={pending}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-input)',
              borderRadius: 6,
              fontFamily: 'inherit',
              fontSize: 14,
              color: 'var(--wgu-blue)',
              background: '#fff',
              resize: 'vertical',
              minHeight: 70,
              lineHeight: 1.4,
            }}
          />
          {err && (
            <div
              style={{
                marginTop: 8,
                background: '#fff1f1',
                border: '1px solid #fbcaca',
                color: 'var(--status-negative)',
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {err}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
              Posting as <strong>{currentUserEmail}</strong>
              {isAdmin ? ' · Admin' : ''}
            </span>
            <button
              onClick={submit}
              disabled={pending || !draft.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 0,
                background: 'var(--wgu-medium-blue)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: pending || !draft.trim() ? 'not-allowed' : 'pointer',
                opacity: pending || !draft.trim() ? 0.5 : 1,
              }}
            >
              {pending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
