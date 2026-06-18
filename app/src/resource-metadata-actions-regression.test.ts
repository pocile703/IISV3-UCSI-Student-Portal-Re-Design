import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('lecturer resource metadata actions validate bound IDs and centralize ownership checks', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/lecturer/resources/[sectionId]/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('Invalid section ID'),
    'expected lecturer resource actions to reject malformed section IDs before hitting Prisma',
  )
  assert.ok(
    source.includes('Invalid resource ID'),
    'expected lecturer resource actions to reject malformed resource IDs before hitting Prisma',
  )
  assert.ok(
    source.includes('async function assertOwnedResource('),
    'expected lecturer resource actions to centralize uploader ownership checks in one helper',
  )
})

test('admin resource moderation validates resource IDs before querying Prisma', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/admin/resources/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('Invalid resource ID'),
    'expected admin resource moderation actions to reject malformed resource IDs before hitting Prisma',
  )
})

test('admin resource moderation revalidates the admin dashboard surface', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/admin/resources/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes("revalidatePath('/admin')"),
    'expected admin resource moderation to revalidate the admin dashboard recent-resources surface',
  )
})

test('resource metadata mutations revalidate every live resource surface', () => {
  const lecturerSource = readFileSync(
    join(root, 'src/app/(portal)/lecturer/resources/[sectionId]/actions.ts'),
    'utf8',
  )
  const adminSource = readFileSync(
    join(root, 'src/app/(portal)/admin/resources/actions.ts'),
    'utf8',
  )

  for (const source of [lecturerSource, adminSource]) {
    assert.ok(
      source.includes("revalidatePath('/classes')"),
      'expected resource metadata mutations to revalidate the student classes surface',
    )
    assert.ok(
      source.includes("revalidatePath('/lecturer')"),
      'expected resource metadata mutations to revalidate lecturer resource summary counts',
    )
    assert.ok(
      source.includes("revalidatePath('/lecturer/resources')"),
      'expected resource metadata mutations to revalidate lecturer section-picker resource counts',
    )
  }
})
