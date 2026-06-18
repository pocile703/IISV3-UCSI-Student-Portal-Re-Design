# User Flows

Flows are inferred from legacy IISV2 portal screenshots and cross-validated by graphify community detection. Graphify confirmed three distinct user flow clusters (Student Dashboard Flow, Lecturer Resource Upload Flow, Admin User Management Flow) as separate high-cohesion communities, validating the separation of role concerns.

---

## Student Flows

### 1. Login
1. Visit portal root `/`
2. Middleware detects no session → redirect to `/login`
3. Enter username + password
4. Click Sign In → POST `/api/auth/login`
5. Server validates credentials + retrieves role
6. On success: session created, redirect to `/dashboard`
7. On failure: inline error message ("Invalid credentials")
8. Forgot Password → enter email → receive reset link

### 2. Dashboard
1. Land on `/dashboard`
2. Server fetches (in parallel):
   - Unread announcements
   - Current GPA
   - Attendance summary (% per semester)
   - Outstanding fee balance
   - Next scheduled class
   - Upcoming deadlines (assignments)
   - Active alerts (attendance failures, overdue fees)
3. Widgets render with data
4. Click any widget → navigate to the relevant module page

### 3. View Academic Records
1. Navigate to `/academic`
2. Default view: current semester grades
3. Semester tabs (or accordion) to switch between semesters
4. Each semester shows: courses, credits, result, attendance, standing
5. Click course row → expand or modal with details
6. View Programme Structure tab → see full Year/Sem curriculum
7. View Programme Listing tab → see enrollment metadata
8. GPA trend chart visible across all semesters
9. Export Transcript → download PDF

### 4. View Timetable
1. Navigate to `/timetable`
2. Default view: Weekly Calendar (current week)
3. Calendar shows colour-coded blocks per course section
4. Block details: course code, room, time, lecturer name
5. Switch to List view for date-range lookup
6. Select past/future semester from dropdown
7. Export to calendar (iCal/Google Calendar)

### 5. View Financial Statement
1. Navigate to `/financial`
2. Summary cards: Outstanding Balance, Last Payment, Credit Balance
3. Invoice table with filter by status (unpaid/partial/paid)
4. Click invoice number → detail modal/page
5. Detail shows: tuition breakdown, payment history, due date
6. Download invoice PDF
7. Payment History chart by semester

### 6. Browse Learning Resources
1. Navigate to `/resources`
2. See enrolled course sections listed as tabs or cards
3. Select a course section
4. Resources displayed in categorized list: Slides, Tutorials, Exercises, Assignments, Recordings
5. Filter by type
6. Click resource → download or preview in browser
7. View course announcements from lecturer

### 7. Submit Feedback
1. Navigate to `/feedback`
2. List of past feedback requests and their statuses
3. Click "Create New Feedback" → form (subject, body)
4. Submit → status changes to "Submitted"
5. Track status updates (Under Review → Resolved)

### 8. Add/Drop Request
1. From Dashboard or Academic page → click "Add/Drop"
2. View available sections for current semester
3. Select course to add or flag course to drop
4. Submit request → status "Pending"
5. Admin approves/rejects
6. Student receives notification
7. Enrollment updated on approval

### 9. Progression Request
1. From Dashboard → click "Request Progression"
2. Form: select from/to semester, enter reason
3. Submit → status "Pending"
4. Admin reviews → approves or rejects
5. Student notified of decision

---

## Lecturer Flows

### 1. Login
1. Visit `/login`
2. Enter staff credentials
3. Session created with role = lecturer
4. Redirect to `/lecturer/dashboard`

### 2. View Assigned Classes
1. Land on `/lecturer/dashboard`
2. See list of CourseSection assignments for current semester
3. Each card shows: course code, title, section, schedule, enrolled count

### 3. Upload Learning Resource
1. From dashboard, click a course section card
2. Navigate to `/lecturer/resources/[sectionId]`
3. Click "Upload Resource"
4. Form: Title, Description, Type (slide/tutorial/exercise/assignment/recording), File upload
5. Server checks: is this lecturer assigned to this section? (TeachingAssignment query)
6. If authorized: file stored, LearningResource record created
7. Optionally publish immediately or save as draft
8. Resource appears in student-facing list upon publish

### 4. Manage Resources
1. Navigate to `/lecturer/resources/[sectionId]`
2. See list of all resources for this section
3. Actions: Edit (title, description, type), Delete, Toggle Published
4. Server re-validates authorization on every mutation

### 5. Post Course Announcement
1. From course section resource page
2. Click "New Announcement"
3. Enter title + content
4. Submit → creates LearningResource with type=announcement OR creates Announcement with course_section_id

---

## Admin Flows

### 1. Login
1. Visit `/login`
2. Admin credentials → role = admin → redirect to `/admin/dashboard`

### 2. Manage Users
1. `/admin/users`
2. Table: all users with role, status, creation date
3. Create user: assign username, email, role, link to Student or Lecturer profile
4. Edit: change role, reset password, toggle active
5. Deactivate (soft delete) instead of hard delete

### 3. Manage Programmes & Courses
1. `/admin/programmes` → CRUD programmes
2. `/admin/courses` → CRUD courses
3. `/admin/semesters` → CRUD semesters per programme
4. `/admin/sections` → Create CourseSection (link course + semester + schedule)

### 4. Assign Lecturer to Section
1. `/admin/assignments`
2. Select CourseSection, select Lecturer
3. Create TeachingAssignment record
4. Lecturer can now upload resources to that section

### 5. Enroll Student in Section
1. `/admin/enrollments`
2. Select Student, select CourseSection
3. Create StudentSectionEnrollment record
4. Student gains access to resources for that section

### 6. Moderate Resources
1. `/admin/resources`
2. View all LearningResources across all sections
3. Unpublish or delete inappropriate content
4. Cannot upload resources as a lecturer (separate permission)
