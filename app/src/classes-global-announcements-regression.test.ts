import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('classes global announcements query is scoped to courseSectionId = null', () => {
  const source = readFileSync(join(root, 'src/services/classes-queries.ts'), 'utf8')

  assert.ok(
    source.includes('where: { courseSectionId: null, isPublished: true }'),
    'expected Classes global announcements to query only global published posts',
  )
})

test('global announcements strip does not append a duplicate hardcoded admin label', () => {
  const source = readFileSync(join(root, 'src/app/(portal)/classes/page.tsx'), 'utf8')

  assert.ok(
    !source.includes('{post.authorName} · Admin'),
    'expected global announcements strip to render the derived author label directly instead of appending a second hardcoded Admin tag',
  )
  assert.ok(
    source.includes("formatDate(post.createdAt)"),
    'expected global announcements strip to show the post timestamp like other post surfaces',
  )
})
