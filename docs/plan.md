# UCSI Student Portal — Redesign Plan

## Project Summary

Modern redesign of the UCSI College IISV2 legacy student portal. The existing system is a desktop-only, table-heavy enterprise portal. The redesign migrates it to a role-aware Next.js application with a built-in Learning Resources module, eliminating the dependency on thecn.com.

---

## Legacy System Snapshot

| Attribute | Legacy (IISV2) |
|---|---|
| Navigation | Flat horizontal bar (6 items) |
| Layout | Full-width, table-dominated |
| Mobile | Not responsive |
| Roles | Student only (portal-facing) |
| Learning resources | Outsourced to thecn.com |
| Auth | Username + password, no visibility toggle |
| Version exposed | v1.202106 in footer |

---

## Modules Reverse-Engineered from Screenshots

### Authentication
- Username + password login
- Forgot Password link
- Session cookie management
- Single role exposed to students (no role selector)

### Dashboard / Home Page
- Announcement board (global news)
- Add/Drop Courses table (pending/approved requests)
- Add/Drop Approval table
- List of My Applications
- Invoice Outstanding Balance widget (e.g. RM 1,580.00)
- Outstanding Balance Details table
- List of Class Not Attend (large attendance absence table)
- Request Progression section

### Profile
- Name, Student Number, Institutional + Personal Email
- Mobile number
- Date of Birth, Marital Status, Gender, Nationality
- Guardian Name, Guardian Relation
- Correspondence Address

### Academic
- Programme Listing (index, file number, programme code/name, status, admit date, expected grad date)
- Semester Summary (semester GPA, total subjects, total credits, transcript download)
- Programme Structure (Year/Semester breakdown of all courses: core, elective, MPW)
- Academic Records (per-course: subject code, title, programme, semester, credits, standing, category, result, attendance %)

### Timetable
- Semester selector dropdown
- Date range filter (Date From / Date To — listing view only)
- By Listing tab
- By Calendar tab
- Generate button
- Empty state when timetable not released

### Financial Statement
- Transaction table: date, invoice number, tuition fee, less amount, amount outstanding, status, programme, programme semester, payment due date
- Totals row
- Invoice Outstanding Balance section: current outstanding figure
- Outstanding Balance Details
- Credit Balance (currently 0.00)
- Payments section: transaction number, mode (Transfer/Online), reference, amount

### Feedback
- List of feedback requests (empty state visible)
- Create New Feedback button
- Search + Actions controls

### Learning Resources (New)
- Does not exist in legacy system
- Currently handled via thecn.com externally
- Must be built into the redesign

---

## New Roles Introduced

| Role | Scope |
|---|---|
| Student | Read own academic, financial, timetable data; access enrolled course resources |
| Lecturer | Upload/manage resources for assigned course sections only |
| Admin | Full CRUD on all system entities; user/programme/enrollment management |

---

## Access Control Rules

- Lecturers may only upload resources to sections they are **assigned** to teach (enforced server-side).
- Students may only access resources for sections they are **enrolled** in (enforced server-side).
- All authorization checks happen in API route handlers / Server Actions — never only client-side.

---

## Graphify Knowledge Graph Analysis

Running `/graphify` on the full project directory produced the following corpus analysis:

| Metric | Result |
|---|---|
| Files analyzed | 56 |
| Approximate words | 233,570 |
| Nodes extracted | 650 |
| Edges extracted | 698 |
| Communities detected | 73 (35 shown, 38 thin) |
| Extraction accuracy | 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS |

### Confirmed Hyperedges (Group Relationships)

These multi-node relationships were explicitly confirmed by graphify at ≥0.95 confidence. They represent the system's load-bearing architectural decisions:

| Hyperedge | Nodes | Confidence |
|---|---|---|
| Learning Resource Access Control | TeachingAssignment + StudentSectionEnrollment + Server-Side Authorization | 1.00 |
| File Storage Pipeline | R2/S3 Storage + Upload Flow + Download Signed URL | 1.00 |
| Auth Session + Role + Route Protection | Auth.js + Middleware + Role-Based Redirect + Session Validation | 1.00 |
| RBAC Governs Learning Resources | RBAC rules + Student Role + Lecturer Role + Learning Resources System | 1.00 |
| Global UI/UX Problems Drive Redesign | 5 confirmed problem clusters → redesign goals | 1.00 |
| Build Order Phases | Phase 1→2→3→4→5 delivery sequence | 0.95 |

### Community Cohesion Findings

| Community | Cohesion | Finding |
|---|---|---|
| Security: Auth Hardening | 0.67 | High cohesion — security model is well-defined |
| Middleware & Session Guard | 0.67 | High cohesion — route protection is tightly designed |
| Role & Access Control Rules | 0.50 | Solid — document more explicitly |
| API & Auth Routes | 0.06 | Low cohesion — split into focused sub-documents |
| Legacy Timetable Page | 0.06 | Low cohesion — many weakly-connected UI nodes |

### UX Problems Confirmed by Image Analysis

Graphify's image analysis confirmed the following specific issues in the legacy screenshots:

- **Profile page "Hand:" label** — Mobile number field uses ambiguous "Hand:" label instead of "Mobile"
- **Invoice status "DPY"** — Unexplained abbreviation on financial page. Likely "Deposit Paid" or "Duty Paid" — must be replaced with human-readable status
- **Timetable date filter scope ambiguity** — Red warning text states date filter applies only to "By Listing" tab, but placement suggests it applies globally
- **Timetable empty state typo** — "THE TIME TABLE IS NOT RELEASE YET" — "RELEASE" should be "RELEASED"
- **Profile page: no save button visible** — Profile has editable fields but no save action is visible in the screenshot
- **Academic page: redundant year tabs** — Year 1 / Year 2 / Year 3 tabs on Programme Structure are redundant when semester already implies year

### Template Assets to Remove

Graphify flagged 5 SVG files in `app/public/` as Next.js create-next-app template artifacts with no relation to this project:
- `app/public/next.svg`
- `app/public/vercel.svg`
- `app/public/file.svg`
- `app/public/globe.svg`
- `app/public/window.svg`

These should be deleted before Phase 1 work begins to prevent them from appearing in builds.

---

## Tech Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already bootstrapped, file-based routing, Server Components |
| Language | TypeScript | Type safety across frontend + backend |
| Styling | Tailwind CSS v4 | Already installed |
| Components | shadcn/ui | Accessible, composable, unstyled primitives |
| ORM | Prisma | Type-safe DB access, migration support |
| Database | PostgreSQL | Relational data, strong FK enforcement |
| Auth | Auth.js v5 (NextAuth) | Session management, CSRF, JWT |
| Data fetching | TanStack Query | Caching, background refresh, optimistic updates |
| Client state | Zustand | Lightweight, role/session state |
| File storage | Cloudflare R2 / S3 | Learning resource file uploads |
| Validation | Zod | Schema validation shared between client + server |

---

## Implementation Phases

### Phase 1 — Foundation
- Database schema + Prisma setup
- Auth.js integration (login, session, role middleware)
- Role-based layout shells (Student / Lecturer / Admin)
- Global design system (tokens, typography, spacing)

### Phase 2 — Student Portal
- Dashboard with widgets (GPA, attendance, balance, next class, announcements)
- Profile page (view + edit)
- Academic page (programme, semesters, grades, programme structure)
- Timetable (calendar view primary, list secondary)
- Financial (balance summary, invoice table, payment history)
- Feedback (create, list, status)

### Phase 3 — Learning Resources
- Student: browse resources by enrolled section, filter by type, download
- Lecturer: upload resources to assigned sections, manage materials
- Admin: moderate all resources

### Phase 4 — Admin Panel
- User management
- Programme/course/semester management
- Enrollment and assignment management
- System announcements

### Phase 5 — Polish
- Mobile responsiveness audit
- Accessibility (WCAG 2.1 AA)
- Performance optimization
- Error states, loading skeletons, empty states
