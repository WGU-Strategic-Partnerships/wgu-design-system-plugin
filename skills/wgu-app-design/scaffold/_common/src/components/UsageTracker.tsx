'use client'

import { useEffect } from 'react'

/**
 * Drops the usage tracker into every app in the launcher. Sets the
 * window context so the tracking script knows who and which app, then
 * injects the script tag if it isn't already on the page. Client
 * component so it works inside both server- and client-rendered headers.
 *
 * The track.js script itself wires up popstate / pushState listeners,
 * so it only needs to load once per session — SPA navigations are
 * picked up automatically.
 *
 * Replace SRC with your own tracking endpoint URL, or remove this
 * component if you don't need usage tracking.
 */
export function UsageTracker({
  app,
  email,
  name,
}: {
  app: string
  email: string | null | undefined
  name: string | null | undefined
}) {
  useEffect(() => {
    if (!email) return
    ;(window as unknown as { __launcher_ctx?: object }).__launcher_ctx = {
      app,
      email,
      name: name ?? null,
    }
    // Replace this URL with your own tracking script endpoint.
    const SRC = 'https://your-launcher-domain.example/track.js'
    if (document.querySelector(`script[src="${SRC}"]`)) return
    const s = document.createElement('script')
    s.src = SRC
    s.async = true
    document.head.appendChild(s)
  }, [app, email, name])

  return null
}
