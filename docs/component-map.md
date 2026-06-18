# Component Map

All components are TypeScript + React Server Components (RSC) where possible. Client Components are marked `"use client"` only when they need interactivity or browser APIs.

---

## Layout Components

```
RootLayout
├── AuthProvider          (client — wraps Auth.js SessionProvider)
├── QueryProvider         (client — TanStack Query)
├── ThemeProvider         (client — dark/light mode)
├── TopBar
│   ├── Logo
│   ├── NotificationBell  (client — unread count badge, dropdown)
│   ├── UserMenu          (client — avatar, name, role badge, logout)
│   └── HelpButton
├── Sidebar               (role-aware — different links per role)
│   ├── NavGroup          (grouped nav section with label)
│   └── NavItem           (link with icon and active state)
└── PageContent           (slot for page body)
```

---

## Shared / Primitive Components

These wrap shadcn/ui or are custom:

```
ui/
├── Button
├── Input
├── Textarea
├── Select
├── Badge             (status badges: enrolled, active, overdue, etc.)
├── Card
│   ├── CardHeader
│   ├── CardContent
│   └── CardFooter
├── Table
│   ├── TableHead
│   ├── TableBody
│   └── TableRow
├── Modal             (Dialog from shadcn)
├── Tabs
│   ├── TabsList
│   └── TabsContent
├── Accordion
│   ├── AccordionItem
│   └── AccordionContent
├── Avatar
├── Skeleton          (loading placeholder)
├── EmptyState        (icon + heading + description + optional CTA)
├── ErrorBoundary     (client — catch render errors)
├── Breadcrumb
├── DatePicker        (client)
├── FileUploader      (client — drag-drop + click-to-upload)
└── Toast             (client — sonner or shadcn toast)
```

---

## Dashboard Components (Student)

```
app/(student)/dashboard/
├── DashboardPage             (RSC — fetches all widgets in parallel)
├── StatCard                  (GPA, attendance %, balance, next class)
├── AlertBanner               (urgent: attendance warning, fee overdue)
├── AnnouncementFeed
│   └── AnnouncementCard
├── UpcomingClassWidget
│   └── ClassScheduleItem
├── QuickActions              (links: View Results, Pay Now, Download Timetable)
└── ProgressionStatusBanner   (shown only if active progression request)
```

---

## Academic Components

```
app/(student)/academic/
├── AcademicPage              (RSC)
├── ProgrammeListingTable     (RSC — programme enrollment metadata)
├── SemesterTabs              (client — tab per semester)
│   └── SemesterPanel
│       ├── SemesterSummaryRow (GPA, credits, subjects)
│       └── CourseResultTable
│           └── CourseResultRow (grade badge, standing, attendance bar)
├── GPATrendChart             (client — recharts or chart.js line chart)
├── CreditProgressBar         (current / required credits)
├── ProgrammeStructureAccordion
│   └── YearSemesterGroup
│       └── CourseStructureRow
└── TranscriptExportButton    (client — triggers PDF download)
```

---

## Timetable Components

```
app/(student)/timetable/
├── TimetablePage             (RSC)
├── SemesterSelector          (client — dropdown)
├── ViewToggle                (client — Calendar / List)
├── WeeklyCalendar            (client — primary view)
│   ├── CalendarHeader        (week navigation, today button)
│   ├── DayColumn
│   └── ClassBlock            (colour-coded, hover shows room/lecturer)
├── TimetableListView         (RSC — filterable table)
│   └── TimetableListRow
├── DateRangePicker           (client — for list view only)
└── ExportCalendarButton      (client — downloads .ics)
```

---

## Financial Components

```
app/(student)/financial/
├── FinancialPage             (RSC)
├── BalanceSummaryCards       (outstanding, last payment, credit balance)
├── InvoiceTable              (client — filterable by status)
│   └── InvoiceRow            (status badge, clickable)
├── InvoiceDetailModal        (client — shows tuition breakdown)
├── PaymentHistoryTable       (RSC)
│   └── PaymentRow
└── PaymentTimelineChart      (client — per-semester fees vs paid)
```

---

## Profile Components

```
app/(student)/profile/
├── ProfilePage               (RSC)
├── ProfileSummaryCard        (avatar, name, student number, role badge)
├── ProfileCompletionBar      (% of fields filled)
├── PersonalInfoSection       (inline-editable)
├── ContactInfoSection        (inline-editable)
├── GuardianInfoSection       (inline-editable)
├── AddressSection            (inline-editable)
└── InlineEditField           (client — read → edit toggle per field)
```

---

## Feedback Components

```
app/(student)/feedback/
├── FeedbackPage              (RSC)
├── FeedbackList
│   └── FeedbackCard          (subject, status badge, date)
├── FeedbackStatusBadge       (submitted/under_review/resolved/closed)
├── CreateFeedbackModal       (client — subject + body form)
└── FeedbackDetailPanel       (view submitted feedback + status history)
```

---

## Learning Resources — Student View

```
app/(student)/resources/
├── ResourcesPage             (RSC — enrolled sections)
├── CourseSectionList
│   └── CourseSectionCard     (course code, title, lecturer, resource count)
├── ResourcesBySection        (RSC — resources for one section)
│   ├── ResourceTypeFilter    (client — filter by type)
│   ├── ResourceGrid
│   │   └── ResourceCard      (title, type badge, date, download button)
│   └── CourseSectionAnnouncements
│       └── AnnouncementCard
└── ResourceDownloadButton    (client — triggers signed URL fetch then download)
```

---

## Learning Resources — Lecturer View

```
app/(lecturer)/resources/
├── LecturerDashboard         (RSC — assigned sections)
├── SectionResourceManager    (RSC — resources for one assigned section)
│   ├── ResourceTable
│   │   └── ResourceRow       (title, type, published, actions)
│   ├── TogglePublishButton   (client)
│   ├── DeleteResourceButton  (client — with confirmation modal)
│   └── EditResourceModal     (client)
└── UploadResourceForm        (client)
    ├── ResourceTypeSelect
    ├── TitleInput
    ├── DescriptionTextarea
    ├── FileUploader
    └── PublishToggle
```

---

## Admin Components

```
app/(admin)/
├── AdminDashboard            (RSC — user count, resource count, pending requests)
├── UserManagementPage
│   ├── UserTable             (client — searchable, filterable by role)
│   ├── CreateUserModal       (client)
│   └── EditUserModal         (client)
├── ProgrammeManagementPage   (RSC + client forms)
├── CourseManagementPage      (RSC + client forms)
├── SectionManagementPage     (RSC + client forms)
├── AssignmentManagementPage  (assign lecturer to section)
├── EnrollmentManagementPage  (enroll student in section)
└── ResourceModerationPage    (all resources, unpublish/delete)
```

---

## Auth Components

```
app/(auth)/
├── LoginPage                 (RSC shell + client form)
│   ├── LoginForm             (client — username, password, submit)
│   │   ├── PasswordInput     (client — visibility toggle)
│   │   └── ValidationMessage
│   └── ForgotPasswordLink
└── ForgotPasswordPage        (client form)
```

---

## Component Dependency Rules

- Shared `ui/` components have no role-awareness — they are pure presentation.
- Role-awareness lives in layout (sidebar) and page-level data fetching.
- Client components never directly query the DB — they call API routes or Server Actions.
- Server components fetch data via Prisma directly in RSC or via server-side utilities.
- File downloads always go through an API route that validates session + enrollment before issuing a signed URL — never expose raw storage paths to the client.

---

## Academic Page Decomposition Note

The graphify graph identified `My Academic Page (IISV2)` as a high-betweenness-centrality bridge node connecting three separate knowledge communities:
- **Legacy Academic Page** (screenshot-derived UI nodes)
- **Academic Records Schema** (columns, GPA, attendance)
- **Programme Listing Schema** (intake date, file number, programme code)

This means `AcademicPage` contains genuinely distinct data domains. Keep these as separate sub-components (`ProgrammeListingTable`, `SemesterTabs` + `CourseResultTable`, `ProgrammeStructureAccordion`) rather than consolidating them into a monolithic page component. Each sub-component should fetch its own data slice independently.

---

## Template Assets to Remove

Before starting Phase 1 implementation, delete the following default Next.js template assets from `app/public/`. They have no purpose in this project:

```
app/public/next.svg
app/public/vercel.svg
app/public/file.svg
app/public/globe.svg
app/public/window.svg
```

Replace with UCSI College brand assets (logo SVG, favicon) when available.
