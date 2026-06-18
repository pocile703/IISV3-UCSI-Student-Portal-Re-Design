import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { GraduationCap, UserCog, UserCheck, UserX } from 'lucide-react'
import { ProgrammeEnrollmentStatus } from '@prisma/client'
import { StatCard } from '@/components/dashboard/StatCard'
import { UserTable } from '@/components/admin/UserTable'
import { prisma } from '@/lib/prisma'
import type { UserPageRow } from '@/types/admin-users'

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const [
    totalStudents,
    totalLecturers,
    totalActive,
    totalInactive,
    rawUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'LECTURER' } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.findMany({
      select: {
        id: true,
        role: true,
        isActive: true,
        emailInstitutional: true,
        student: {
          select: {
            fullName: true,
            studentNumber: true,
            programmeEnrollments: {
              where: { status: ProgrammeEnrollmentStatus.ACTIVE },
              select: { programme: { select: { code: true } } },
              take: 1,
            },
          },
        },
        lecturer: {
          select: {
            fullName: true,
            staffNumber: true,
            department: true,
            teachingAssignments: {
              select: {
                courseSection: {
                  select: { course: { select: { code: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: [{ role: 'asc' }, { emailInstitutional: 'asc' }],
    }),
  ])

  const initialUsers: UserPageRow[] = rawUsers.map((u) => ({
    id: u.id,
    role: u.role as 'STUDENT' | 'LECTURER' | 'ADMIN',
    isActive: u.isActive,
    emailInstitutional: u.emailInstitutional,
    fullName: u.student?.fullName ?? u.lecturer?.fullName ?? null,
    studentNumber: u.student?.studentNumber ?? null,
    programmeCode:
      u.student?.programmeEnrollments[0]?.programme.code ?? null,
    staffNumber: u.lecturer?.staffNumber ?? null,
    department: u.lecturer?.department ?? null,
    sectionCodes:
      u.lecturer?.teachingAssignments.map(
        (ta) => ta.courseSection.course.code,
      ) ?? [],
  }))

  // Snapshot key: forces UserTable remount when any user's role or isActive
  // changes after router.refresh() — same pattern as ClassPostPanel / ResourceManager.
  const usersSnapshotKey = `users:${initialUsers
    .map((u) => `${u.id}:${u.role}:${u.isActive ? 1 : 0}`)
    .join('|')}`

  const currentAdminId = session.user.id ?? ''

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">
          User Management
        </h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          Semester 1 2023/24 · Administrator
        </p>
      </div>

      {/* Stat cards — rendered directly; not passed to UserTable */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Students"
          value={String(totalStudents)}
          sub="Enrolled this semester"
          icon={GraduationCap}
          accent
        />
        <StatCard
          label="Lecturers"
          value={String(totalLecturers)}
          sub="Active staff"
          icon={UserCog}
          accent
        />
        <StatCard
          label="Active"
          value={String(totalActive)}
          sub="Accounts in good standing"
          icon={UserCheck}
          accent
        />
        <StatCard
          label="Inactive"
          value={String(totalInactive)}
          sub="Deactivated accounts"
          icon={UserX}
          accent
        />
      </div>

      {/* User table */}
      <section aria-label="User list">
        <UserTable
          key={usersSnapshotKey}
          initialUsers={initialUsers}
          currentAdminId={currentAdminId}
        />
      </section>

    </div>
  )
}
