import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { APPS } from '@/lib/apps'
import { getLatestHealth } from '@/lib/health'
import { AppShell } from '@/components/AppShell'
import { LauncherProvider } from '@/components/AppLauncher'
import { HomeBento } from '@/components/HomeBento'
import { CommandPalette } from '@/components/CommandPalette'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.isMember) redirect('/no-access')

  const firstName = user.name?.split(' ')[0] ?? null
  const visibleApps = user.isAdmin
    ? APPS
    : APPS.filter((a) => user.accessibleApps.has(a.id as never))
  const healthByApp = await getLatestHealth()

  return (
    <AppShell user={user}>
      <LauncherProvider
        accessibleApps={Array.from(user.accessibleApps)}
        showAll={user.isAdmin}
        healthByApp={healthByApp}
      >
        <main className="page page-wide">
          <HomeBento
            firstName={firstName}
            userFullName={user.name}
            currentEmail={user.email}
            visibleApps={visibleApps}
            healthByApp={healthByApp}
          />

          <CommandPalette visibleApps={visibleApps} />
        </main>

        <footer className="footer">
          <div className="footer-inner">
            <span>&copy; {new Date().getFullYear()} __APP_NAME__.</span>
            <span>One door for every tool.</span>
          </div>
        </footer>
      </LauncherProvider>
    </AppShell>
  )
}
