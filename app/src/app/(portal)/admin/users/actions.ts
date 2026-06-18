'use server'

// Admin user management mutations:
//   adminCreateUser — create a new User account (+ Lecturer profile if LECTURER role)
//   adminUpdateUser — role change (LECTURER↔ADMIN) and activation/deactivation
//
// Both write paths require admin role (assertAdmin).
// adminUpdateUser increments sessionVersion on every real write to force
// the affected user's existing JWT to become invalid on their next request.
//
// Role-change scope: only LECTURER↔ADMIN. STUDENT changes require profile-row
// creation/deletion (Student has 15+ required fields) — deferred to a future phase.

import bcryptjs from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma, Role } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { userIdSchema } from '@/lib/schemas'
import type { UserPageRow } from '@/types/admin-users'

type ActionState = { error?: string; success?: boolean }

// ─── adminCreateUser ──────────────────────────────────────────────────────────

const createUserSchema = z.object({
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .max(50, 'Username must be 50 characters or fewer')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Username may only contain letters, numbers, dots, hyphens, or underscores',
    ),
  emailInstitutional: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(100, 'Email must be 100 characters or fewer'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  fullName: z.string().trim().max(150, 'Full name must be 150 characters or fewer').optional(),
  staffNumber: z.string().trim().max(30, 'Staff number must be 30 characters or fewer').optional(),
  department: z.string().trim().max(100, 'Department must be 100 characters or fewer').optional(),
})

type CreateUserInput = z.input<typeof createUserSchema>
type CreateUserResult = { success: true; user: UserPageRow } | { success?: false; error: string }

// Creates a User account. For LECTURER role, also creates the linked Lecturer profile
// row in the same $transaction (fullName, staffNumber, department all required).
// For STUDENT role, creates the User row only — the Student profile has 15+ required
// fields that are gathered through a separate enrolment process.
// For ADMIN role, creates the User row only — no profile row is needed.
export async function adminCreateUser(input: CreateUserInput): Promise<CreateUserResult> {
  await assertAdmin()

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const v = parsed.data

  if (v.role === 'LECTURER') {
    if (!v.fullName) return { error: 'Full name is required for lecturers' }
    if (!v.staffNumber) return { error: 'Staff number is required for lecturers' }
    if (!v.department) return { error: 'Department is required for lecturers' }
  }

  const passwordHash = await bcryptjs.hash(v.password, 12)

  try {
    if (v.role === 'LECTURER') {
      const [newUser, newLecturer] = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            username: v.username,
            emailInstitutional: v.emailInstitutional,
            passwordHash,
            role: 'LECTURER',
          },
          select: { id: true, isActive: true, emailInstitutional: true },
        })
        const l = await tx.lecturer.create({
          data: {
            userId: u.id,
            fullName: v.fullName!,
            staffNumber: v.staffNumber!,
            department: v.department!,
          },
          select: { fullName: true, staffNumber: true, department: true },
        })
        return [u, l] as const
      })

      revalidatePath('/admin/users')
      revalidatePath('/admin')

      return {
        success: true,
        user: {
          id: newUser.id,
          role: 'LECTURER',
          isActive: newUser.isActive,
          emailInstitutional: newUser.emailInstitutional,
          fullName: newLecturer.fullName,
          studentNumber: null,
          programmeCode: null,
          staffNumber: newLecturer.staffNumber,
          department: newLecturer.department,
          sectionCodes: [],
        },
      }
    }

    // STUDENT or ADMIN — User row only
    const newUser = await prisma.user.create({
      data: {
        username: v.username,
        emailInstitutional: v.emailInstitutional,
        passwordHash,
        role: v.role,
      },
      select: { id: true, isActive: true, emailInstitutional: true },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin')

    return {
      success: true,
      user: {
        id: newUser.id,
        role: v.role,
        isActive: newUser.isActive,
        emailInstitutional: newUser.emailInstitutional,
        fullName: null,
        studentNumber: null,
        programmeCode: null,
        staffNumber: null,
        department: null,
        sectionCodes: [],
      },
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = (error.meta as { target?: string[] } | undefined)?.target ?? []
      if (target.includes('username')) return { error: 'Username is already in use' }
      if (target.includes('emailInstitutional')) return { error: 'Email address is already in use' }
      if (target.includes('staffNumber')) return { error: 'Staff number is already in use' }
      return { error: 'A conflict occurred — check username, email, or staff number' }
    }
    throw error
  }
}

// ─── adminUpdateUser ──────────────────────────────────────────────────────────

const ALLOWED_ROLES = ['LECTURER', 'ADMIN'] as const
type AllowedRole = (typeof ALLOWED_ROLES)[number]
const patchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(ALLOWED_ROLES).optional(),
})

// ─── Authorization helper ────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await getValidatedSession()
  // M5: explicit role check — getValidatedSession() validates the session
  // but does NOT assert role. Admin-only actions must check here.
  if (session.user.role !== 'admin') redirect('/login')
  return session
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  )
}

// ─── adminUpdateUser ─────────────────────────────────────────────────────────

// Handles both role change and isActive toggle in a single DB write.
// patch may contain either or both fields; only changed fields are written.
// sessionVersion is always incremented when a real write occurs — both role
// change and deactivation must force the affected user to re-login immediately.
export async function adminUpdateUser(
  userId: string,
  patch: { isActive?: boolean; role?: AllowedRole },
): Promise<ActionState> {
  // Guard 1: admin session
  const session = await assertAdmin()

  // Guard 2: validate userId format (lenient UUID — rejects injection strings)
  const parsedId = userIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { error: parsedId.error.issues[0]?.message ?? 'Invalid user ID' }
  }

  const parsedPatch = patchSchema.safeParse(patch)
  if (!parsedPatch.success) {
    return { error: parsedPatch.error.issues[0]?.message ?? 'Invalid update payload' }
  }
  const validatedPatch = parsedPatch.data

  // Guard 3: prevent self-modification (deactivating self = lockout; role change = confusion)
  if (parsedId.data === session.user.id) {
    return { error: 'You cannot modify your own account' }
  }

  // Guard 4: fetch current DB state to compare + validate
  const dbUser = await prisma.user.findUnique({
    where: { id: parsedId.data },
    select: { id: true, role: true, isActive: true },
  })
  if (!dbUser) return { error: 'User not found' }

  // Guard 5: role change scope — source role must be LECTURER or ADMIN.
  // Cast to ReadonlyArray<string> so includes() accepts the Prisma Role enum value.
  if (validatedPatch.role !== undefined) {
    if (!(ALLOWED_ROLES as ReadonlyArray<string>).includes(dbUser.role)) {
      return {
        error: 'Role changes are only supported for Lecturer and Admin accounts',
      }
    }
  }

  // No-op: return success without a DB write if nothing changed
  const roleChanged =
    validatedPatch.role !== undefined && validatedPatch.role !== (dbUser.role as AllowedRole)
  const activeChanged =
    validatedPatch.isActive !== undefined && validatedPatch.isActive !== dbUser.isActive
  if (!roleChanged && !activeChanged) return { success: true }

  // Last-active-admin guard: prevent the system from ending up with zero active admins.
  // Covers two cases when the target user is currently ADMIN:
  //   (a) role demotion (ADMIN → LECTURER) — roleChanged && dbUser.role === 'ADMIN'
  //   (b) account deactivation of an ADMIN — activeChanged && isActive becoming false
  // Self-lockout is already blocked by Guard 3 (self-modification block above),
  // so this guard only fires for modifications of OTHER admin accounts.
  const isAdminDemotion = dbUser.role === 'ADMIN' && roleChanged
  const isAdminDeactivation =
    dbUser.role === 'ADMIN' && activeChanged && validatedPatch.isActive === false
  if (isAdminDemotion || isAdminDeactivation) {
    const otherActiveAdmins = await prisma.user.count({
      where: { id: { not: parsedId.data }, role: 'ADMIN', isActive: true },
    })
    if (otherActiveAdmins === 0) {
      return {
        error: 'Cannot remove the last active admin — promote another user to Admin first.',
      }
    }
  }

  // Build update payload — only include changed fields
  const updateData: Prisma.UserUpdateInput = {
    sessionVersion: { increment: 1 },
  }
  if (roleChanged && validatedPatch.role) updateData.role = validatedPatch.role as Role
  if (activeChanged && validatedPatch.isActive !== undefined) {
    updateData.isActive = validatedPatch.isActive
  }

  try {
    await prisma.user.update({
      where: { id: parsedId.data },
      data: updateData,
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'User not found' }
    throw error
  }

  // Revalidate both the users page and the dashboard (stat cards show active/inactive counts)
  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { success: true }
}
