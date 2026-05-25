import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/app-shell'

/**
 * Role-scoped page (server component). Auth gate + route param validation.
 *
 * __APP_NAME__: Replace the placeholder content section with your own
 * role-scoped form or data-entry UI. The auth gate, params resolution,
 * and AppShell wrapper are the structural pieces to preserve.
 *
 * For the full MBR Builder reference implementation (which includes a
 * multi-section form, vertical picker, and Smartsheet write-back), see:
 *   `skills/wgu-app-design/references/archetypes-deep-app.md`
 *
 * This stub demonstrates the auth + role validation pattern so the scaffold
 * typechecks. Build your real form on top of FormClient or equivalent.
 */

// TODO: __APP_NAME__: define your own role enum and replace ROLES below.
// In MBR Builder this came from @/lib/mbr-sheets.
const ROLES = ['example'] as const
type Role = (typeof ROLES)[number]

export default async function RolePage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { role: roleParam } = await params
  if (!ROLES.includes(roleParam as Role)) notFound()
  const role = roleParam as Role

  // TODO: __APP_NAME__: resolve any additional route params you need (e.g.
  // month, vertical, fiscal period) from searchParams here.
  const sp = await searchParams
  void sp // suppress unused-variable warning; remove when you use it

  return (
    <AppShell user={user} currentPath={`/role/${role}`}>
      <main className="page">
        <div className="page-header-row">
          <div>
            <div className="page-eyebrow">__APP_NAME__</div>
            <h1 className="page-title">{role}</h1>
          </div>
        </div>

        {/* TODO: __APP_NAME__: replace with your own role-scoped content.
            In MBR Builder this renders <FormClient> which handles the
            multi-section business-review form, month picker, and submit. */}
        <div className="card card-padded">
          <p style={{ color: 'var(--fg-2)', fontStyle: 'italic' }}>
            __APP_NAME__: render your role-scoped content here. See{' '}
            <code>references/archetypes-deep-app.md</code> for the full MBR
            Builder version.
          </p>
        </div>
      </main>
    </AppShell>
  )
}
