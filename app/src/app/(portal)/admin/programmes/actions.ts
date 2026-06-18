'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import {
  programmeIdSchema,
  programmeCodeSchema,
  programmeNameSchema,
  totalCreditsSchema,
  durationYearsSchema,
} from '@/lib/schemas'

type ActionState = { error?: string; success?: boolean }

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await getValidatedSession()
  // M5: explicit role check — getValidatedSession() validates the session but
  // does NOT assert role. Admin-only actions must check here.
  if (session.user.role !== 'admin') redirect('/login')
  return session
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  )
}

function isNotFoundError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025'
  )
}

// ─── Shared schemas ───────────────────────────────────────────────────────────

const createSchema = z.object({
  code: programmeCodeSchema,
  name: programmeNameSchema,
  totalCredits: totalCreditsSchema,
  durationYears: durationYearsSchema,
})

// Update extends create with isActive (select value → boolean transform)
const updateSchema = createSchema.extend({
  isActive: z
    .enum(['true', 'false'], { message: 'Invalid status value' })
    .transform(v => v === 'true'),
})

// ─── adminCreateProgramme ─────────────────────────────────────────────────────

export async function adminCreateProgramme(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin()

  const parsed = createSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    totalCredits: formData.get('totalCredits'),
    durationYears: formData.get('durationYears'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    await prisma.programme.create({ data: parsed.data })
  } catch (err) {
    if (isUniqueViolation(err)) return { error: 'Programme code already in use' }
    throw err
  }

  revalidatePath('/admin/programmes')
  revalidatePath('/admin')
  return { success: true }
}

// ─── adminUpdateProgramme ─────────────────────────────────────────────────────

export async function adminUpdateProgramme(
  programmeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin()

  const parsedId = programmeIdSchema.safeParse(programmeId)
  if (!parsedId.success) {
    return { error: parsedId.error.issues[0]?.message ?? 'Invalid programme ID' }
  }

  const parsed = updateSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    totalCredits: formData.get('totalCredits'),
    durationYears: formData.get('durationYears'),
    isActive: formData.get('isActive'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const existing = await prisma.programme.findUnique({
    where: { id: parsedId.data },
    select: {
      code: true,
      name: true,
      totalCredits: true,
      durationYears: true,
      isActive: true,
    },
  })
  if (!existing) return { error: 'Programme not found' }

  const { code, name, totalCredits, durationYears, isActive } = parsed.data
  const changed =
    code !== existing.code ||
    name !== existing.name ||
    totalCredits !== existing.totalCredits ||
    durationYears !== existing.durationYears ||
    isActive !== existing.isActive

  // No-op: avoid a pointless DB write if nothing changed
  if (!changed) return { success: true }

  try {
    await prisma.programme.update({
      where: { id: parsedId.data },
      data: { code, name, totalCredits, durationYears, isActive },
    })
  } catch (err) {
    if (isUniqueViolation(err)) return { error: 'Programme code already in use' }
    if (isNotFoundError(err)) return { error: 'Programme not found' }
    throw err
  }

  revalidatePath('/admin/programmes')
  revalidatePath('/admin')
  return { success: true }
}
