"use client"
// useAuth — returns current session user and role from Auth.js
// Placeholder: will wrap useSession() from next-auth/react

import type { SessionUser } from '@/types/user'

export function useAuth(): { user: SessionUser | null; isLoading: boolean } {
  // TODO: replace with useSession() from next-auth/react
  return { user: null, isLoading: false }
}
