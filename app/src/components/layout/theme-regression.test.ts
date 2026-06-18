import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

test('root layout does not render a raw script tag in React output', () => {
  const layoutSource = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8')

  assert.ok(
    layoutSource.includes("from 'next/script'"),
    'expected RootLayout to use next/script for theme bootstrapping',
  )
  assert.ok(
    !layoutSource.includes('<script'),
    'expected RootLayout to avoid rendering a raw <script> element',
  )
})

test('theme toggle does not read localStorage during initial render', () => {
  const toggleSource = readFileSync(join(root, 'src/components/layout/ThemeToggle.tsx'), 'utf8')

  assert.ok(
    !toggleSource.includes('useState<Theme>(() =>'),
    'expected ThemeToggle to avoid window/localStorage-dependent state initialization',
  )
  assert.ok(
    toggleSource.includes('useSyncExternalStore'),
    'expected ThemeToggle to derive persisted theme without a hydration-mismatching render initializer',
  )
})
