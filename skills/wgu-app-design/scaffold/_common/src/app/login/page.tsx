'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

const ERROR_MESSAGES: Record<string, string> = {
  domain:
    "That account isn't in the @wgu.edu domain. Use your university Google account to continue.",
  oauth: 'Sign-in failed. Please try again.',
  exchange: "Couldn't complete sign-in. Please try again.",
}

export default function LoginPage() {
  return (
    <div className="auth-bg">
      <div className="card card-padded-lg" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Image
            src="/wgu-logo.png"
            alt="WGU"
            width={120}
            height={55}
            priority
            style={{ height: 44, width: 'auto', display: 'block' }}
          />
        </div>
        <p className="page-eyebrow">WGU Strategic Partnerships</p>
        <h1 className="page-title" style={{ fontSize: 28 }}>
          __APP_NAME__
        </h1>
        <p className="page-sub">
          Sign in with your WGU Google account to open the toolset.
        </p>

        <Suspense fallback={<DisabledGoogleButton />}>
          <SignInButton />
        </Suspense>

        <p className="help-text" style={{ marginTop: 18 }}>
          Use your <strong style={{ color: 'var(--fg-1)' }}>@wgu.edu</strong> account.
        </p>
      </div>
    </div>
  )
}

function DisabledGoogleButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="btn btn-secondary btn-lg"
      style={{ width: '100%' }}
    >
      <GoogleIcon />
      <span>Sign in with Google</span>
    </button>
  )
}

function SignInButton() {
  const params = useSearchParams()
  const errorKey = params.get('error')
  const errorDetail = params.get('detail')
  const [loading, setLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  const onSignIn = async () => {
    setLoading(true)
    setSignInError(null)
    const supabase = createSupabaseBrowserClient()
    // Stash `next` in a short-lived cookie so the OAuth callback can pick
    // it up after the round-trip. Avoids putting a variable URL in the
    // Supabase allowlist. Domain `.wgu.tools` in prod lets the callback
    // (on wgu.tools) read a cookie set by any subdomain that redirected
    // here. SameSite=Lax keeps it valid through the OAuth redirect chain.
    const nextParam = params.get('next')
    if (nextParam && nextParam !== '/') {
      const isProd = window.location.hostname.endsWith('wgu.tools')
      const domain = isProd ? '; Domain=.wgu.tools; Secure' : ''
      document.cookie = `auth_next=${encodeURIComponent(nextParam)}; Path=/; Max-Age=600; SameSite=Lax${domain}`
    }
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { hd: 'wgu.edu' },
      },
    })
    if (error) {
      setSignInError(error.message)
      setLoading(false)
    }
  }

  const message = signInError ?? (errorKey ? ERROR_MESSAGES[errorKey] ?? 'Sign-in failed.' : null)

  return (
    <>
      <button
        type="button"
        onClick={onSignIn}
        disabled={loading}
        className="btn btn-secondary btn-lg"
        style={{ width: '100%' }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spin" />
            <span>Signing you in…</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>Sign in with Google</span>
          </>
        )}
      </button>

      {message && (
        <div className="error-text" role="alert">
          <AlertCircle size={16} />
          <div style={{ flex: 1 }}>
            <div>{message}</div>
            {errorDetail && (
              <div
                style={{
                  marginTop: 4,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  opacity: 0.8,
                  wordBreak: 'break-word',
                }}
              >
                {errorDetail}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
