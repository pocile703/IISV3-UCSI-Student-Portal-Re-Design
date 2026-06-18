// Prisma singleton for Next.js — prevents exhausting connection pool on hot-reload.
// IMPORTANT: PrismaClient requires the PrismaPg adapter at runtime.
// prisma.config.ts is read by the CLI only, not by PrismaClient.
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { _prismaClient: PrismaClient | undefined }

function makePrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter } as never)
}

export const prisma: PrismaClient =
  globalForPrisma._prismaClient ?? makePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma._prismaClient = prisma
}
