// API Route Handler auth guard.
//
// CRITICAL: The proxy.ts middleware matcher covers page routes only.
// Routes under app/api/** receive NO middleware protection.
// Every Route Handler must call requireApiAuth() (or requireApiRole()) as its
// first statement before processing any request body or params.
//
// Usage:
//   export async function GET(req: NextRequest) {
//     const guard = await requireApiAuth()
//     if (guard instanceof Response) return guard        // 401/403 — return immediately
//     const { userId, role, lecturerId } = guard
//     // ... handler logic
//   }

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/types/user'

export type ApiGuardResult = {
  userId: string
  role: Role
  sessionVersion: number
  studentId?: string
  lecturerId?: string
}

// Validates session existence + isActive + sessionVersion (same chain as portal
// layout + session-guard.ts). Returns the typed session data or a ready-to-return
// 401/403 Response — caller checks `instanceof Response` and returns it immediately.
export async function requireApiAuth(): Promise<ApiGuardResult | Response> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true, sessionVersion: true },
  })

  if (!dbUser || !dbUser.isActive) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (dbUser.sessionVersion !== session.user.sessionVersion) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return {
    userId,
    role: session.user.role,
    sessionVersion: session.user.sessionVersion,
    studentId: session.user.studentId,
    lecturerId: session.user.lecturerId,
  }
}

// Convenience wrapper that also asserts a specific role.
export async function requireApiRole(role: Role): Promise<ApiGuardResult | Response> {
  const result = await requireApiAuth()
  if (result instanceof Response) return result
  if (result.role !== role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return result
}
