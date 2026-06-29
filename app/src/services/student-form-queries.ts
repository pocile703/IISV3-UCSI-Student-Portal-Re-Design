// Server-only query feeding the admin "create STUDENT" form: the list of active
// programmes the new student can be enrolled into.
import { prisma } from '@/lib/prisma'

export interface ProgrammeOption {
  id: string
  code: string
  name: string
}

export async function getStudentFormData(): Promise<{ programmes: ProgrammeOption[] }> {
  const programmes = await prisma.programme.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })
  return { programmes }
}
