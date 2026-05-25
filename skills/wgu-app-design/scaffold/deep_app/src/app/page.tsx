import { redirect } from 'next/navigation'
import { getAuthState } from '@/lib/auth'
import HomeClient from './home-client'

/**
 * Home page (server). Routes around three signed-in states:
 *   - guest             → /login
 *   - signed in, no row → /no-access
 *   - signed in, active → render HomeClient with the profile baked in
 *
 * The profile pre-fills the picker and trims the role buttons to the
 * user's primary role(s) so most contributors can navigate in one click.
 *
 * __APP_NAME__: Replace `HomeClient` with your own landing page component.
 * The auth gate pattern here is the important structural piece to keep.
 *
 * For the full MBR Builder reference implementation, see:
 *   `skills/wgu-app-design/references/archetypes-deep-app.md`
 */
export default async function HomePage() {
  const state = await getAuthState()
  if (state.kind === 'guest') redirect('/login')
  if (state.kind === 'no-profile') redirect('/no-access')

  const { user } = state
  return (
    <HomeClient
      user={{
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isVerticalDirector: user.isVerticalDirector,
        vertical: user.vertical,
        primaryRoles: user.primaryRoles,
        avatarUrl: user.avatarUrl,
        masterProfile: user.masterProfile,
      }}
    />
  )
}
