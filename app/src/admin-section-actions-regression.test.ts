import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('admin section actions validate assigned lecturers are active users', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/admin/sections/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('user: { select: { isActive: true } }'),
    'expected admin section CRUD to fetch lecturer user activity state before assigning teaching responsibility',
  )
  assert.ok(
    source.includes('Selected lecturer is inactive'),
    'expected admin section CRUD to reject assignments to inactive lecturers',
  )
})
