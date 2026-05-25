import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAllowedEmail, isAdminEmail } from '@/lib/auth'
import { isMember } from '@/lib/master-roster'

/**
 * Shown to signed-in @wgu.edu users who aren't on the master roster yet.
 * If the user IS on the roster (or is the hard-coded admin), bounce them
 * back to the home page so they don't get stuck here.
 */
export default async function NoAccessPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAllowedEmail(user.email)) redirect('/login')
  if (isAdminEmail(user.email) || (await isMember(user.email!))) redirect('/')

  return (
    <div className="auth-bg">
      <div className="card card-padded-lg" style={{ maxWidth: 480, width: '100%' }}>
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
          Access pending
        </h1>
        <p className="page-sub">
          You&rsquo;re signed in as <strong style={{ color: 'var(--fg-1)' }}>{user.email}</strong>,
          but you haven&rsquo;t been added to __APP_NAME__ yet. Reach out to your
          administrator to request access and you&rsquo;ll see the toolset on your next sign-in.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Switch account
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
