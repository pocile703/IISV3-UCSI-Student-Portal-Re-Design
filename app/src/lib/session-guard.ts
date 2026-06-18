import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Wraps auth() with the same isActive + sessionVersion DB revalidation that
// (portal)/layout.tsx performs on page renders. Call this at the top of every
// Server Action so stale JWTs (deactivated account, role change) cannot invoke
// mutations even when the layout is bypassed.
export async function getValidatedSession() {
  const session = await auth()
  if (!session) redirect('/login')

  const userId = session.user?.id
  if (!userId) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, sessionVersion: true },
  })

  if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== session.user.sessionVersion) {
    redirect('/login')
  }

  return session
}
