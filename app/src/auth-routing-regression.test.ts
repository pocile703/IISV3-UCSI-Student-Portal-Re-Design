import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('Next.js auth gate uses the proxy file convention instead of deprecated middleware', () => {
  assert.ok(
    existsSync(join(root, 'src/proxy.ts')),
    'expected auth gate to live in src/proxy.ts for Next.js 16',
  )
  assert.ok(
    !existsSync(join(root, 'src/middleware.ts')),
    'expected deprecated src/middleware.ts to be removed',
  )
})

test('lecturer resource detail redirects when mock section or course lookup fails', () => {
  const pageSource = readFileSync(
    join(root, 'src/app/(portal)/lecturer/resources/[sectionId]/page.tsx'),
    'utf8',
  )

  assert.ok(
    !pageSource.includes('mockCourseSections.find(s => s.id === sectionId)!'),
    'expected lecturer resource detail to avoid non-null assertions on section lookup',
  )
  assert.ok(
    !pageSource.includes('mockCourses.find(c => c.id === section.courseId)!'),
    'expected lecturer resource detail to avoid non-null assertions on course lookup',
  )
  assert.ok(
    pageSource.includes('if (!section || !course) {'),
    'expected lecturer resource detail to redirect when section or course data is missing',
  )
})

test('auth jwt callback does not hard-crash on missing profile rows', () => {
  const authSource = readFileSync(join(root, 'src/auth.ts'), 'utf8')

  assert.ok(
    !authSource.includes('prisma.student.findUniqueOrThrow'),
    'expected student profile hydration to avoid findUniqueOrThrow in the JWT callback',
  )
  assert.ok(
    !authSource.includes('prisma.lecturer.findUniqueOrThrow'),
    'expected lecturer profile hydration to avoid findUniqueOrThrow in the JWT callback',
  )
  assert.ok(
    !authSource.includes('prisma.user.findUniqueOrThrow'),
    'expected admin display-name hydration to avoid findUniqueOrThrow in the JWT callback',
  )
})
