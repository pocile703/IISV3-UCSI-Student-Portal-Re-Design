import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('admin user action validates patch payload at runtime', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/admin/users/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('const patchSchema = z.object({'),
    'expected admin user updates to validate the incoming patch payload at runtime',
  )
  assert.ok(
    source.includes('role: z.enum(ALLOWED_ROLES).optional()'),
    'expected admin user updates to restrict target roles to the allowed ADMIN/LECTURER set at runtime',
  )
  assert.ok(
    source.includes('isActive: z.boolean().optional()'),
    'expected admin user updates to validate isActive as a real boolean at runtime',
  )
})
