import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getMasterProfile } from '@/lib/master-profile'
import { ProfileEditor } from './ProfileEditor'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = (await getMasterProfile(user.email)) ?? {
    email: user.email,
    displayName: user.name,
    avatarKind: 'initials' as const,
    avatarEmoji: null,
    avatarColor: null,
    avatarUrl: user.avatarUrl,
  }

  return (
    <ProfileEditor
      email={user.email}
      googleName={user.name}
      initialProfile={profile}
      isImpersonating={user.impersonator !== null}
    />
  )
}
