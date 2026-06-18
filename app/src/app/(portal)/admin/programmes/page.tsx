import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getProgrammesData } from '@/services/programme-queries'
import { ProgrammeTable } from '@/components/admin/ProgrammeTable'

export default async function AdminProgrammesPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const rows = await getProgrammesData()

  // Snapshot key: changes whenever a programme is added, edited, or archived.
  // Passed as `key` to ProgrammeTable so React remounts the component cleanly
  // when server data changes (router.refresh() in ProgrammeModal triggers this).
  const snapshotKey = `programmes:${rows
    .map(r => `${r.id}:${r.isActive}:${r.code}`)
    .join('|')}`

  return <ProgrammeTable key={snapshotKey} initialProgrammes={rows} />
}
