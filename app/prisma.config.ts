// Prisma 7 config — replaces the `url = env("DATABASE_URL")` that used to live
// in prisma/schema.prisma's datasource block.
//
// defineConfig only accepts: datasource, schema, migrations, tables, enums, views, typedSql.
// There is no migrate.adapter in the config — that pattern applies to PrismaClient
// instantiation in application code (edge runtimes), not to the Prisma CLI.
//
// Prisma CLI reads .env automatically, but not .env.local (Next.js convention).
// We load both here so the same DATABASE_URL works for both the app and the CLI.

import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'prisma/config'

function loadEnvFile(filePath: string) {
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = val
    }
  } catch { /* file absent — skip */ }
}

loadEnvFile(path.resolve('.env'))
loadEnvFile(path.resolve('.env.local'))

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: process.env.DATABASE_URL!,
  },

  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
