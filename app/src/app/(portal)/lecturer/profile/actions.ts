'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'

type State = { error?: string; success?: boolean }

export async function updateLecturerThecnUsername(_prev: State, formData: FormData): Promise<State> {
  const session = await getValidatedSession()
  const lecturerId = session.user?.lecturerId
  // M5: explicit role check; isActive+sessionVersion revalidated via getValidatedSession
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  const raw = (formData.get('thecnUsername') as string | null) ?? ''
  const username = raw.trim()

  if (username && !/^[A-Za-z0-9._-]{1,100}$/.test(username)) {
    return { error: 'Username may only contain letters, numbers, dots, hyphens, and underscores.' }
  }

  await prisma.lecturer.update({
    where: { id: lecturerId },
    data: { thecnUsername: username || null },
  })

  revalidatePath('/lecturer/profile')
  return { success: true }
}
