import { TrendingUp, BookOpen, CreditCard, Bell } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { AnnouncementFeed } from '@/components/dashboard/AnnouncementFeed'
import { ClassScheduleItem } from '@/components/dashboard/UpcomingClassWidget'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatRM } from '@/lib/utils'
import { getDashboardData } from '@/services/dashboard-queries'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId) redirect('/login')
  const data = await getDashboardData(studentId)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Welcome back, {data.firstName}</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          {data.studentNumber} · {data.semesterName}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="CGPA" value={data.cgpa.toFixed(2)} sub="All published results" icon={TrendingUp} accent />
        <StatCard label="Credits Enrolled" value={String(data.enrolledCredits)} sub={`${data.subjectCount} subjects`} icon={BookOpen} />
        <StatCard
          label="Balance Due"
          value={data.balanceDue > 0 ? formatRM(data.balanceDue) : 'Paid'}
          sub="Outstanding balance"
          icon={CreditCard}
          accent={data.balanceDue > 0}
        />
        <StatCard label="Notifications" value={String(data.unreadNotifications)} sub="Unread" icon={Bell} />
      </div>

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <QuickActions />
      </section>

      {/* Schedule + announcements */}
      <div className="grid gap-4 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
        {/* This week's schedule */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-[--text-primary]">This Week&apos;s Schedule</h2>
            <p className="text-xs text-[--text-secondary]">{data.semesterName}</p>
          </CardHeader>
          <CardContent>
            {data.sections.length === 0 ? (
              <p className="py-4 text-center text-sm text-[--text-muted]">No classes scheduled this week.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.sections.map((sec) => (
                  <ClassScheduleItem
                    key={sec.id}
                    courseCode={sec.courseCode}
                    courseTitle={sec.courseTitle}
                    room={sec.room}
                    dayOfWeek={sec.dayOfWeek}
                    timeStart={sec.timeStart}
                    timeEnd={sec.timeEnd}
                    lecturerName={sec.lecturerName}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-[--text-primary]">Announcements</h2>
          </CardHeader>
          <CardContent>
            <AnnouncementFeed announcements={data.announcements} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
