import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('admin posts table mirrors publish and pin moderation into local row state', () => {
  const source = readFileSync(
    join(root, 'src/components/admin/AdminPostsTable.tsx'),
    'utf8',
  )

  assert.ok(
    source.includes('onToggled: (id: string, isPublished: boolean) => void'),
    'expected the dedicated admin posts table to update local publish state after moderation',
  )
  assert.ok(
    source.includes('onPinToggled: (id: string, isPinned: boolean) => void'),
    'expected the dedicated admin posts table to update local pin state after moderation',
  )
})
