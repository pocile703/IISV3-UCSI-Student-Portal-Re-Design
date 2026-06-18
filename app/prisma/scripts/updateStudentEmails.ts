/**
 * One-off script: update student User.emailInstitutional values to the
 * 20024XXXXX@ucsicollege.edu.my format required for student login.
 *
 * Safe to re-run — uses upsert-style UPDATE with WHERE username = $1.
 * Run: npx tsx prisma/scripts/updateStudentEmails.ts
 */
import { readFileSync } from 'fs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

function loadEnvFile(path: string) {
  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      const eqIdx = line.indexOf('=')
      if (eqIdx < 1) continue
      const k = line.slice(0, eqIdx).trim()
      const v = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (k && !process.env[k]) process.env[k] = v
    }
  } catch {}
}

loadEnvFile('.env.local')
loadEnvFile('.env')

// Mapping: username → new emailInstitutional (must match seed.ts)
const EMAIL_MAP: Record<string, string> = {
  'ahmad.hafizi':   '2002400001@ucsicollege.edu.my',
  'nurul.ain':      '2002400002@ucsicollege.edu.my',
  'lee.weikang':    '2002400003@ucsicollege.edu.my',
  'priya.krishnan': '2002400004@ucsicollege.edu.my',
  'izzat.hakimi':   '2002400005@ucsicollege.edu.my',
  'siti.hajar':     '2002400006@ucsicollege.edu.my',
  'tan.jiahui':     '2002400007@ucsicollege.edu.my',
  'farah.nabilah':  '2002400008@ucsicollege.edu.my',
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as never)

  console.log('Updating student emailInstitutional values…')

  for (const [username, email] of Object.entries(EMAIL_MAP)) {
    await prisma.user.update({
      where: { username },
      data: { emailInstitutional: email },
    })
    console.log(`  ✓ ${username} → ${email}`)
  }

  console.log('\nDone. Students now log in with 20024XXXXX@ucsicollege.edu.my format.')
  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
