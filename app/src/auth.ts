import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'

// Zod schema for login form — validated in authorize() before any DB query.
// Students log in with emailInstitutional (contains '@'); lecturers/admins use username.
const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'Student Email / Staff Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { identifier, password } = parsed.data
        const isEmail = identifier.includes('@')

        const user = isEmail
          ? await prisma.user.findFirst({
              where: { emailInstitutional: identifier, role: 'STUDENT', isActive: true },
              select: { id: true, passwordHash: true, role: true, sessionVersion: true },
            })
          : await prisma.user.findFirst({
              where: { username: identifier, isActive: true },
              select: { id: true, passwordHash: true, role: true, sessionVersion: true },
            })

        if (!user) return null

        // Students must use email; staff must use username — reject cross-path attempts.
        if (!isEmail && user.role === 'STUDENT') return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        // Map Prisma uppercase enum → lowercase app Role type.
        const role = user.role.toLowerCase() as import('@/types/user').Role

        return {
          id: user.id,
          role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Only runs on initial sign-in — user is undefined on subsequent requests.
        token.role = user.role
        token.sessionVersion = user.sessionVersion

        // Fetch profile ID + display name in the same callback so every
        // page render after this point reads from the token (no per-request DB hit).
        const userId = user.id!

        if (user.role === 'student') {
          const student = await prisma.student.findUnique({
            where: { userId },
            select: { id: true, fullName: true },
          })
          // Fail closed without throwing: downstream student pages require
          // studentId and will redirect to /login when the profile is missing.
          token.studentId = student?.id
          token.name = student?.fullName
        } else if (user.role === 'lecturer') {
          const lecturer = await prisma.lecturer.findUnique({
            where: { userId },
            select: { id: true, fullName: true },
          })
          // Same fail-closed behavior as the student branch above.
          token.lecturerId = lecturer?.id
          token.name = lecturer?.fullName
        } else {
          // ADMIN — no separate profile table; display username formatted.
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true },
          })
          // "admin.farouk" → "Admin Farouk"
          token.name = dbUser
            ? dbUser.username
                .split('.')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : undefined
        }
      }
      return token
    },

    async session({ session, token }) {
      // Expose JWT claims on session.user for Server Components and API handlers.
      // Assertions needed: Auth.js v5 beta types token fields as unknown until the
      // module augmentation is fully resolved at runtime.
      session.user.id = token.sub ?? ''  // '' is falsy → session-guard's !userId check treats it as invalid
      session.user.role = token.role as import('@/types/user').Role
      session.user.studentId = token.studentId as string | undefined
      session.user.lecturerId = token.lecturerId as string | undefined
      session.user.sessionVersion = token.sessionVersion as number
      if (token.name) session.user.name = token.name
      return session
    },
  },

})

export const { handlers, auth, signIn, signOut } = nextAuth
export const { GET, POST } = nextAuth.handlers
