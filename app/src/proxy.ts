// Edge-runtime proxy — no Prisma calls (edge cannot use the pg adapter).
// isActive + sessionVersion revalidation happens in (portal)/layout.tsx (per render)
// and lib/session-guard.ts (per Server Action). Read raw JWT claims via getToken.
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { Role } from '@/types/user'

// Where each role lands when authentication succeeds.
const ROLE_HOME: Record<Role, string> = {
  student: '/dashboard',
  lecturer: '/lecturer',
  admin: '/admin',
}

function roleHome(role: Role | undefined): string {
  return role ? (ROLE_HOME[role] ?? '/dashboard') : '/login'
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const role = token?.role as Role | undefined

  // No session → redirect to /login with callbackUrl
  if (!token) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', `${nextUrl.pathname}${nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  const path = nextUrl.pathname

  // Student-only routes
  const isStudentRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/academic') ||
    path.startsWith('/timetable') ||
    path.startsWith('/finance') ||
    path.startsWith('/classes') ||
    path.startsWith('/feedback') ||
    path.startsWith('/profile')

  if (isStudentRoute && role !== 'student') {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl.origin))
  }

  // Lecturer-only routes — admin may access /lecturer/attendance/* for attendance override.
  if (path.startsWith('/lecturer')) {
    const isAdminAttendanceOverride =
      role === 'admin' && path.startsWith('/lecturer/attendance')
    if (role !== 'lecturer' && !isAdminAttendanceOverride) {
      return NextResponse.redirect(new URL(roleHome(role), nextUrl.origin))
    }
  }

  // Admin-only routes
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(roleHome(role), nextUrl.origin))
  }

  // M2: annotate the forwarded request with the path so the portal layout
  // can enforce role-to-route as defense-in-depth (layout reads x-invoke-path).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-invoke-path', path)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/academic/:path*',
    '/timetable/:path*',
    '/finance/:path*',
    '/classes/:path*',
    '/feedback/:path*',
    '/profile/:path*',
    '/lecturer/:path*',
    '/admin/:path*',
  ],
}
