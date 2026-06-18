import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AcademicSemesterView } from '@/components/academic/AcademicSemesterView'
import { getAcademicData } from '@/services/academic-queries'
import { formatDate } from '@/lib/utils'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AcademicPage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId) redirect('/login')
  const data = await getAcademicData(studentId)

  const cgpaChange = (data.cgpa - data.previousCgpa).toFixed(2)
  const cgpaUp = data.cgpa >= data.previousCgpa

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Academic Record</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">{data.studentNumber}</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <p className="text-xs text-[--text-secondary]">Programme</p>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-[--text-primary]">{data.programme.name}</p>
          <p className="mt-0.5 text-xs text-[--text-secondary]">{data.programme.code}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs text-[--text-secondary]">CGPA</p>
          <div className="mt-1.5 flex items-end gap-2">
            <p className="text-2xl font-bold text-[--text-primary]">{data.cgpa.toFixed(2)}</p>
            <span className={`mb-0.5 flex items-center gap-0.5 text-xs font-medium ${cgpaUp ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp size={12} aria-hidden="true" />
              {cgpaUp ? '+' : ''}{cgpaChange}
            </span>
          </div>
          <p className="text-xs text-[--text-secondary]">vs. last semester</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs text-[--text-secondary]">Credits This Semester</p>
          <p className="mt-1.5 text-2xl font-bold text-[--text-primary]">{data.totalCreditsEnrolled}</p>
          <p className="text-xs text-[--text-secondary]">of {data.programme.totalCredits} total</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs text-[--text-secondary]">Expected Graduation</p>
          <p className="mt-1.5 text-sm font-semibold text-[--text-primary]">
            {formatDate(data.enrollment.expectedGradDate)}
          </p>
          <Badge variant="success" className="mt-1.5">Active</Badge>
        </Card>
      </div>

      {/* Semester picker + detail — client island handles tab state */}
      <AcademicSemesterView
        semesters={data.semesters}
        currentData={data.currentData}
        pastData={data.pastData}
      />
    </div>
  )
}
