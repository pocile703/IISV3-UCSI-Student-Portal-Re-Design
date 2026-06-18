import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('classes download button uses the section-scoped file route', () => {
  const source = readFileSync(
    join(root, 'src/components/classes/ClassSectionCard.tsx'),
    'utf8',
  )

  assert.ok(
    source.includes('fetch(`/api/files/${sectionId}/${res.attachment.id}`)'),
    'expected Classes download buttons to call the section-scoped /api/files/:sectionId/:attachmentId route',
  )
})

test('student download helper uses the section-scoped file route', () => {
  const source = readFileSync(
    join(root, 'src/services/student.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('fetch(`/api/files/${sectionId}/${attachmentId}`)'),
    'expected the student download helper to target the same /api/files/:sectionId/:attachmentId route as the Classes UI',
  )
  assert.ok(
    source.includes('return res.blob()'),
    'expected the student download helper to consume the streamed file response directly instead of assuming a JSON signed-url payload',
  )
})

test('classes query does not expose raw storage keys to the client', () => {
  const source = readFileSync(
    join(root, 'src/services/classes-queries.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('storageKey is intentionally excluded'),
    'expected Classes page data to keep internal storage keys server-only',
  )
})
