// Edge-safe auth config — no Node.js built-ins (no Prisma, no bcrypt).
// Used by middleware.ts (Edge Runtime). Full config lives in auth.ts.
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
} satisfies NextAuthConfig
