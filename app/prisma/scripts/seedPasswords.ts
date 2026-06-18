/**
 * One-off script: update all User.passwordHash fields with real bcrypt hashes.
 * Dev password for all seed users: ucsi2024
 * Run: npx tsx prisma/scripts/seedPasswords.ts
 */
import { readFileSync } from 'fs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

function loadEnvFile(path: string) {
  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      const eqIdx = line.indexOf('=')
      if (eqIdx < 1) continue
      const k = line.slice(0, eqIdx).trim()
      const v = line.slice(eqIdx + 1).trim()
      if (k && !process.env[k]) process.env[k] = v
    }
  } catch {}
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const DEV_PASSWORD = 'ucsi2024'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as never)

  const hash = bcrypt.hashSync(DEV_PASSWORD, 12)
  console.log('Hashing with bcrypt (cost 12)…')

  const users = await prisma.user.findMany({ select: { id: true, username: true } })
  console.log(`Found ${users.length} users`)

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    })
    console.log(`  ✓ ${user.username}`)
  }

  console.log(`\nAll users now have password: "${DEV_PASSWORD}"`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
