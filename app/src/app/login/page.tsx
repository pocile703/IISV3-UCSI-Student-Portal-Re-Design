import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { Role } from '@/types/user'
import LoginPageClient from './LoginPageClient'

const ROLE_HOME: Record<Role, string> = {
  student: '/dashboard',
  lecturer: '/lecturer',
  admin: '/admin',
}

export default async function LoginPage() {
  const session = await auth()
  const role = session?.user?.role

  if (role) {
    redirect(ROLE_HOME[role] ?? '/dashboard')
  }

  return <LoginPageClient />
}
