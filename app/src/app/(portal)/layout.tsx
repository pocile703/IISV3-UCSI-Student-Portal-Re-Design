import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Role } from '@/types/user'
import { prisma } from '@/lib/prisma'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { SkipToMain } from '@/components/layout/SkipToMain'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

// Student-route prefixes — keep in sync with proxy.ts isStudentRoute check.
// /lecturer/** is lecturer-only; /admin/** is admin-only (both in proxy.ts and here).
const STUDENT_PREFIXES = ['/dashboard', '/academic', '/timetable', '/finance', '/classes', '/feedback', '/requests', '/profile']

function roleHome(role: Role): string {
  if (role === 'admin') return '/admin'
  if (role === 'lecturer') return '/lecturer'
  return '/dashboard'
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  // N2: fail-closed — never default to 'student' on a missing/malformed role claim.
  const role = session.user.role as Role | undefined
  if (!role) redirect('/login')

  // M2: Defense-in-depth role-to-route check using the path forwarded by
  // middleware (proxy.ts sets x-invoke-path on every authorised pass-through).
  // When middleware is bypassed this header is absent; page-level guards (M3)
  // remain the backstop.
  const invokedPath = (await headers()).get('x-invoke-path') ?? ''
  if (invokedPath) {
    const isStudentRoute  = STUDENT_PREFIXES.some(p => invokedPath.startsWith(p))
    const isAdminRoute    = invokedPath.startsWith('/admin')
    const isLecturerRoute = invokedPath.startsWith('/lecturer')
    if (isStudentRoute  && role !== 'student')                        redirect(roleHome(role))
    if (isLecturerRoute && role !== 'lecturer')                        redirect(roleHome(role))
    if (isAdminRoute    && role !== 'admin')                          redirect(roleHome(role))
  }

  // S1/S2: Re-validate sessionVersion and isActive on every portal request.
  // Catches admin role-changes and account deactivations before the 24h JWT expires.
  const dbUser = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isActive: true, sessionVersion: true },
      })
    : null
  if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== session.user.sessionVersion) {
    redirect('/login')
  }

  const userName = session.user.name ?? 'User'

  return (
    <LayoutProvider>
      <SkipToMain />
      <div className="flex h-screen flex-col overflow-hidden">
        <TopBar role={role} userName={userName} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar role={role} />
          <MobileDrawer role={role} />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto bg-[--bg-base] focus:outline-none"
          >
            <div className="mx-auto w-full max-w-[1280px] px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutProvider>
  )
}
