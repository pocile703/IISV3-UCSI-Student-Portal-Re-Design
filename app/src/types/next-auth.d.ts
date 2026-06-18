import type { DefaultSession } from 'next-auth'
import type { Role } from '@/types/user'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      studentId?: string
      lecturerId?: string
      sessionVersion: number
    } & DefaultSession['user']
  }

  // Augment the User returned from authorize() to carry portal fields.
  interface User {
    role: Role
    sessionVersion: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    studentId?: string
    lecturerId?: string
    sessionVersion: number
  }
}
