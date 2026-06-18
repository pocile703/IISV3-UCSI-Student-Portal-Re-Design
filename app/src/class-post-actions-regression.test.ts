import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('lecturer class-post actions validate bound IDs and centralize ownership checks', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/lecturer/resources/[sectionId]/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('Invalid section ID'),
    'expected lecturer post actions to reject malformed section IDs before hitting Prisma',
  )
  assert.ok(
    source.includes('Invalid post ID'),
    'expected lecturer post actions to reject malformed post IDs before hitting Prisma',
  )
  assert.ok(
    source.includes('async function assertOwnedPost('),
    'expected lecturer post actions to centralize author ownership checks in one helper',
  )
})

test('admin class-post moderation validates post IDs before querying Prisma', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/admin/resources/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('Invalid post ID'),
    'expected admin post moderation actions to reject malformed post IDs before hitting Prisma',
  )
})

test('admin class-post moderation revalidates the admin dashboard surface', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/admin/resources/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes("revalidatePath('/admin')"),
    'expected admin post moderation to revalidate the admin dashboard recent-posts surface',
  )
})

test('class-post mutations revalidate every live post surface', () => {
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
      source.includes("revalidatePath('/dashboard')"),
      'expected class-post mutations to revalidate the student dashboard announcements surface',
    )
    assert.ok(
      source.includes("revalidatePath('/lecturer')"),
      'expected class-post mutations to revalidate lecturer urgent-post summary counts',
    )
    assert.ok(
      source.includes("revalidatePath('/lecturer/resources')"),
      'expected class-post mutations to revalidate lecturer class-picker post counts',
    )
  }
})
