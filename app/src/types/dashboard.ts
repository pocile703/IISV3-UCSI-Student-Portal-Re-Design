export interface DashboardScheduleItem {
  id: string
  courseCode: string
  courseTitle: string
  room: string
  dayOfWeek: number    // 1=Mon (DB 0=Mon → +1 in service)
  timeStart: string    // "HH:MM"
  timeEnd: string      // "HH:MM"
  lecturerName?: string
  credits: number
}

export interface DashboardPageData {
  firstName: string
  studentNumber: string
  semesterName: string
  cgpa: number
  enrolledCredits: number
  subjectCount: number
  balanceDue: number
  unreadNotifications: number
  sections: DashboardScheduleItem[]
  // Inline shape — structurally compatible with DashboardAnnouncement from AnnouncementFeed
  announcements: Array<{
    id: string
    title: string
    body: string
    courseSectionId: string | null
    sectionCode: string | null
    createdAt: string
  }>
}
