/**
 * Prisma seed — UCSI Student Portal (Phase 4)
 * Run: prisma db seed   (or: npx tsx prisma/seed.ts)
 *
 * All IDs are deterministic UUIDs so the seed is idempotent: re-running
 * wipes and recreates all rows with the same IDs every time.
 *
 * Dev password placeholder: bcrypt hash of "password" (cost 10).
 * Phase 5 auth will hash real passwords on registration.
 */

import path from 'node:path'
import fs from 'node:fs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  Prisma,
  PrismaClient,
  Role,
  Gender,
  MaritalStatus,
  CourseType,
  ProgrammeEnrollmentStatus,
  SectionEnrollmentStatus,
  AttendanceStatus,
  ResourceType,
  PostType,
  InvoiceStatus,
  PaymentMode,
  PaymentStatus,
  NotificationType,
  FeedbackStatus,
} from '@prisma/client'

// Prisma 7: URL lives in prisma.config.ts for the CLI, but PrismaClient itself
// needs the pg driver adapter — it does not read prisma.config.ts at runtime.
function loadEnvFile(p: string) {
  try {
    for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const k = t.slice(0, eq).trim()
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (k && !process.env[k]) process.env[k] = v
    }
  } catch { /* absent — skip */ }
}
loadEnvFile(path.resolve('.env'))
loadEnvFile(path.resolve('.env.local'))

const pool    = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Phase 5 will hash real passwords; this placeholder passes bcrypt.compare("password", hash)
const DEV_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

// @db.Time fields: only the time component is stored; date part is ignored
function hhmm(t: string): Date { return new Date(`1970-01-01T${t}:00.000Z`) }

// @db.Date / @db.Timestamptz fields
function d(s: string): Date { return new Date(s) }

// ─── Deterministic IDs ────────────────────────────────────────────────────────

// Users (10000000 prefix)
const U_ADMIN = '10000000-0000-0000-0000-000000000001'
const U_S = [
  '',                                              // index 0 unused
  '20000000-0000-0000-0000-000000000001',          // stu 1 – Ahmad Hafizi
  '20000000-0000-0000-0000-000000000002',          // stu 2 – Nurul Ain
  '20000000-0000-0000-0000-000000000003',          // stu 3 – Lee Wei Kang
  '20000000-0000-0000-0000-000000000004',          // stu 4 – Priya
  '20000000-0000-0000-0000-000000000005',          // stu 5 – Muhammad Izzat
  '20000000-0000-0000-0000-000000000006',          // stu 6 – Siti Hajar
  '20000000-0000-0000-0000-000000000007',          // stu 7 – Tan Jia Hui
  '20000000-0000-0000-0000-000000000008',          // stu 8 – Farah Nabilah (inactive)
]
const U_L = [
  '',
  '30000000-0000-0000-0000-000000000001',          // lec 1 – Dr. Amirul Hassan
  '30000000-0000-0000-0000-000000000002',          // lec 2 – Ms. Siti Norzahra
  '30000000-0000-0000-0000-000000000003',          // lec 3 – Mr. Khairul Azwan
  '30000000-0000-0000-0000-000000000004',          // lec 4 – Mr. Rashid (inactive)
  '30000000-0000-0000-0000-000000000005',          // lec 5 – Dr. Sarah Tan
]

// Student profile IDs (40000000 prefix)
const STU = [
  '',
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000004',
  '40000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000006',
  '40000000-0000-0000-0000-000000000007',
  '40000000-0000-0000-0000-000000000008',
]

// Lecturer profile IDs (50000000 prefix)
const LEC = [
  '',
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000005',
]

// Programmes (60000000 prefix)
const PROG_DIT = '60000000-0000-0000-0000-000000000001'
const PROG_DBM = '60000000-0000-0000-0000-000000000002'
const PROG_DAC = '60000000-0000-0000-0000-000000000003'

// Semesters (70000000 prefix): DIT has 3, DBM and DAC have 1 each
const SEM_DIT_1 = '70000000-0000-0000-0000-000000000011' // 2022/23 S1
const SEM_DIT_2 = '70000000-0000-0000-0000-000000000012' // 2022/23 S2
const SEM_DIT_3 = '70000000-0000-0000-0000-000000000013' // 2023/24 S1 (current)
const SEM_DBM_1 = '70000000-0000-0000-0000-000000000021' // DBM current
const SEM_DAC_1 = '70000000-0000-0000-0000-000000000031' // DAC current

// Courses (80000000 prefix)
const C = {
  // DIT Semester 1 (past)
  dit1013: '80000000-0000-0000-0000-000000000001',
  dit1023: '80000000-0000-0000-0000-000000000002',
  dit1033: '80000000-0000-0000-0000-000000000003',
  dit1043: '80000000-0000-0000-0000-000000000004',
  mpw1133: '80000000-0000-0000-0000-000000000005',
  // DIT Semester 2 (past)
  dit2013: '80000000-0000-0000-0000-000000000011',
  dit2023: '80000000-0000-0000-0000-000000000012',
  dit2033: '80000000-0000-0000-0000-000000000013',
  dit2043: '80000000-0000-0000-0000-000000000014',
  mpw2143: '80000000-0000-0000-0000-000000000015',
  // Current semester
  dit7044: '80000000-0000-0000-0000-000000000021',
  dit7021: '80000000-0000-0000-0000-000000000022',
  dit7031: '80000000-0000-0000-0000-000000000023',
  mpw1143: '80000000-0000-0000-0000-000000000024',
  // DBM & DAC own-programme courses
  dbm1013: '80000000-0000-0000-0000-000000000031',
  acc1013: '80000000-0000-0000-0000-000000000032',
}

// CourseSections (90000000 prefix)
const SEC = {
  // Current — sem3
  s001: '90000000-0000-0000-0000-000000000001', // HCI sec-A
  s002: '90000000-0000-0000-0000-000000000002', // DBMS sec-B
  s003: '90000000-0000-0000-0000-000000000003', // WAD sec-A
  s004: '90000000-0000-0000-0000-000000000004', // BM sec-A
  // DBM & DAC current sections (own semesters)
  dbm001: '90000000-0000-0000-0000-000000000031', // DBM Business Fundamentals sec-A
  dac001: '90000000-0000-0000-0000-000000000032', // DAC Accounting sec-A
  // Past sem-1 (DIT)
  p1_1: '90000000-0000-0000-0000-000000000011',
  p1_2: '90000000-0000-0000-0000-000000000012',
  p1_3: '90000000-0000-0000-0000-000000000013',
  p1_4: '90000000-0000-0000-0000-000000000014',
  p1_5: '90000000-0000-0000-0000-000000000015',
  // Past sem-2 (DIT)
  p2_1: '90000000-0000-0000-0000-000000000021',
  p2_2: '90000000-0000-0000-0000-000000000022',
  p2_3: '90000000-0000-0000-0000-000000000023',
  p2_4: '90000000-0000-0000-0000-000000000024',
  p2_5: '90000000-0000-0000-0000-000000000025',
}

// ProgrammeEnrollments (a0000000 prefix)
const PE = [
  '',
  'a0000000-0000-0000-0000-000000000001', // stu1 → DIT
  'a0000000-0000-0000-0000-000000000002', // stu2 → DIT
  'a0000000-0000-0000-0000-000000000003', // stu3 → DIT
  'a0000000-0000-0000-0000-000000000004', // stu4 → DBM
  'a0000000-0000-0000-0000-000000000005', // stu5 → DBM
  'a0000000-0000-0000-0000-000000000006', // stu6 → DAC
  'a0000000-0000-0000-0000-000000000007', // stu7 → DIT
  'a0000000-0000-0000-0000-000000000008', // stu8 → DIT
]

// StudentSectionEnrollments (b0000000 prefix)
const SSE = {
  // stu1 — current 4 sections
  s1_001: 'b0000000-0000-0000-0001-000000000001',
  s1_002: 'b0000000-0000-0000-0001-000000000002',
  s1_003: 'b0000000-0000-0000-0001-000000000003',
  s1_004: 'b0000000-0000-0000-0001-000000000004',
  // stu1 — past sem-1 (5 sections)
  s1_p1_1: 'b0000000-0000-0000-0001-000000000011',
  s1_p1_2: 'b0000000-0000-0000-0001-000000000012',
  s1_p1_3: 'b0000000-0000-0000-0001-000000000013',
  s1_p1_4: 'b0000000-0000-0000-0001-000000000014',
  s1_p1_5: 'b0000000-0000-0000-0001-000000000015',
  // stu1 — past sem-2 (5 sections)
  s1_p2_1: 'b0000000-0000-0000-0001-000000000021',
  s1_p2_2: 'b0000000-0000-0000-0001-000000000022',
  s1_p2_3: 'b0000000-0000-0000-0001-000000000023',
  s1_p2_4: 'b0000000-0000-0000-0001-000000000024',
  s1_p2_5: 'b0000000-0000-0000-0001-000000000025',
  // Other students — current section only
  s2_001: 'b0000000-0000-0000-0002-000000000001',
  s3_003: 'b0000000-0000-0000-0003-000000000001',
  s4_002: 'b0000000-0000-0000-0004-000000000001',
  s5_002: 'b0000000-0000-0000-0005-000000000001',
  s6_004: 'b0000000-0000-0000-0006-000000000001',
  s7_003: 'b0000000-0000-0000-0007-000000000001',
  s8_001: 'b0000000-0000-0000-0008-000000000001',
}

// TeachingAssignments (c0000000 prefix)
const TA = {
  l1_s001: 'c0000000-0000-0000-0000-000000000001',
  l2_s002: 'c0000000-0000-0000-0000-000000000002',
  l3_s003: 'c0000000-0000-0000-0000-000000000003',
  l3_s004: 'c0000000-0000-0000-0000-000000000004',
  l5_s001: 'c0000000-0000-0000-0000-000000000005',
  l5_s003: 'c0000000-0000-0000-0000-000000000006',
  l2_dbm001: 'c0000000-0000-0000-0000-000000000007',
  l2_dac001: 'c0000000-0000-0000-0000-000000000008',
}

// Results (d0000000 prefix)
const RES = {
  s1_001: 'd0000000-0000-0000-0001-000000000001',
  s1_002: 'd0000000-0000-0000-0001-000000000002',
  s1_003: 'd0000000-0000-0000-0001-000000000003',
  s1_004: 'd0000000-0000-0000-0001-000000000004',
  p1_1:   'd0000000-0000-0000-0011-000000000001',
  p1_2:   'd0000000-0000-0000-0011-000000000002',
  p1_3:   'd0000000-0000-0000-0011-000000000003',
  p1_4:   'd0000000-0000-0000-0011-000000000004',
  p1_5:   'd0000000-0000-0000-0011-000000000005',
  p2_1:   'd0000000-0000-0000-0021-000000000001',
  p2_2:   'd0000000-0000-0000-0021-000000000002',
  p2_3:   'd0000000-0000-0000-0021-000000000003',
  p2_4:   'd0000000-0000-0000-0021-000000000004',
  p2_5:   'd0000000-0000-0000-0021-000000000005',
}

// Invoices (e0000000 prefix)
const INV = [
  '',
  'e0000000-0000-0000-0000-000000000001', // stu1 sem1 — paid
  'e0000000-0000-0000-0000-000000000002', // stu1 sem2 — paid
  'e0000000-0000-0000-0000-000000000003', // stu1 sem3 — partial
  'e0000000-0000-0000-0000-000000000004', // stu2 current — paid
  'e0000000-0000-0000-0000-000000000005', // stu3 current — unpaid
  'e0000000-0000-0000-0000-000000000006', // stu4 current — paid
  'e0000000-0000-0000-0000-000000000007', // stu5 current — overdue
  'e0000000-0000-0000-0000-000000000008', // stu6 current — paid
  'e0000000-0000-0000-0000-000000000009', // stu7 current — partial
]

// LearningResource IDs (f0000000 prefix)
const LR = {
  r01: 'f0000000-0000-0000-0000-000000000001',
  r02: 'f0000000-0000-0000-0000-000000000002',
  r03: 'f0000000-0000-0000-0000-000000000003',
  r04: 'f0000000-0000-0000-0000-000000000004',
  r05: 'f0000000-0000-0000-0000-000000000005',
  r06: 'f0000000-0000-0000-0000-000000000006',
  r07: 'f0000000-0000-0000-0000-000000000007',
  r08: 'f0000000-0000-0000-0000-000000000008',
  r09: 'f0000000-0000-0000-0000-000000000009',
  r10: 'f0000000-0000-0000-0000-000000000010',
  r11: 'f0000000-0000-0000-0000-000000000011',
  r12: 'f0000000-0000-0000-0000-000000000012',
  r13: 'f0000000-0000-0000-0000-000000000013',
  r14: 'f0000000-0000-0000-0000-000000000014',
  r15: 'f0000000-0000-0000-0000-000000000015',
  r16: 'f0000000-0000-0000-0000-000000000016',
  r17: 'f0000000-0000-0000-0000-000000000017',
  r18: 'f0000000-0000-0000-0000-000000000018',
  r19: 'f0000000-0000-0000-0000-000000000019',
}

// ClassPost IDs (10000001 prefix)
const CP = {
  p01: '10000001-0000-0000-0000-000000000001',
  p02: '10000001-0000-0000-0000-000000000002',
  p03: '10000001-0000-0000-0000-000000000003',
  p04: '10000001-0000-0000-0000-000000000004',
  p05: '10000001-0000-0000-0000-000000000005',
  p06: '10000001-0000-0000-0000-000000000006',
  p07: '10000001-0000-0000-0000-000000000007',
  p08: '10000001-0000-0000-0000-000000000008',
  p09: '10000001-0000-0000-0000-000000000009',
  p10: '10000001-0000-0000-0000-000000000010', // global admin announcement
  p11: '10000001-0000-0000-0000-000000000011', // dac001 welcome post
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding UCSI Student Portal…')

  // ── 1. Wipe in reverse-dependency order ──────────────────────────────────
  await prisma.adminAuditLog.deleteMany()
  await prisma.progressionRequest.deleteMany()
  await prisma.addDropRequest.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.result.deleteMany()
  await prisma.studentSectionEnrollment.deleteMany()
  await prisma.classPost.deleteMany()
  await prisma.resourceAttachment.deleteMany()
  await prisma.learningResource.deleteMany()
  await prisma.teachingAssignment.deleteMany()
  await prisma.programmeEnrollment.deleteMany()
  await prisma.courseSection.deleteMany()
  await prisma.semester.deleteMany()
  await prisma.course.deleteMany()
  await prisma.programme.deleteMany()
  await prisma.session.deleteMany()
  await prisma.student.deleteMany()
  await prisma.lecturer.deleteMany()
  await prisma.user.deleteMany()
  console.log('  ✓ cleared')

  // ── 2. Users ──────────────────────────────────────────────────────────────
  await prisma.user.createMany({ data: [
    // Admin
    {
      id: U_ADMIN,
      username: 'admin.farouk',
      emailInstitutional: 'admin@ucsicollege.edu.my',
      passwordHash: DEV_HASH,
      role: Role.ADMIN,
      isActive: true,
    },
    // Students
    { id: U_S[1], username: 'ahmad.hafizi',    emailInstitutional: '2002400001@ucsicollege.edu.my',  emailPersonal: 'ahmadhafizi@gmail.com',   passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[2], username: 'nurul.ain',        emailInstitutional: '2002400002@ucsicollege.edu.my',  emailPersonal: 'nurulain@gmail.com',       passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[3], username: 'lee.weikang',      emailInstitutional: '2002400003@ucsicollege.edu.my',  emailPersonal: 'leeweikang@gmail.com',     passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[4], username: 'priya.krishnan',   emailInstitutional: '2002400004@ucsicollege.edu.my',  emailPersonal: 'priyakrishnan@gmail.com',  passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[5], username: 'izzat.hakimi',     emailInstitutional: '2002400005@ucsicollege.edu.my',  emailPersonal: 'izzathakimi@gmail.com',    passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[6], username: 'siti.hajar',       emailInstitutional: '2002400006@ucsicollege.edu.my',  emailPersonal: 'sitihajar@gmail.com',      passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[7], username: 'tan.jiahui',       emailInstitutional: '2002400007@ucsicollege.edu.my',  emailPersonal: 'tanjiahui@gmail.com',      passwordHash: DEV_HASH, role: Role.STUDENT, isActive: true  },
    { id: U_S[8], username: 'farah.nabilah',    emailInstitutional: '2002400008@ucsicollege.edu.my',  emailPersonal: 'farahnabilah@gmail.com',   passwordHash: DEV_HASH, role: Role.STUDENT, isActive: false },
    // Lecturers
    { id: U_L[1], username: 'amirul.hassan',   emailInstitutional: 'amirul.hassan@ucsicollege.edu.my',   passwordHash: DEV_HASH, role: Role.LECTURER, isActive: true  },
    { id: U_L[2], username: 'siti.norzahra',   emailInstitutional: 'siti.norzahra@ucsicollege.edu.my',   passwordHash: DEV_HASH, role: Role.LECTURER, isActive: true  },
    { id: U_L[3], username: 'khairul.azwan',   emailInstitutional: 'khairul.azwan@ucsicollege.edu.my',   passwordHash: DEV_HASH, role: Role.LECTURER, isActive: true  },
    { id: U_L[4], username: 'rashid.ahmad',    emailInstitutional: 'rashid.ahmad@ucsicollege.edu.my',    passwordHash: DEV_HASH, role: Role.LECTURER, isActive: false },
    { id: U_L[5], username: 'sarah.tan',       emailInstitutional: 'sarah.tan@ucsicollege.edu.my',       passwordHash: DEV_HASH, role: Role.LECTURER, isActive: true  },
  ]})
  console.log('  ✓ users')

  // ── 3. Student profiles ───────────────────────────────────────────────────
  await prisma.student.createMany({ data: [
    {
      id: STU[1], userId: U_S[1],
      studentNumber: 'UCSI-2022-001',
      fullName: 'Ahmad Hafizi bin Razali',
      dateOfBirth: d('2002-03-15'), gender: Gender.MALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0123456789',
      guardianName: 'Razali bin Hassan', guardianRelation: 'Father',
      addressLine1: '12, Jalan Bukit 2/3', addressLine2: 'Taman Bukit Permai',
      city: 'Cheras', state: 'Selangor', postcode: '56000', country: 'Malaysia',
    },
    {
      id: STU[2], userId: U_S[2],
      studentNumber: 'UCSI-2022-002',
      fullName: 'Nurul Ain binti Hamid',
      dateOfBirth: d('2003-06-22'), gender: Gender.FEMALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0134567890',
      guardianName: 'Hamid bin Othman', guardianRelation: 'Father',
      addressLine1: '45, Jalan Wangsa 3/7',
      city: 'Wangsa Maju', state: 'Kuala Lumpur', postcode: '53300', country: 'Malaysia',
    },
    {
      id: STU[3], userId: U_S[3],
      studentNumber: 'UCSI-2022-003',
      fullName: 'Lee Wei Kang',
      dateOfBirth: d('2002-11-08'), gender: Gender.MALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0167891234',
      guardianName: 'Lee Ah Kow', guardianRelation: 'Father',
      addressLine1: '7, Jalan Desa 5/2', addressLine2: 'Taman Desa',
      city: 'Kuala Lumpur', state: 'Kuala Lumpur', postcode: '58100', country: 'Malaysia',
    },
    {
      id: STU[4], userId: U_S[4],
      studentNumber: 'UCSI-2022-004',
      fullName: 'Priya a/p Krishnan',
      dateOfBirth: d('2003-01-30'), gender: Gender.FEMALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0189012345',
      guardianName: 'Krishnan a/l Rajan', guardianRelation: 'Father',
      addressLine1: '22, Jalan Ampang Hilir 5',
      city: 'Ampang', state: 'Selangor', postcode: '68000', country: 'Malaysia',
    },
    {
      id: STU[5], userId: U_S[5],
      studentNumber: 'UCSI-2022-005',
      fullName: 'Muhammad Izzat Hakimi bin Zainudin',
      dateOfBirth: d('2002-09-14'), gender: Gender.MALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0111234567',
      guardianName: 'Zainudin bin Kamaruddin', guardianRelation: 'Father',
      addressLine1: '3, Lorong Damai 9',
      city: 'Cheras', state: 'Kuala Lumpur', postcode: '56100', country: 'Malaysia',
    },
    {
      id: STU[6], userId: U_S[6],
      studentNumber: 'UCSI-2022-006',
      fullName: 'Siti Hajar binti Zulkifli',
      dateOfBirth: d('2003-04-05'), gender: Gender.FEMALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0122345678',
      guardianName: 'Zulkifli bin Mansor', guardianRelation: 'Father',
      addressLine1: '18, Jalan Cheras Perdana 2/3',
      city: 'Cheras', state: 'Selangor', postcode: '43200', country: 'Malaysia',
    },
    {
      id: STU[7], userId: U_S[7],
      studentNumber: 'UCSI-2022-007',
      fullName: 'Tan Jia Hui',
      dateOfBirth: d('2002-07-19'), gender: Gender.FEMALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0193456789',
      guardianName: 'Tan Boon Huat', guardianRelation: 'Father',
      addressLine1: '5, Jalan Miharja 1',
      city: 'Cheras', state: 'Kuala Lumpur', postcode: '55200', country: 'Malaysia',
    },
    {
      id: STU[8], userId: U_S[8],
      studentNumber: 'UCSI-2022-008',
      fullName: 'Farah Nabilah binti Rosli',
      dateOfBirth: d('2003-02-28'), gender: Gender.FEMALE,
      nationality: 'Malaysian', maritalStatus: MaritalStatus.SINGLE,
      mobile: '0154567890',
      guardianName: 'Rosli bin Baharom', guardianRelation: 'Father',
      addressLine1: '9, Jalan Pandan Indah 4/5',
      city: 'Ampang', state: 'Selangor', postcode: '55100', country: 'Malaysia',
    },
  ]})
  console.log('  ✓ student profiles')

  // ── 4. Lecturer profiles ──────────────────────────────────────────────────
  await prisma.lecturer.createMany({ data: [
    { id: LEC[1], userId: U_L[1], fullName: 'Dr. Amirul Hassan bin Kamaruddin', staffNumber: 'UCSI/STF/2015/001', department: 'School of Information Technology' },
    { id: LEC[2], userId: U_L[2], fullName: 'Ms. Siti Norzahra binti Jamaluddin', staffNumber: 'UCSI/STF/2019/002', department: 'School of Business Management' },
    { id: LEC[3], userId: U_L[3], fullName: 'Mr. Khairul Azwan bin Ismail', staffNumber: 'UCSI/STF/2017/003', department: 'School of Information Technology' },
    { id: LEC[4], userId: U_L[4], fullName: 'Mr. Rashid bin Ahmad', staffNumber: 'UCSI/STF/2020/004', department: 'School of Accounting & Finance' },
    { id: LEC[5], userId: U_L[5], fullName: 'Dr. Sarah Tan Wei Ling', staffNumber: 'UCSI/STF/2018/005', department: 'School of Information Technology' },
  ]})
  console.log('  ✓ lecturer profiles')

  // ── 5. Programmes ─────────────────────────────────────────────────────────
  await prisma.programme.createMany({ data: [
    { id: PROG_DIT, code: 'DIT', name: 'Diploma in Information Technology',  totalCredits: 90, durationYears: 3, isActive: true  },
    { id: PROG_DBM, code: 'DBM', name: 'Diploma in Business Management',      totalCredits: 90, durationYears: 3, isActive: true  },
    { id: PROG_DAC, code: 'DAC', name: 'Diploma in Accounting',               totalCredits: 90, durationYears: 3, isActive: true  },
  ]})
  console.log('  ✓ programmes')

  // ── 6. Semesters ──────────────────────────────────────────────────────────
  await prisma.semester.createMany({ data: [
    // DIT
    { id: SEM_DIT_1, programmeId: PROG_DIT, name: 'Semester 1 2022/23', academicYear: 2022, semesterNumber: 1, startDate: d('2022-09-01'), endDate: d('2023-01-31'), isCurrent: false },
    { id: SEM_DIT_2, programmeId: PROG_DIT, name: 'Semester 2 2022/23', academicYear: 2022, semesterNumber: 2, startDate: d('2023-03-01'), endDate: d('2023-07-31'), isCurrent: false },
    { id: SEM_DIT_3, programmeId: PROG_DIT, name: 'Semester 1 2023/24', academicYear: 2023, semesterNumber: 1, startDate: d('2023-09-01'), endDate: d('2024-01-31'), isCurrent: true  },
    // DBM & DAC (one semester each — current)
    { id: SEM_DBM_1, programmeId: PROG_DBM, name: 'Semester 1 2023/24', academicYear: 2023, semesterNumber: 1, startDate: d('2023-09-01'), endDate: d('2024-01-31'), isCurrent: true  },
    { id: SEM_DAC_1, programmeId: PROG_DAC, name: 'Semester 1 2023/24', academicYear: 2023, semesterNumber: 1, startDate: d('2023-09-01'), endDate: d('2024-01-31'), isCurrent: true  },
  ]})
  console.log('  ✓ semesters')

  // ── 7. Courses ────────────────────────────────────────────────────────────
  await prisma.course.createMany({ data: [
    // DIT Sem 1 — past
    { id: C.dit1013, code: 'DIT1013', title: 'Computer Fundamentals',      credits: 3, type: CourseType.CORE },
    { id: C.dit1023, code: 'DIT1023', title: 'Introduction to Programming', credits: 3, type: CourseType.CORE },
    { id: C.dit1033, code: 'DIT1033', title: 'Mathematics for Computing',   credits: 3, type: CourseType.CORE },
    { id: C.dit1043, code: 'DIT1043', title: 'Introduction to IT',          credits: 2, type: CourseType.CORE },
    { id: C.mpw1133, code: 'MPW1133', title: 'Bahasa Malaysia Komunikasi 1',credits: 2, type: CourseType.MPW, mqaRequirement: true },
    // DIT Sem 2 — past
    { id: C.dit2013, code: 'DIT2013', title: 'Object-Oriented Programming', credits: 3, type: CourseType.CORE },
    { id: C.dit2023, code: 'DIT2023', title: 'Computer Networks',           credits: 3, type: CourseType.CORE },
    { id: C.dit2033, code: 'DIT2033', title: 'System Analysis & Design',    credits: 3, type: CourseType.CORE },
    { id: C.dit2043, code: 'DIT2043', title: 'Statistics for IT',           credits: 3, type: CourseType.CORE },
    { id: C.mpw2143, code: 'MPW2143', title: 'English Communication',       credits: 2, type: CourseType.MPW, mqaRequirement: true },
    // Current semester
    { id: C.dit7044, code: 'DIT7044', title: 'Human Computer Interaction',  credits: 3, type: CourseType.CORE },
    { id: C.dit7021, code: 'DIT7021', title: 'Database Management Systems', credits: 3, type: CourseType.CORE },
    { id: C.dit7031, code: 'DIT7031', title: 'Web Application Development', credits: 3, type: CourseType.CORE },
    { id: C.mpw1143, code: 'MPW1143', title: 'Bahasa Malaysia Komunikasi 2',credits: 2, type: CourseType.MPW, mqaRequirement: true },
    // DBM & DAC own-programme courses
    { id: C.dbm1013, code: 'DBM1013', title: 'Business Fundamentals',        credits: 3, type: CourseType.CORE },
    { id: C.acc1013, code: 'ACC1013', title: 'Principles of Accounting',      credits: 3, type: CourseType.CORE },
  ]})
  console.log('  ✓ courses')

  // ── 8. Course Sections ────────────────────────────────────────────────────
  // dayOfWeek: 0=Monday…6=Sunday (schema convention)
  await prisma.courseSection.createMany({ data: [
    // ── Current semester (sem3) ──
    { id: SEC.s001, courseId: C.dit7044, semesterId: SEM_DIT_3, sectionCode: 'A', room: 'A-301',  dayOfWeek: 0, timeStart: hhmm('09:00'), timeEnd: hhmm('11:00'), maxCapacity: 35 },
    { id: SEC.s002, courseId: C.dit7021, semesterId: SEM_DIT_3, sectionCode: 'B', room: 'B-204',  dayOfWeek: 1, timeStart: hhmm('14:00'), timeEnd: hhmm('16:00'), maxCapacity: 30 },
    { id: SEC.s003, courseId: C.dit7031, semesterId: SEM_DIT_3, sectionCode: 'A', room: 'Lab-1',  dayOfWeek: 2, timeStart: hhmm('10:00'), timeEnd: hhmm('12:00'), maxCapacity: 30 },
    { id: SEC.s004, courseId: C.mpw1143, semesterId: SEM_DIT_3, sectionCode: 'A', room: 'C-101',  dayOfWeek: 3, timeStart: hhmm('08:00'), timeEnd: hhmm('10:00'), maxCapacity: 40 },
    // ── DBM & DAC current ──
    { id: SEC.dbm001, courseId: C.dbm1013, semesterId: SEM_DBM_1, sectionCode: 'A', room: 'B-301', dayOfWeek: 1, timeStart: hhmm('09:00'), timeEnd: hhmm('11:00'), maxCapacity: 35 },
    { id: SEC.dac001, courseId: C.acc1013, semesterId: SEM_DAC_1, sectionCode: 'A', room: 'C-201', dayOfWeek: 3, timeStart: hhmm('09:00'), timeEnd: hhmm('11:00'), maxCapacity: 35 },
    // ── Past sem-1 ──
    { id: SEC.p1_1, courseId: C.dit1013, semesterId: SEM_DIT_1, sectionCode: 'A', room: 'A-201',  dayOfWeek: 0, timeStart: hhmm('09:00'), timeEnd: hhmm('11:00'), maxCapacity: 35 },
    { id: SEC.p1_2, courseId: C.dit1023, semesterId: SEM_DIT_1, sectionCode: 'A', room: 'Lab-2',  dayOfWeek: 1, timeStart: hhmm('10:00'), timeEnd: hhmm('12:00'), maxCapacity: 30 },
    { id: SEC.p1_3, courseId: C.dit1033, semesterId: SEM_DIT_1, sectionCode: 'A', room: 'A-202',  dayOfWeek: 2, timeStart: hhmm('08:00'), timeEnd: hhmm('10:00'), maxCapacity: 35 },
    { id: SEC.p1_4, courseId: C.dit1043, semesterId: SEM_DIT_1, sectionCode: 'A', room: 'B-101',  dayOfWeek: 3, timeStart: hhmm('14:00'), timeEnd: hhmm('16:00'), maxCapacity: 40 },
    { id: SEC.p1_5, courseId: C.mpw1133, semesterId: SEM_DIT_1, sectionCode: 'A', room: 'C-201',  dayOfWeek: 4, timeStart: hhmm('11:00'), timeEnd: hhmm('13:00'), maxCapacity: 40 },
    // ── Past sem-2 ──
    { id: SEC.p2_1, courseId: C.dit2013, semesterId: SEM_DIT_2, sectionCode: 'A', room: 'Lab-2',  dayOfWeek: 0, timeStart: hhmm('10:00'), timeEnd: hhmm('12:00'), maxCapacity: 30 },
    { id: SEC.p2_2, courseId: C.dit2023, semesterId: SEM_DIT_2, sectionCode: 'A', room: 'A-301',  dayOfWeek: 1, timeStart: hhmm('09:00'), timeEnd: hhmm('11:00'), maxCapacity: 35 },
    { id: SEC.p2_3, courseId: C.dit2033, semesterId: SEM_DIT_2, sectionCode: 'A', room: 'B-203',  dayOfWeek: 2, timeStart: hhmm('14:00'), timeEnd: hhmm('16:00'), maxCapacity: 35 },
    { id: SEC.p2_4, courseId: C.dit2043, semesterId: SEM_DIT_2, sectionCode: 'A', room: 'A-204',  dayOfWeek: 3, timeStart: hhmm('08:00'), timeEnd: hhmm('10:00'), maxCapacity: 35 },
    { id: SEC.p2_5, courseId: C.mpw2143, semesterId: SEM_DIT_2, sectionCode: 'A', room: 'C-202',  dayOfWeek: 4, timeStart: hhmm('11:00'), timeEnd: hhmm('13:00'), maxCapacity: 40 },
  ]})
  console.log('  ✓ course sections')

  // ── 9. Programme Enrollments ──────────────────────────────────────────────
  await prisma.programmeEnrollment.createMany({ data: [
    { id: PE[1], studentId: STU[1], programmeId: PROG_DIT, fileNumber: 'DIT-2022-001', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[2], studentId: STU[2], programmeId: PROG_DIT, fileNumber: 'DIT-2022-002', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[3], studentId: STU[3], programmeId: PROG_DIT, fileNumber: 'DIT-2022-003', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[4], studentId: STU[4], programmeId: PROG_DBM, fileNumber: 'DBM-2022-001', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[5], studentId: STU[5], programmeId: PROG_DBM, fileNumber: 'DBM-2022-002', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[6], studentId: STU[6], programmeId: PROG_DAC, fileNumber: 'DAC-2022-001', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[7], studentId: STU[7], programmeId: PROG_DIT, fileNumber: 'DIT-2022-004', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.ACTIVE },
    { id: PE[8], studentId: STU[8], programmeId: PROG_DIT, fileNumber: 'DIT-2022-005', intakeDate: d('2022-09-01'), expectedGradDate: d('2025-08-31'), admitDate: d('2022-08-15'), status: ProgrammeEnrollmentStatus.WITHDRAWN },
  ]})
  console.log('  ✓ programme enrollments')

  // ── 10. Student Section Enrollments ──────────────────────────────────────
  await prisma.studentSectionEnrollment.createMany({ data: [
    // stu1 — current 4 sections
    { id: SSE.s1_001, studentId: STU[1], courseSectionId: SEC.s001, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_002, studentId: STU[1], courseSectionId: SEC.s002, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_003, studentId: STU[1], courseSectionId: SEC.s003, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_004, studentId: STU[1], courseSectionId: SEC.s004, status: SectionEnrollmentStatus.ENROLLED },
    // stu1 — past sem-1 (5 sections)
    { id: SSE.s1_p1_1, studentId: STU[1], courseSectionId: SEC.p1_1, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p1_2, studentId: STU[1], courseSectionId: SEC.p1_2, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p1_3, studentId: STU[1], courseSectionId: SEC.p1_3, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p1_4, studentId: STU[1], courseSectionId: SEC.p1_4, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p1_5, studentId: STU[1], courseSectionId: SEC.p1_5, status: SectionEnrollmentStatus.ENROLLED },
    // stu1 — past sem-2 (5 sections)
    { id: SSE.s1_p2_1, studentId: STU[1], courseSectionId: SEC.p2_1, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p2_2, studentId: STU[1], courseSectionId: SEC.p2_2, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p2_3, studentId: STU[1], courseSectionId: SEC.p2_3, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p2_4, studentId: STU[1], courseSectionId: SEC.p2_4, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s1_p2_5, studentId: STU[1], courseSectionId: SEC.p2_5, status: SectionEnrollmentStatus.ENROLLED },
    // Other students — single current section
    { id: SSE.s2_001, studentId: STU[2], courseSectionId: SEC.s001, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s3_003, studentId: STU[3], courseSectionId: SEC.s003, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s4_002, studentId: STU[4], courseSectionId: SEC.dbm001, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s5_002, studentId: STU[5], courseSectionId: SEC.dbm001, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s6_004, studentId: STU[6], courseSectionId: SEC.dac001, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s7_003, studentId: STU[7], courseSectionId: SEC.s003, status: SectionEnrollmentStatus.ENROLLED },
    { id: SSE.s8_001, studentId: STU[8], courseSectionId: SEC.s001, status: SectionEnrollmentStatus.DROPPED },
  ]})
  console.log('  ✓ section enrollments')

  // ── 11. Teaching Assignments ──────────────────────────────────────────────
  await prisma.teachingAssignment.createMany({ data: [
    { id: TA.l1_s001, lecturerId: LEC[1], courseSectionId: SEC.s001 }, // Amirul → HCI sec-A
    { id: TA.l2_s002, lecturerId: LEC[2], courseSectionId: SEC.s002 }, // Siti   → DBMS sec-B
    { id: TA.l3_s003, lecturerId: LEC[3], courseSectionId: SEC.s003 }, // Khairul→ WAD sec-A
    { id: TA.l3_s004, lecturerId: LEC[3], courseSectionId: SEC.s004 }, // Khairul→ BM sec-A
    { id: TA.l5_s001, lecturerId: LEC[5], courseSectionId: SEC.s001 }, // Sarah  → HCI sec-A (co-assigned)
    { id: TA.l5_s003, lecturerId: LEC[5], courseSectionId: SEC.s003 }, // Sarah  → WAD sec-A (co-assigned)
    { id: TA.l2_dbm001, lecturerId: LEC[2], courseSectionId: SEC.dbm001 }, // Siti   → DBM sec-A
    { id: TA.l2_dac001, lecturerId: LEC[2], courseSectionId: SEC.dac001 }, // Siti   → DAC sec-A
  ]})
  console.log('  ✓ teaching assignments')

  // ── 12. Results ───────────────────────────────────────────────────────────
  // Current semester — two published, two in-progress
  await prisma.result.createMany({ data: [
    { id: RES.s1_001, studentSectionEnrollmentId: SSE.s1_001, grade: 'A',  standing: 'Pass',        attendancePercentage: 92, isPublished: true  },
    { id: RES.s1_002, studentSectionEnrollmentId: SSE.s1_002, grade: 'B+', standing: 'Pass',        attendancePercentage: 88, isPublished: true  },
    { id: RES.s1_003, studentSectionEnrollmentId: SSE.s1_003, grade: '',   standing: 'In Progress', attendancePercentage: 85, isPublished: false },
    { id: RES.s1_004, studentSectionEnrollmentId: SSE.s1_004, grade: '',   standing: 'In Progress', attendancePercentage: 78, isPublished: false },
    // Sem-1 historical (all published)
    { id: RES.p1_1, studentSectionEnrollmentId: SSE.s1_p1_1, grade: 'A',  standing: 'Pass', attendancePercentage: 95, isPublished: true },
    { id: RES.p1_2, studentSectionEnrollmentId: SSE.s1_p1_2, grade: 'B+', standing: 'Pass', attendancePercentage: 90, isPublished: true },
    { id: RES.p1_3, studentSectionEnrollmentId: SSE.s1_p1_3, grade: 'A-', standing: 'Pass', attendancePercentage: 88, isPublished: true },
    { id: RES.p1_4, studentSectionEnrollmentId: SSE.s1_p1_4, grade: 'A',  standing: 'Pass', attendancePercentage: 92, isPublished: true },
    { id: RES.p1_5, studentSectionEnrollmentId: SSE.s1_p1_5, grade: 'B+', standing: 'Pass', attendancePercentage: 85, isPublished: true },
    // Sem-2 historical (all published)
    { id: RES.p2_1, studentSectionEnrollmentId: SSE.s1_p2_1, grade: 'B+', standing: 'Pass', attendancePercentage: 87, isPublished: true },
    { id: RES.p2_2, studentSectionEnrollmentId: SSE.s1_p2_2, grade: 'A-', standing: 'Pass', attendancePercentage: 90, isPublished: true },
    { id: RES.p2_3, studentSectionEnrollmentId: SSE.s1_p2_3, grade: 'B',  standing: 'Pass', attendancePercentage: 82, isPublished: true },
    { id: RES.p2_4, studentSectionEnrollmentId: SSE.s1_p2_4, grade: 'A',  standing: 'Pass', attendancePercentage: 93, isPublished: true },
    { id: RES.p2_5, studentSectionEnrollmentId: SSE.s1_p2_5, grade: 'B+', standing: 'Pass', attendancePercentage: 88, isPublished: true },
  ]})
  console.log('  ✓ results')

  // ── 13. Attendance ────────────────────────────────────────────────────────
  // stu1 attendance across all 4 current sections, 10 sessions each
  const stu1Att: Prisma.AttendanceCreateManyInput[] = [
    // sec-001 HCI (Mondays from 2023-09-04 — within SEM_DIT_3 2023-09-01..2024-01-31)
    ...([
      ['2023-09-04', AttendanceStatus.PRESENT],
      ['2023-09-11', AttendanceStatus.PRESENT],
      ['2023-09-18', AttendanceStatus.ABSENT],
      ['2023-09-25', AttendanceStatus.PRESENT],
      ['2023-10-02', AttendanceStatus.LATE],
      ['2023-10-09', AttendanceStatus.PRESENT],
      ['2023-10-16', AttendanceStatus.PRESENT],
      ['2023-10-23', AttendanceStatus.ABSENT],
      ['2023-10-30', AttendanceStatus.PRESENT],
      ['2023-11-06', AttendanceStatus.PRESENT],
    ] as [string, AttendanceStatus][]).map(([dt, st]) => ({
      id: `16000000-0001-0001-${dt.replace(/-/g, '').slice(4)}-000000000001`,
      studentId: STU[1], courseSectionId: SEC.s001, date: d(dt), status: st, recordedBy: U_L[1],
    })),
    // sec-002 DBMS (Tuesdays from 2023-09-05)
    ...([
      ['2023-09-05', AttendanceStatus.PRESENT],
      ['2023-09-12', AttendanceStatus.ABSENT],
      ['2023-09-19', AttendanceStatus.PRESENT],
      ['2023-09-26', AttendanceStatus.PRESENT],
      ['2023-10-03', AttendanceStatus.PRESENT],
      ['2023-10-10', AttendanceStatus.EXCUSED],
      ['2023-10-17', AttendanceStatus.PRESENT],
      ['2023-10-24', AttendanceStatus.PRESENT],
      ['2023-10-31', AttendanceStatus.PRESENT],
      ['2023-11-07', AttendanceStatus.LATE],
    ] as [string, AttendanceStatus][]).map(([dt, st]) => ({
      id: `16000000-0001-0002-${dt.replace(/-/g, '').slice(4)}-000000000001`,
      studentId: STU[1], courseSectionId: SEC.s002, date: d(dt), status: st, recordedBy: U_L[2],
    })),
    // sec-003 WAD (Wednesdays from 2023-09-06)
    ...([
      ['2023-09-06', AttendanceStatus.PRESENT],
      ['2023-09-13', AttendanceStatus.PRESENT],
      ['2023-09-20', AttendanceStatus.PRESENT],
      ['2023-09-27', AttendanceStatus.ABSENT],
      ['2023-10-04', AttendanceStatus.PRESENT],
      ['2023-10-11', AttendanceStatus.PRESENT],
      ['2023-10-18', AttendanceStatus.PRESENT],
      ['2023-10-25', AttendanceStatus.LATE],
      ['2023-11-01', AttendanceStatus.PRESENT],
      ['2023-11-08', AttendanceStatus.PRESENT],
    ] as [string, AttendanceStatus][]).map(([dt, st]) => ({
      id: `16000000-0001-0003-${dt.replace(/-/g, '').slice(4)}-000000000001`,
      studentId: STU[1], courseSectionId: SEC.s003, date: d(dt), status: st, recordedBy: U_L[3],
    })),
    // sec-004 BM (Thursdays from 2023-09-07)
    ...([
      ['2023-09-07', AttendanceStatus.PRESENT],
      ['2023-09-14', AttendanceStatus.PRESENT],
      ['2023-09-21', AttendanceStatus.ABSENT],
      ['2023-09-28', AttendanceStatus.PRESENT],
      ['2023-10-05', AttendanceStatus.ABSENT],
      ['2023-10-12', AttendanceStatus.PRESENT],
      ['2023-10-19', AttendanceStatus.PRESENT],
      ['2023-10-26', AttendanceStatus.PRESENT],
      ['2023-11-02', AttendanceStatus.PRESENT],
      ['2023-11-09', AttendanceStatus.PRESENT],
    ] as [string, AttendanceStatus][]).map(([dt, st]) => ({
      id: `16000000-0001-0004-${dt.replace(/-/g, '').slice(4)}-000000000001`,
      studentId: STU[1], courseSectionId: SEC.s004, date: d(dt), status: st, recordedBy: U_L[3],
    })),
  ]

  // Other students — 5 sessions each in their primary section (within semester 2023-09-01..2024-01-31)
  const otherAtt: Prisma.AttendanceCreateManyInput[] = [
    // stu2 in sec-001 (Mondays from 2023-09-04)
    { id: '16000000-0002-0001-0904-000000000001', studentId: STU[2], courseSectionId: SEC.s001, date: d('2023-09-04'), status: AttendanceStatus.PRESENT, recordedBy: U_L[1] },
    { id: '16000000-0002-0001-0911-000000000001', studentId: STU[2], courseSectionId: SEC.s001, date: d('2023-09-11'), status: AttendanceStatus.PRESENT, recordedBy: U_L[1] },
    { id: '16000000-0002-0001-0918-000000000001', studentId: STU[2], courseSectionId: SEC.s001, date: d('2023-09-18'), status: AttendanceStatus.LATE,    recordedBy: U_L[1] },
    { id: '16000000-0002-0001-0925-000000000001', studentId: STU[2], courseSectionId: SEC.s001, date: d('2023-09-25'), status: AttendanceStatus.PRESENT, recordedBy: U_L[1] },
    { id: '16000000-0002-0001-1002-000000000001', studentId: STU[2], courseSectionId: SEC.s001, date: d('2023-10-02'), status: AttendanceStatus.PRESENT, recordedBy: U_L[1] },
    // stu3 in sec-003 (Wednesdays from 2023-09-06)
    { id: '16000000-0003-0003-0906-000000000001', studentId: STU[3], courseSectionId: SEC.s003, date: d('2023-09-06'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    { id: '16000000-0003-0003-0913-000000000001', studentId: STU[3], courseSectionId: SEC.s003, date: d('2023-09-13'), status: AttendanceStatus.ABSENT,  recordedBy: U_L[3] },
    { id: '16000000-0003-0003-0920-000000000001', studentId: STU[3], courseSectionId: SEC.s003, date: d('2023-09-20'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    { id: '16000000-0003-0003-0927-000000000001', studentId: STU[3], courseSectionId: SEC.s003, date: d('2023-09-27'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    { id: '16000000-0003-0003-1004-000000000001', studentId: STU[3], courseSectionId: SEC.s003, date: d('2023-10-04'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    // stu4 in dbm001 (Tuesdays from 2023-09-05)
    { id: '16000000-0004-0002-0905-000000000001', studentId: STU[4], courseSectionId: SEC.dbm001, date: d('2023-09-05'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0004-0002-0912-000000000001', studentId: STU[4], courseSectionId: SEC.dbm001, date: d('2023-09-12'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0004-0002-0919-000000000001', studentId: STU[4], courseSectionId: SEC.dbm001, date: d('2023-09-19'), status: AttendanceStatus.EXCUSED, recordedBy: U_L[2] },
    { id: '16000000-0004-0002-0926-000000000001', studentId: STU[4], courseSectionId: SEC.dbm001, date: d('2023-09-26'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0004-0002-1003-000000000001', studentId: STU[4], courseSectionId: SEC.dbm001, date: d('2023-10-03'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    // stu5 in dbm001 (Tuesdays from 2023-09-05)
    { id: '16000000-0005-0002-0905-000000000001', studentId: STU[5], courseSectionId: SEC.dbm001, date: d('2023-09-05'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0005-0002-0912-000000000001', studentId: STU[5], courseSectionId: SEC.dbm001, date: d('2023-09-12'), status: AttendanceStatus.ABSENT,  recordedBy: U_L[2] },
    { id: '16000000-0005-0002-0919-000000000001', studentId: STU[5], courseSectionId: SEC.dbm001, date: d('2023-09-19'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0005-0002-0926-000000000001', studentId: STU[5], courseSectionId: SEC.dbm001, date: d('2023-09-26'), status: AttendanceStatus.LATE,    recordedBy: U_L[2] },
    { id: '16000000-0005-0002-1003-000000000001', studentId: STU[5], courseSectionId: SEC.dbm001, date: d('2023-10-03'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    // stu6 in dac001 (Thursdays from 2023-09-07 — within SEM_DAC_1 2023-09-01..2024-01-31)
    { id: '16000000-0006-0032-0907-000000000001', studentId: STU[6], courseSectionId: SEC.dac001, date: d('2023-09-07'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0006-0032-0914-000000000001', studentId: STU[6], courseSectionId: SEC.dac001, date: d('2023-09-14'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0006-0032-0921-000000000001', studentId: STU[6], courseSectionId: SEC.dac001, date: d('2023-09-21'), status: AttendanceStatus.ABSENT,  recordedBy: U_L[2] },
    { id: '16000000-0006-0032-0928-000000000001', studentId: STU[6], courseSectionId: SEC.dac001, date: d('2023-09-28'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    { id: '16000000-0006-0032-1005-000000000001', studentId: STU[6], courseSectionId: SEC.dac001, date: d('2023-10-05'), status: AttendanceStatus.PRESENT, recordedBy: U_L[2] },
    // stu7 in sec-003 (Wednesdays from 2023-09-06)
    { id: '16000000-0007-0003-0906-000000000001', studentId: STU[7], courseSectionId: SEC.s003, date: d('2023-09-06'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    { id: '16000000-0007-0003-0913-000000000001', studentId: STU[7], courseSectionId: SEC.s003, date: d('2023-09-13'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    { id: '16000000-0007-0003-0920-000000000001', studentId: STU[7], courseSectionId: SEC.s003, date: d('2023-09-20'), status: AttendanceStatus.ABSENT,  recordedBy: U_L[3] },
    { id: '16000000-0007-0003-0927-000000000001', studentId: STU[7], courseSectionId: SEC.s003, date: d('2023-09-27'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
    { id: '16000000-0007-0003-1004-000000000001', studentId: STU[7], courseSectionId: SEC.s003, date: d('2023-10-04'), status: AttendanceStatus.PRESENT, recordedBy: U_L[3] },
  ]

  await prisma.attendance.createMany({ data: [...stu1Att, ...otherAtt] })
  console.log('  ✓ attendance')

  // ── 14. Invoices ──────────────────────────────────────────────────────────
  // Composite FK constraint: each invoice's (programmeEnrollmentId, studentId) must
  // reference ProgrammeEnrollment(id, studentId) — enforced at DB level.
  await prisma.invoice.createMany({ data: [
    // stu1 — 3 invoices (sem1 paid, sem2 paid, sem3 partial)
    { id: INV[1], studentId: STU[1], programmeEnrollmentId: PE[1], invoiceNumber: 'INV-2022-0001', tuitionFee: 4465.20, lessAmount: 0, status: InvoiceStatus.PAID,    dueDate: d('2022-10-31'), programmeSemester: 'Sem 1 2022/23', issuedAt: d('2022-09-01') },
    { id: INV[2], studentId: STU[1], programmeEnrollmentId: PE[1], invoiceNumber: 'INV-2023-0001', tuitionFee: 4465.20, lessAmount: 0, status: InvoiceStatus.PAID,    dueDate: d('2023-04-30'), programmeSemester: 'Sem 2 2022/23', issuedAt: d('2023-03-01') },
    { id: INV[3], studentId: STU[1], programmeEnrollmentId: PE[1], invoiceNumber: 'INV-2023-0002', tuitionFee: 4465.20, lessAmount: 0, status: InvoiceStatus.PARTIAL, dueDate: d('2023-11-30'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
    // Other students — one invoice each (current semester)
    { id: INV[4], studentId: STU[2], programmeEnrollmentId: PE[2], invoiceNumber: 'INV-2023-0101', tuitionFee: 4465.20, lessAmount: 0, status: InvoiceStatus.PAID,    dueDate: d('2023-11-30'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
    { id: INV[5], studentId: STU[3], programmeEnrollmentId: PE[3], invoiceNumber: 'INV-2023-0102', tuitionFee: 4465.20, lessAmount: 0, status: InvoiceStatus.UNPAID,  dueDate: d('2023-11-30'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
    { id: INV[6], studentId: STU[4], programmeEnrollmentId: PE[4], invoiceNumber: 'INV-2023-0103', tuitionFee: 4200.00, lessAmount: 0, status: InvoiceStatus.PAID,    dueDate: d('2023-11-30'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
    { id: INV[7], studentId: STU[5], programmeEnrollmentId: PE[5], invoiceNumber: 'INV-2023-0104', tuitionFee: 4200.00, lessAmount: 0, status: InvoiceStatus.OVERDUE, dueDate: d('2023-10-31'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
    { id: INV[8], studentId: STU[6], programmeEnrollmentId: PE[6], invoiceNumber: 'INV-2023-0105', tuitionFee: 3980.00, lessAmount: 0, status: InvoiceStatus.PAID,    dueDate: d('2023-11-30'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
    { id: INV[9], studentId: STU[7], programmeEnrollmentId: PE[7], invoiceNumber: 'INV-2023-0106', tuitionFee: 4465.20, lessAmount: 0, status: InvoiceStatus.PARTIAL, dueDate: d('2023-11-30'), programmeSemester: 'Sem 1 2023/24', issuedAt: d('2023-09-01') },
  ]})

  // Payments (stu1 sem3 partial + stu7 partial)
  await prisma.payment.createMany({ data: [
    // stu1: paid two invoices in full
    { id: 'f1000000-0000-0000-0000-000000000001', invoiceId: INV[1], transactionNumber: 'TXN-20221015-001', amount: 4465.20, paymentDate: d('2022-10-15'), mode: PaymentMode.ONLINE, referenceNo: 'FPX-20221015-11111', status: PaymentStatus.COMPLETED },
    { id: 'f1000000-0000-0000-0000-000000000002', invoiceId: INV[2], transactionNumber: 'TXN-20230415-001', amount: 4465.20, paymentDate: d('2023-04-15'), mode: PaymentMode.ONLINE, referenceNo: 'FPX-20230415-22222', status: PaymentStatus.COMPLETED },
    // stu1 sem3: partial payment
    { id: 'f1000000-0000-0000-0000-000000000003', invoiceId: INV[3], transactionNumber: 'TXN-20231015-001', amount: 2885.20, paymentDate: d('2023-10-15'), mode: PaymentMode.ONLINE, referenceNo: 'FPX-20231015-88899', status: PaymentStatus.COMPLETED },
    // stu2: full payment
    { id: 'f1000000-0000-0000-0000-000000000004', invoiceId: INV[4], transactionNumber: 'TXN-20231020-001', amount: 4465.20, paymentDate: d('2023-10-20'), mode: PaymentMode.TRANSFER, referenceNo: 'TRF-20231020-33333', status: PaymentStatus.COMPLETED },
    // stu4: full payment
    { id: 'f1000000-0000-0000-0000-000000000005', invoiceId: INV[6], transactionNumber: 'TXN-20231018-001', amount: 4200.00, paymentDate: d('2023-10-18'), mode: PaymentMode.ONLINE, referenceNo: 'FPX-20231018-44444', status: PaymentStatus.COMPLETED },
    // stu6: full payment
    { id: 'f1000000-0000-0000-0000-000000000006', invoiceId: INV[8], transactionNumber: 'TXN-20231022-001', amount: 3980.00, paymentDate: d('2023-10-22'), mode: PaymentMode.CASH, status: PaymentStatus.COMPLETED },
    // stu7: partial payment
    { id: 'f1000000-0000-0000-0000-000000000007', invoiceId: INV[9], transactionNumber: 'TXN-20231019-001', amount: 2000.00, paymentDate: d('2023-10-19'), mode: PaymentMode.ONLINE, referenceNo: 'FPX-20231019-55555', status: PaymentStatus.COMPLETED },
  ]})
  console.log('  ✓ invoices + payments')

  // ── 15. Learning Resources ────────────────────────────────────────────────
  await prisma.learningResource.createMany({ data: [
    // sec-001: HCI — lec-001
    { id: LR.r01, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Week 1 – Introduction to HCI',             description: 'Lecture slides covering HCI principles and history.',                              type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-05T09:00:00Z'), updatedAt: d('2023-09-05T09:00:00Z') },
    { id: LR.r02, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Week 2 – User Research Methods',           description: 'Slides on user interviews, surveys, and contextual inquiry.',                      type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-12T09:00:00Z'), updatedAt: d('2023-09-12T09:00:00Z') },
    { id: LR.r03, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Week 3 – Prototyping & Wireframing',       description: 'Slides on low-fi vs high-fi prototyping approaches.',                              type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-19T09:00:00Z'), updatedAt: d('2023-09-19T09:00:00Z') },
    { id: LR.r04, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Tutorial 1 – User Research Practice',      description: 'Hands-on exercises for conducting user interviews and affinity mapping.',            type: ResourceType.TUTORIAL,   isPublished: true,  createdAt: d('2023-09-13T09:00:00Z'), updatedAt: d('2023-09-13T09:00:00Z') },
    { id: LR.r05, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Tutorial 2 – Usability Evaluation',        description: "Heuristic evaluation using Nielsen's 10 usability principles.",                     type: ResourceType.TUTORIAL,   isPublished: true,  createdAt: d('2023-09-20T09:00:00Z'), updatedAt: d('2023-09-20T09:00:00Z') },
    { id: LR.r06, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Assignment 1 – Persona & User Journey Map',description: 'Create personas and a user journey map for a library management system.',          type: ResourceType.ASSIGNMENT, isPublished: true,  createdAt: d('2023-09-15T09:00:00Z'), updatedAt: d('2023-09-15T09:00:00Z') },
    { id: LR.r07, courseSectionId: SEC.s001, uploadedBy: LEC[1], title: 'Assignment 2 – Prototype & Usability Report', description: 'Design a mid-fidelity prototype and conduct a usability test.',               type: ResourceType.ASSIGNMENT, isPublished: true,  createdAt: d('2023-09-28T09:00:00Z'), updatedAt: d('2023-09-28T09:00:00Z') },
    // sec-002: DBMS — lec-002
    { id: LR.r08, courseSectionId: SEC.s002, uploadedBy: LEC[2], title: 'Week 1 – Introduction to Databases',       description: 'Relational model, DBMS concepts, and SQL overview.',                               type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-06T10:00:00Z'), updatedAt: d('2023-09-06T10:00:00Z') },
    { id: LR.r09, courseSectionId: SEC.s002, uploadedBy: LEC[2], title: 'Week 2 – SQL: DDL & DML',                  description: 'CREATE, ALTER, INSERT, UPDATE, DELETE statements with examples.',                   type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-13T10:00:00Z'), updatedAt: d('2023-09-13T10:00:00Z') },
    { id: LR.r10, courseSectionId: SEC.s002, uploadedBy: LEC[2], title: 'Tutorial 1 – Basic SQL Queries',           description: 'Practice SELECT with WHERE, ORDER BY, GROUP BY, and JOIN clauses.',                 type: ResourceType.TUTORIAL,   isPublished: true,  createdAt: d('2023-09-14T10:00:00Z'), updatedAt: d('2023-09-14T10:00:00Z') },
    { id: LR.r11, courseSectionId: SEC.s002, uploadedBy: LEC[2], title: 'Assignment 1 – ER Diagram Design',         description: 'Design an entity-relationship diagram for a hospital management system.',            type: ResourceType.ASSIGNMENT, isPublished: true,  createdAt: d('2023-09-17T10:00:00Z'), updatedAt: d('2023-09-17T10:00:00Z') },
    // sec-003: WAD — lec-003
    { id: LR.r12, courseSectionId: SEC.s003, uploadedBy: LEC[3], title: 'Week 1 – HTML5 & CSS3 Fundamentals',       description: 'Core HTML5 elements, semantic markup, and CSS3 properties.',                        type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-07T11:00:00Z'), updatedAt: d('2023-09-07T11:00:00Z') },
    { id: LR.r13, courseSectionId: SEC.s003, uploadedBy: LEC[3], title: 'Week 2 – Responsive Web Design',           description: 'Flexbox, CSS Grid, and media queries for responsive layouts.',                       type: ResourceType.SLIDE,      isPublished: true,  createdAt: d('2023-09-14T11:00:00Z'), updatedAt: d('2023-09-14T11:00:00Z') },
    { id: LR.r14, courseSectionId: SEC.s003, uploadedBy: LEC[3], title: 'Lab 1 – Build a Portfolio Page',           description: 'Build a simple personal portfolio webpage using HTML5 and CSS3.',                    type: ResourceType.EXERCISE,   isPublished: true,  createdAt: d('2023-09-14T11:00:00Z'), updatedAt: d('2023-09-14T11:00:00Z') },
    { id: LR.r15, courseSectionId: SEC.s003, uploadedBy: LEC[3], title: 'Lab 2 – Responsive Layout Challenge',      description: 'Convert a fixed-width layout to fully responsive using CSS Grid.',                    type: ResourceType.EXERCISE,   isPublished: true,  createdAt: d('2023-09-21T11:00:00Z'), updatedAt: d('2023-09-21T11:00:00Z') },
    { id: LR.r16, courseSectionId: SEC.s003, uploadedBy: LEC[3], title: 'Assignment 1 – Responsive Multi-Page Website', description: 'Design and develop a responsive 4-page website on a topic of your choice.',   type: ResourceType.ASSIGNMENT, isPublished: true,  createdAt: d('2023-09-18T11:00:00Z'), updatedAt: d('2023-09-18T11:00:00Z') },
    // sec-dac001: Accounting — lec-002 (Siti, also teaches DBM)
    { id: LR.r19, courseSectionId: SEC.dac001, uploadedBy: LEC[2], title: 'Week 1 – Introduction to Accounting',        description: 'Lecture slides covering the accounting equation, types of accounts, and double-entry bookkeeping.', type: ResourceType.SLIDE, isPublished: true,  createdAt: d('2023-09-07T10:00:00Z'), updatedAt: d('2023-09-07T10:00:00Z') },
    // sec-001: HCI — lec-005 (co-assigned, draft)
    { id: LR.r17, courseSectionId: SEC.s001, uploadedBy: LEC[5], title: 'Week 4 – Interaction Design Patterns',     description: 'Draft slides covering common interaction design patterns and anti-patterns.',        type: ResourceType.SLIDE,      isPublished: false, createdAt: d('2023-09-26T10:00:00Z'), updatedAt: d('2023-09-26T10:00:00Z') },
    // sec-003: WAD — lec-005 (co-assigned, draft)
    { id: LR.r18, courseSectionId: SEC.s003, uploadedBy: LEC[5], title: 'Week 3 – JavaScript Frameworks Overview',  description: 'Draft slides comparing React, Vue, and Angular for modern web development.',          type: ResourceType.SLIDE,      isPublished: false, createdAt: d('2023-09-21T12:00:00Z'), updatedAt: d('2023-09-21T12:00:00Z') },
  ]})
  console.log('  ✓ learning resources')

  // ── 16. Resource Attachments ──────────────────────────────────────────────
  // storageKey must be globally unique (@@unique constraint)
  await prisma.resourceAttachment.createMany({ data: [
    // sec-001 HCI attachments
    { id: '12000000-0000-0000-0000-000000000001', resourceId: LR.r01, originalFilename: 'week1-intro-hci.pdf',         mimeType: 'application/pdf', fileSizeBytes: BigInt(2_456_789), storageKey: 'uploads/sec-001/week1-intro-hci.pdf',          downloadCount: 34 },
    { id: '12000000-0000-0000-0000-000000000002', resourceId: LR.r02, originalFilename: 'week2-user-research.pdf',     mimeType: 'application/pdf', fileSizeBytes: BigInt(1_890_234), storageKey: 'uploads/sec-001/week2-user-research.pdf',      downloadCount: 28 },
    { id: '12000000-0000-0000-0000-000000000003', resourceId: LR.r03, originalFilename: 'week3-prototyping.pdf',       mimeType: 'application/pdf', fileSizeBytes: BigInt(3_102_456), storageKey: 'uploads/sec-001/week3-prototyping.pdf',        downloadCount: 21 },
    { id: '12000000-0000-0000-0000-000000000004', resourceId: LR.r04, originalFilename: 'tutorial1-user-research.pdf', mimeType: 'application/pdf', fileSizeBytes: BigInt(890_456),   storageKey: 'uploads/sec-001/tutorial1-user-research.pdf', downloadCount: 40 },
    { id: '12000000-0000-0000-0000-000000000005', resourceId: LR.r05, originalFilename: 'tutorial2-usability-eval.pdf',mimeType: 'application/pdf', fileSizeBytes: BigInt(756_123),   storageKey: 'uploads/sec-001/tutorial2-usability-eval.pdf',downloadCount: 33 },
    { id: '12000000-0000-0000-0000-000000000006', resourceId: LR.r06, originalFilename: 'assignment1-brief.pdf',       mimeType: 'application/pdf', fileSizeBytes: BigInt(567_890),   storageKey: 'uploads/sec-001/assignment1-brief.pdf',       downloadCount: 52 },
    { id: '12000000-0000-0000-0000-000000000007', resourceId: LR.r07, originalFilename: 'assignment2-brief.pdf',       mimeType: 'application/pdf', fileSizeBytes: BigInt(612_345),   storageKey: 'uploads/sec-001/assignment2-brief.pdf',       downloadCount: 47 },
    // sec-002 DBMS attachments
    { id: '12000000-0000-0000-0000-000000000008', resourceId: LR.r08, originalFilename: 'week1-intro-databases.pdf',   mimeType: 'application/pdf', fileSizeBytes: BigInt(1_234_567), storageKey: 'uploads/sec-002/week1-intro-databases.pdf',   downloadCount: 19 },
    { id: '12000000-0000-0000-0000-000000000009', resourceId: LR.r09, originalFilename: 'week2-sql-ddl-dml.pdf',       mimeType: 'application/pdf', fileSizeBytes: BigInt(2_045_678), storageKey: 'uploads/sec-002/week2-sql-ddl-dml.pdf',       downloadCount: 15 },
    { id: '12000000-0000-0000-0000-000000000010', resourceId: LR.r10, originalFilename: 'tutorial1-sql-queries.pdf',   mimeType: 'application/pdf', fileSizeBytes: BigInt(678_901),   storageKey: 'uploads/sec-002/tutorial1-sql-queries.pdf',   downloadCount: 27 },
    { id: '12000000-0000-0000-0000-000000000011', resourceId: LR.r11, originalFilename: 'assignment1-er-diagram.pdf',  mimeType: 'application/pdf', fileSizeBytes: BigInt(345_678),   storageKey: 'uploads/sec-002/assignment1-er-diagram.pdf',  downloadCount: 38 },
    // sec-003 WAD attachments
    { id: '12000000-0000-0000-0000-000000000012', resourceId: LR.r12, originalFilename: 'week1-html5-css3.pdf',        mimeType: 'application/pdf', fileSizeBytes: BigInt(3_012_345), storageKey: 'uploads/sec-003/week1-html5-css3.pdf',        downloadCount: 12 },
    { id: '12000000-0000-0000-0000-000000000013', resourceId: LR.r13, originalFilename: 'week2-responsive-design.pdf', mimeType: 'application/pdf', fileSizeBytes: BigInt(2_567_890), storageKey: 'uploads/sec-003/week2-responsive-design.pdf', downloadCount: 9  },
    { id: '12000000-0000-0000-0000-000000000014', resourceId: LR.r14, originalFilename: 'lab1-portfolio.pdf',          mimeType: 'application/pdf', fileSizeBytes: BigInt(456_789),   storageKey: 'uploads/sec-003/lab1-portfolio.pdf',          downloadCount: 18 },
    { id: '12000000-0000-0000-0000-000000000015', resourceId: LR.r15, originalFilename: 'lab2-responsive-challenge.pdf', mimeType: 'application/pdf', fileSizeBytes: BigInt(523_456), storageKey: 'uploads/sec-003/lab2-responsive-challenge.pdf',downloadCount: 14 },
    { id: '12000000-0000-0000-0000-000000000016', resourceId: LR.r16, originalFilename: 'assignment1-website-brief.pdf', mimeType: 'application/pdf', fileSizeBytes: BigInt(789_012), storageKey: 'uploads/sec-003/assignment1-website-brief.pdf',downloadCount: 31 },
    // sec-dac001 Accounting attachment
    { id: '12000000-0000-0000-0000-000000000017', resourceId: LR.r19, originalFilename: 'week1-intro-accounting.pdf',     mimeType: 'application/pdf', fileSizeBytes: BigInt(1_678_901), storageKey: 'uploads/sec-dac001/week1-intro-accounting.pdf', downloadCount: 8  },
  ]})
  console.log('  ✓ resource attachments')

  // ── 17. Class Posts ───────────────────────────────────────────────────────
  // authorId references User.id (not Lecturer.id)
  await prisma.classPost.createMany({ data: [
    // sec-001 HCI — lec-001 (U_L[1])
    { id: CP.p01, courseSectionId: SEC.s001, authorId: U_L[1], type: PostType.URGENT,       title: 'Class Cancelled – Week 5 (12 Oct)',          body: 'No class this Thursday due to public holiday. Assignment 1 submission deadline is moved to 19 Oct. Please review the updated brief under Resources.',                                    isPinned: true,  isPublished: true,  createdAt: d('2023-10-09T08:30:00Z'), updatedAt: d('2023-10-09T08:30:00Z') },
    { id: CP.p02, courseSectionId: SEC.s001, authorId: U_L[1], type: PostType.REMINDER,     title: 'Assignment 1 Reminder – Due This Friday',     body: 'Reminder: Assignment 1 (Persona & User Journey Map) is due this Friday 22 Sep before midnight. Submit via the Student Portal. No extensions will be granted.',              isPinned: false, isPublished: true,  createdAt: d('2023-09-18T09:00:00Z'), updatedAt: d('2023-09-18T09:00:00Z') },
    { id: CP.p03, courseSectionId: SEC.s001, authorId: U_L[1], type: PostType.UPDATE,       title: 'Tutorial 2 Materials Now Available',          body: "Slides and worksheet for Tutorial 2 (Usability Evaluation) have been uploaded under Resources. Please review the materials before Thursday's session.",                        isPinned: false, isPublished: true,  createdAt: d('2023-09-19T16:00:00Z'), updatedAt: d('2023-09-19T16:00:00Z') },
    // sec-002 DBMS — lec-002 (U_L[2])
    { id: CP.p04, courseSectionId: SEC.s002, authorId: U_L[2], type: PostType.UPDATE,       title: 'Assignment 1 Deadline Extended to 24 Sep',   body: 'Due to the lab venue change last week, Assignment 1 (ER Diagram Design) deadline is extended to Sunday 24 Sep, 11:59 PM. No further extensions after this.',              isPinned: false, isPublished: true,  createdAt: d('2023-09-16T14:00:00Z'), updatedAt: d('2023-09-16T14:00:00Z') },
    { id: CP.p05, courseSectionId: SEC.s002, authorId: U_L[2], type: PostType.ANNOUNCEMENT, title: 'Week 3 Lab Moved to Lab-3',                   body: 'Week 3 lab session is relocated from B-204 to Lab-3 due to scheduled maintenance. Same time slot applies. Please be on time.',                                              isPinned: false, isPublished: true,  createdAt: d('2023-09-15T11:00:00Z'), updatedAt: d('2023-09-15T11:00:00Z') },
    // sec-003 WAD — lec-003 (U_L[3])
    { id: CP.p06, courseSectionId: SEC.s003, authorId: U_L[3], type: PostType.URGENT,       title: 'Emergency: Lab Computers Unavailable – Bring Laptop', body: 'Lab-1 computers are down today. Please bring your own laptop. Lab files have been shared via the link emailed this morning. Contact me immediately if you cannot access.', isPinned: true,  isPublished: true,  createdAt: d('2023-09-21T07:45:00Z'), updatedAt: d('2023-09-21T07:45:00Z') },
    { id: CP.p07, courseSectionId: SEC.s003, authorId: U_L[3], type: PostType.ANNOUNCEMENT, title: 'Welcome to Web Application Development',      body: 'Welcome to WAD! Lab 1 brief and marking rubric are now available under Resources. Please read through before our first session. Looking forward to a great semester.',    isPinned: false, isPublished: true,  createdAt: d('2023-09-07T10:00:00Z'), updatedAt: d('2023-09-07T10:00:00Z') },
    // sec-001 HCI — lec-005 (U_L[5], co-assigned)
    { id: CP.p08, courseSectionId: SEC.s001, authorId: U_L[5], type: PostType.ANNOUNCEMENT, title: 'Mid-Semester Feedback Form Now Open',          body: 'Please take 5 minutes to complete the anonymous mid-semester feedback form. Your input helps improve the course. The form closes on Sunday 24 Sep.',                        isPinned: false, isPublished: true,  createdAt: d('2023-09-20T09:00:00Z'), updatedAt: d('2023-09-20T09:00:00Z') },
    // sec-003 WAD — lec-005 (U_L[5], co-assigned)
    { id: CP.p09, courseSectionId: SEC.s003, authorId: U_L[5], type: PostType.REMINDER,     title: 'Assignment 1 Submission Instructions',         body: 'Submit your Assignment 1 ZIP file via the Student Portal under Classes > WAD > Resources. Name your file: StudentID_WAD_A1.zip. Late submissions will not be accepted.', isPinned: false, isPublished: true,  createdAt: d('2023-09-19T11:00:00Z'), updatedAt: d('2023-09-19T11:00:00Z') },
    // Global admin announcement (courseSectionId = null)
    { id: CP.p10, courseSectionId: null,     authorId: U_ADMIN, type: PostType.ANNOUNCEMENT, title: 'Semester 1 2023/24 Timetable Published',     body: 'The official timetable for Semester 1 2023/24 has been published on the Student Portal. Please verify your class schedules and report any discrepancies to the Registry Office by 8 September 2023.', isPinned: true, isPublished: true, createdAt: d('2023-09-01T08:00:00Z'), updatedAt: d('2023-09-01T08:00:00Z') },
    // sec-dac001: Accounting — lec-002 (U_L[2])
    { id: CP.p11, courseSectionId: SEC.dac001, authorId: U_L[2], type: PostType.ANNOUNCEMENT, title: 'Welcome to Principles of Accounting',       body: 'Welcome to ACC1013! Week 1 slides are now available under Resources. Please review the accounting equation before Thursday\'s session.', isPinned: false, isPublished: true, createdAt: d('2023-09-05T10:00:00Z'), updatedAt: d('2023-09-05T10:00:00Z') },
  ]})
  console.log('  ✓ class posts')

  // ── 18. Notifications ─────────────────────────────────────────────────────
  await prisma.notification.createMany({ data: [
    // stu1 — mix of types
    { id: '14000000-0000-0000-0000-000000000001', userId: U_S[1], type: NotificationType.ATTENDANCE_ALERT,  title: 'Attendance Warning – HCI',              body: 'Your attendance in DIT7044 Human Computer Interaction has dropped below 80%. Please consult your lecturer.',                         isRead: false, createdAt: d('2023-10-10T09:00:00Z') },
    { id: '14000000-0000-0000-0000-000000000002', userId: U_S[1], type: NotificationType.FEE_ALERT,         title: 'Outstanding Balance – Sem 1 2023/24',   body: 'Your outstanding balance for Sem 1 2023/24 is RM 1,580.00. Please settle your fees before the due date to avoid late charges.',    isRead: false, createdAt: d('2023-11-01T08:00:00Z') },
    { id: '14000000-0000-0000-0000-000000000003', userId: U_S[1], type: NotificationType.GRADE_PUBLISHED,   title: 'Results Published – HCI',               body: 'Your result for DIT7044 Human Computer Interaction has been published. Log in to the portal to view your grade.',                    isRead: true,  createdAt: d('2023-10-05T14:00:00Z') },
    { id: '14000000-0000-0000-0000-000000000004', userId: U_S[1], type: NotificationType.RESOURCE_UPLOADED, title: 'New Resource – HCI Assignment 2 Brief',  body: 'A new resource "Assignment 2 – Prototype & Usability Report" has been uploaded for DIT7044 Human Computer Interaction.',           isRead: true,  createdAt: d('2023-09-28T09:05:00Z') },
    { id: '14000000-0000-0000-0000-000000000005', userId: U_S[1], type: NotificationType.SYSTEM,            title: 'Semester 1 2023/24 Timetable Published', body: 'Your timetable for Semester 1 2023/24 is now available. Please verify your enrolled sections.',                                    isRead: true,  createdAt: d('2023-09-01T08:05:00Z') },
    // stu2
    { id: '14000000-0000-0000-0000-000000000006', userId: U_S[2], type: NotificationType.RESOURCE_UPLOADED, title: 'New Resource – HCI Tutorial 2',         body: 'Tutorial 2 – Usability Evaluation materials are now available for DIT7044 Human Computer Interaction.',                            isRead: false, createdAt: d('2023-09-20T09:05:00Z') },
    { id: '14000000-0000-0000-0000-000000000007', userId: U_S[2], type: NotificationType.SYSTEM,            title: 'Semester 1 2023/24 Timetable Published', body: 'Your timetable for Semester 1 2023/24 is now available. Please verify your enrolled sections.',                                    isRead: true,  createdAt: d('2023-09-01T08:05:00Z') },
    // stu4 — overdue fee
    { id: '14000000-0000-0000-0000-000000000008', userId: U_S[5], type: NotificationType.FEE_ALERT,         title: 'Overdue Payment – Sem 1 2023/24',       body: 'Your invoice INV-2023-0104 is overdue. Please settle your outstanding balance immediately to avoid academic hold.',                   isRead: false, createdAt: d('2023-11-05T09:00:00Z') },
    // lec1
    { id: '14000000-0000-0000-0000-000000000009', userId: U_L[1], type: NotificationType.SYSTEM,            title: 'Semester 1 2023/24 Teaching Allocation', body: 'Your teaching allocation for Semester 1 2023/24 has been confirmed: DIT7044 HCI Section A.',                                       isRead: true,  createdAt: d('2023-08-25T10:00:00Z') },
    { id: '14000000-0000-0000-0000-000000000010', userId: U_L[5], type: NotificationType.SYSTEM,            title: 'Co-Teaching Assignment Confirmed',       body: 'You have been assigned as co-lecturer for DIT7044 HCI Section A and DIT7031 WAD Section A for Semester 1 2023/24.',               isRead: true,  createdAt: d('2023-08-25T10:05:00Z') },
  ]})
  console.log('  ✓ notifications')

  // ── 19. Feedback ──────────────────────────────────────────────────────────
  await prisma.feedback.createMany({ data: [
    { id: '15000000-0000-0000-0000-000000000001', studentId: STU[1], subject: 'Library access hours',                    body: 'The library closes too early on weekends. Could the hours be extended to 10pm?',                                          status: FeedbackStatus.RESOLVED,     createdAt: d('2023-10-02T10:00:00Z'), resolvedAt: d('2023-10-10T14:30:00Z') },
    { id: '15000000-0000-0000-0000-000000000002', studentId: STU[1], subject: 'Wi-Fi connectivity in Block A',            body: 'The Wi-Fi signal in Block A Level 3 labs is very weak. It affects online submissions during lab sessions.',                 status: FeedbackStatus.UNDER_REVIEW, createdAt: d('2023-10-18T09:15:00Z') },
    { id: '15000000-0000-0000-0000-000000000003', studentId: STU[1], subject: 'Request for additional HCI tutorial slots', body: 'Many students in Section A are struggling with Assignment 1. Could we have an extra tutorial session before the deadline?', status: FeedbackStatus.SUBMITTED,    createdAt: d('2023-10-25T16:00:00Z') },
    { id: '15000000-0000-0000-0000-000000000004', studentId: STU[2], subject: 'Canteen operating hours',                  body: 'The canteen closes before 5pm, which is inconvenient for students with evening classes. Please consider extended hours.',   status: FeedbackStatus.SUBMITTED,    createdAt: d('2023-10-20T13:00:00Z') },
  ]})
  console.log('  ✓ feedback')

  console.log('\n✅ Seed complete.')
  console.log('   Users seeded:   14 (1 admin + 8 students + 5 lecturers)')
  console.log('   Dev password:   "password" (bcrypt hash — Phase 5 replaces with real auth)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
