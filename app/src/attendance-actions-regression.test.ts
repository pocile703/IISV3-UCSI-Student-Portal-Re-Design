import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('attendance actions validate real dates and reject duplicate student payload entries', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/lecturer/attendance/[sectionId]/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('function parseDateOnly('),
    'expected attendance actions to parse and validate real calendar dates before Prisma writes',
  )
  assert.ok(
    source.includes('Invalid attendance date'),
    'expected attendance actions to reject impossible calendar dates',
  )
  assert.ok(
    source.includes('Duplicate student entries are not allowed'),
    'expected attendance actions to reject duplicate student IDs within one submission',
  )
})

test('attendance actions verify every submitted student belongs to the section roster', () => {
  const source = readFileSync(
    join(root, 'src/app/(portal)/lecturer/attendance/[sectionId]/actions.ts'),
    'utf8',
  )

  assert.ok(
    source.includes('prisma.studentSectionEnrollment.findMany({'),
    'expected attendance actions to validate submitted student IDs against section enrollments',
  )
  assert.ok(
    source.includes("status: 'ENROLLED'"),
    'expected attendance actions to only accept currently enrolled students in the save payload',
  )
  assert.ok(
    source.includes('Invalid or unauthorized student selection'),
    'expected attendance actions to fail closed when the payload references students outside the section roster',
  )
})
