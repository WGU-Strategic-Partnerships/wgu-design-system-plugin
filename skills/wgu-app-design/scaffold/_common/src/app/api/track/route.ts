import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Usage event sink. Every WGU.tools app posts here via /track.js — once
 * on page view, every 30s as a heartbeat, and once on page unload.
 * Writes go through the service-role Supabase client so RLS is bypassed.
 *
 * CORS is wide-open because the script is loaded cross-subdomain on
 * every wgu.tools app. The endpoint is unauthenticated — anyone who
 * knows the URL can fire events. That's acceptable for internal usage
 * telemetry: an attacker could spam events but can't read anything
 * back, and even spammed events are quickly filtered out of the admin
 * dashboard by date range / known-user matching.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const VALID_TYPES = new Set(['view', 'heartbeat', 'unload'])

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string
      name?: string | null
      app?: string
      path?: string
      type?: string
      session?: string
      duration_ms?: number | null
    }

    const email = body.email?.toLowerCase().trim()
    const app = body.app?.trim()
    const type = body.type?.trim()
    const sessionId = body.session?.trim()
    const path = body.path?.slice(0, 1024) ?? '/'
    if (!email || !app || !sessionId || !type || !VALID_TYPES.has(type)) {
      return new NextResponse(null, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    await supabase.from('usage_events').insert({
      user_email: email,
      user_name: body.name ?? null,
      app_slug: app,
      path,
      event_type: type,
      session_id: sessionId,
      duration_ms:
        typeof body.duration_ms === 'number' && body.duration_ms > 0 && body.duration_ms < 5 * 60 * 1000
          ? Math.round(body.duration_ms)
          : null,
    })

    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  } catch (err) {
    console.error('[track] failed:', err)
    return new NextResponse(null, { status: 400, headers: CORS_HEADERS })
  }
}
