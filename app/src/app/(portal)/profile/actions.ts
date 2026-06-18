'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'

type State = { error?: string; success?: boolean }

export async function updateStudentThecnUsername(_prev: State, formData: FormData): Promise<State> {
  const session = await getValidatedSession()
  const studentId = session.user?.studentId
  // M5: explicit role check; isActive+sessionVersion revalidated via getValidatedSession
  if (!studentId || session.user.role !== 'student') redirect('/login')

  const raw = (formData.get('thecnUsername') as string | null) ?? ''
  const username = raw.trim()

  // Allow letters, digits, dots, hyphens, underscores — max 100 chars.
  if (username && !/^[A-Za-z0-9._-]{1,100}$/.test(username)) {
    return { error: 'Username may only contain letters, numbers, dots, hyphens, and underscores.' }
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { thecnUsername: username || null },
  })

  revalidatePath('/profile')
  return { success: true }
}
