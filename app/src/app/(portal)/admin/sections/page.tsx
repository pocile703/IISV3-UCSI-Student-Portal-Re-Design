import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSectionsData, getSectionFormData } from '@/services/section-queries'
import { SectionTable } from '@/components/admin/SectionTable'

export default async function AdminSectionsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const [{ rows, stats }, formData] = await Promise.all([
    getSectionsData(),
    getSectionFormData(),
  ])

  // Snapshot key: changes when any section is created, edited, deactivated, or has its
  // lecturer reassigned. Passed as React `key` to SectionTable — forces remount with
  // fresh props after router.refresh() in SectionModal.
  const snapshotKey = `sections:${rows
    .map((r) => `${r.id}:${r.isActive ? 1 : 0}:${r.lecturerId ?? 'none'}`)
    .join('|')}`

  return (
    <SectionTable
      key={snapshotKey}
      initialSections={rows}
      formData={formData}
      stats={stats}
    />
  )
}
