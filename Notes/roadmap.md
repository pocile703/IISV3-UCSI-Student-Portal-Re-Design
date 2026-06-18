# Roadmap

## Phase 1 — Architecture docs + graphify ✅
- Architecture docs (plan, schema, auth, routes, design system, security)
- Graphify analysis + knowledge graph
- System diagrams

## Phase 2 — Frontend structure + design system + mock data ✅
- shadcn/ui installed (base-nova, @base-ui/react)
- UCSI design tokens in globals.css
- LayoutContext (sidebar, mobile drawer, mock role)
- Full component set: Sidebar, TopBar, MobileDrawer, NavItem, NavGroup, SidebarNav, DevRoleSwitcher, NotificationBell, UserMenu, SkipToMain
- (portal)/ route group wired with PortalLayout shell
- All pages moved into (portal)/; /resources renamed to /classes
- Mock data, services, hooks, types scaffolded

## Phase 3 — Static UI pages with mock data ✅
**Student pages (done):**
- ✅ Dashboard (CGPA stat, schedule, announcements, quick actions)
- ✅ Academic (CGPA trend, course results table, past semesters)
- ✅ Timetable (weekly grid + list view)
- ✅ Classes (resources grouped by category: Slides / Tutorials / Exercises / Assignments / etc.)
- ✅ Financial (invoice table, payment history, balance summary)
- ✅ Feedback (submit form with visible submit button, history with status badges)
- ✅ Profile (enrolment, personal info, guardian, address)

**Visual polish (done in Phase 3):**
- ✅ Sidebar: slate-800 `#1e293b` bg (not zinc-900); border-l-2 red active indicator; bg-white/10 hover; text-zinc-400 group labels
- ✅ StatCard: items-center alignment; text-lg sm:text-xl value; md:grid-cols-4 breakpoint (tablet 768px)
- ✅ Manual ThemeToggle (system→light→dark, localStorage-persisted)
- ✅ College logo in TopBar (next/image with dark:bg-white wrapper)
- ✅ Collapsible ClassSectionCard per subject on /classes
- ✅ Responsive timetable (mobile agenda + desktop grid)

**UI polish done (2026-05-19):**
- ✅ StatCard icon theme: tinted accent bg + UCSI red icon (no hardcoded white)
- ✅ Finance page: invoice + payment receipt stub downloads (FinanceDownloadButton client component)
- ✅ ClassSectionCard: localStorage collapse persistence (keyed by sectionId)
- ✅ NotificationBell badge: corner overflow position + inline-style red bg fix
- ✅ Schedule day/time pill: inline-style red bg fix
- ✅ Dashboard UX audit: WCAG AA contrast fixes (text-muted → text-secondary on all readable metadata)
- ✅ UserMenu avatar bg: inline-style red fix; dropdown click-outside close; transparent dropdown bg fixed
- ✅ Theme system: UCSI tokens respond to .dark and html.light classes (not just OS media query)
- ✅ MobileDrawer slide-in/out animation; academic sticky Code column; collapsed sidebar `bg-white/15` active state

**Lecturer pages done (2026-05-19):**
- ✅ Lecturer Dashboard `/lecturer` — sections, stats, activity feed (red icon for urgent, no left border), interactive pending tasks (tick off), horizontal Quick Actions at top, tasks+activity in right column
- ✅ Lecturer Profile `/lecturer/profile` — employment, contact, academic background, assigned sections, thecn.com link; Registrar's Office footer contact with mailto link
- ✅ Lecturer Resources `/lecturer/resources` — section picker cards (resource/post/student counts, urgent badge, last activity, Manage link)
- ✅ Lecturer Section Detail `/lecturer/resources/[sectionId]` — side-by-side ResourceManager (search, filter chips, inline upload/edit forms, publish toggle, delete confirm) + ClassPostPanel (pinned-first sort, pin toggle, inline new-post/edit/delete forms)
- ✅ Lecturer Timetable `/lecturer/timetable` — teaching schedule (not student schedule); `MOCK_LECTURER_TEACHING_SESSIONS` in `mock-lecturer.ts`; student count instead of lecturer name; nav entry updated
- ✅ Lecturer Attendance `/lecturer/attendance` — section picker with student counts + pending session badge
- ✅ Lecturer Attendance `/lecturer/attendance/[sectionId]` — two-column shell (`AttendanceShell` client wrapper): `AttendanceDatePanel` (auto-derived dates, Done/Pending badges) + `AttendanceRosterPanel` (P/A/L/E toggles, Mark All Present, optimistic Save with 2-second confirmation)

**UX + design refinements done (2026-05-19 sessions 4–6):**
- ✅ Lecturer Quick Actions deduped — removed "Upload Resource" (redundant with "My Classes"); added "Profile"; removed "New Post"; added "Attendance" → all 4 tiles distinct destinations
- ✅ Student Classes filter chips — `ClassSectionCard` dynamic filter bar (Posts / Slides / Tutorials / Assignments / etc.); only shown when ≥2 distinct content types; resets on card collapse
- ✅ Sidebar 4-tier contrast hierarchy — inactive nav zinc-400 → zinc-300 (AAA); active bg-white/10 → bg-white/20; NavGroup labels stay zinc-400; NavGroup font 10px → 11px
- ✅ "Urgent" semantic softening — lecturer/admin views use `variant="warning"` + "priority" label; student views retain `variant="danger"` + "urgent"
- ✅ Profile footer — Registrar's Office + mailto link on student + lecturer profiles; admin omits
- ✅ Graphify refresh — 286 files, 1820 nodes, 2582 edges, 202 communities; 58.8x token reduction (2026-05-28 session 39)

**Admin mock data ready (2026-05-19 session 5):**
- ✅ `mock-admin.ts` — `MOCK_ALL_LECTURERS` (5), `MOCK_PROGRAMMES` (3), `MOCK_SECTION_ENROLLMENT`, `MOCK_ADMIN_STATS`, `MOCK_ADMIN_ACTIVITY` (6 items), `MOCK_ADMIN_PROFILE`

**Admin dashboard done (2026-05-20 session 7):**
- ✅ Admin dashboard `/admin` — bento-grid: header → Quick Actions (4 tiles) → 4 stat cards → `[1fr_300px]` rows: Lecturer Assignments (tabbed: Lecturers table + Programmes bars) + System Activity; Recent Posts + Resource Moderation
- ✅ 5 admin components under `app/src/components/admin/`: `AdminQuickActions`, `AdminActivityFeed`, `AdminRecentPosts`, `LecturerAssignmentsCard` (client, tabbed), `AdminResourceModeration` (client, optimistic + confirm strip)
- ✅ Verified 34/34 Playwright checks (desktop / dark / mobile)

**Admin Users + Programmes done (2026-05-20 session 8):**
- ✅ `/admin/users` — Server Component (header + 4 stat cards) + `UserTable` client island: tabbed Students/Lecturers table, tab-scoped search, role/department filter, status badges, sticky Name column, empty state, Add/View/Edit placeholders. `mock-admin.ts` gained `MOCK_ADMIN_USERS` + `MOCK_USER_STATS`. Verified 25/25 Playwright.
- ✅ `/admin/programmes` — pure Server Component table: code badge, name, students, sections, lecturer summary (`first +N more`), status badge, Add/View/Edit placeholders. `MockProgramme` extended with `status` + `lecturerIds`. Verified 20/20 Playwright.

**Runtime fixes done (2026-05-20 session 10):**
- ✅ `next.config.ts` — `turbopack.root` set to `path.resolve(__dirname)`; silences Turbopack multi-lockfile warning
- ✅ `layout.tsx` — theme-init `<script>` moved from `<body>` to `<head>`; fixes React 19 "script tag in component body" console error
- ✅ `ThemeToggle.tsx` — hydration mismatch fixed; `useState('system')` + `useEffect` localStorage sync; server and client initial render now match

**Admin pages — all done (confirmed 2026-05-20 session 10):**
- ✅ `/admin/profile` — follows `/lecturer/profile` pattern; omits Registrar footer
- ✅ `/admin/sections` — section list table with TeachingAssignment scaffold (course, section code, day/time, room, enrolled, lecturer, status)
- ✅ `/admin/resources` — system-wide resource moderation across all sections with section filter and confirm-strip delete

**Phase 3 is COMPLETE. ✅**

**Post-Phase 3 polish done (2026-05-21 session 11):**
- ✅ `admin/resources` — resources grouped by section with shaded header rows (section label, course title, draft count badge); sorted by type within each section; redundant Section badge removed from rows
- ✅ `admin/sections` — Assign button `border-[--ucsi-red]/30` CSS-var failure fixed → `border-[#C1272D]/30`; `cursor-pointer` added to View + Assign
- ✅ `admin/programmes` — Add Programme button: `cursor-pointer transition-opacity hover:opacity-90`; View/Edit text buttons: `cursor-pointer`
- ✅ `admin/users` (UserTable) — Add User button: `cursor-pointer transition-opacity hover:opacity-90`

**Post-Phase 3 polish done (2026-05-21 session 13):**
- ✅ `admin/users` UserTable — Name column bounded to `w-[200px]` with `truncate`; row hover fixed; sticky th/td bg made consistent
- ✅ Dark mode cascade fix — `html.dark {}` block added for UCSI tokens (specificity `0,1,1` beats `:root` `0,1,0`); `Card.tsx` background moved to inline `style={{ backgroundColor: 'var(--bg-surface)' }}`
- ✅ `MOCK_TEACHING_ASSIGNMENTS` centralized in `mock-admin.ts`; duplicate local maps removed from `LecturerAssignmentsCard.tsx` + `admin/sections/page.tsx`
- ✅ `--text-muted` → `--text-secondary` sweep on 6 pages: dashboard, academic, timetable, lecturer/timetable, finance, feedback (readable metadata only; empty states kept muted)
- ✅ `hover:bg-[--bg-elevated]` fixed on `admin/sections` table rows + finance invoice table rows (bonus fixes during above work)

**Post-Phase 3 polish done (2026-05-21 session 14):**
- ✅ `hover:bg-[--bg-elevated]` sweep — all 10 remaining locations fixed: TopBar, ThemeToggle, NotificationBell, UserMenu (trigger + Profile link), `admin/resources` table rows, `admin/programmes` table rows, `CourseResultTable` rows, `ClassSectionCard` resource item + collapse header, `FinanceDownloadButton` (also fixed `hover:text-[--ucsi-red]` → `hover:text-[#C1272D]`)
- ✅ `--text-muted` sweep fully complete — all remaining profile pages (student/lecturer/admin), attendance pages, `CourseResultTable` column headers, `AttendanceRosterPanel` student numbers + "Not marked" count, `LecturerActivityFeed` timestamps, `SectionResourceManager` attachment info + dates
- `--text-muted` is now strictly decorative-only across the entire codebase. Hover replacement rules are canonical (3 tiers: icon buttons, table rows, large headers).

**Pre-Phase 4 polish: all complete. Ready for Phase 4.**

**Phase 3.5 — backend readiness review + pre-Phase 4 cleanup: COMPLETE ✅**

Done (2026-05-21 sessions 15–16):
- ✅ Pre-backend architecture audit → `docs/backend-readiness-review.md` (15 sections, decisions recorded)
- ✅ Five architecture docs updated: `database-schema.md`, `auth-flow.md`, `api-routes.md`, `security-notes.md`, `CLAUDE.md`
- ✅ Academic page current-semester class schedule; timetable Missed Sessions chronological view
- ✅ Frontend type stubs aligned with backend shape: `ClassPost` (`courseSectionId: string | null`, `authorId`, `isPinned`, `isPublished`); `ResourceType` `'announcement'` removed
- ✅ `/resources` → `/classes` URL drift fixed in `services/student.ts`, `ResourceDownloadButton.tsx`, `api-routes.md`
- ✅ Duplicate `### Announcements` doc section removed from `api-routes.md`
- ✅ TypeScript 0 errors across all changed files

**Additional pre-Phase 4 cleanup done (2026-05-22 session 22):**
- ✅ `ClassPost.isPinned` / `isPublished` made non-optional `boolean` — aligns with Prisma `@default(false)` / `@default(true)`, never `undefined`. Cascaded to 9 mock posts + `ClassPostPanel.handleAdd`.
- ✅ `LearningResource.attachments?: ResourceAttachment[]` added (optional — zero cascade to existing mock data; Phase 4 `include: { attachments: true }` populates it).
- ✅ `AnnouncementFeed` refactored — local `Announcement` interface removed; replaced with exported `DashboardAnnouncement = Pick<ClassPost, 'id'|'title'|'body'|'courseSectionId'|'createdAt'>`. Dashboard page retyped. Now structurally synced to `ClassPost` — Phase 4 real data drops in with no prop-shape change.
- ✅ Doc cleanup — 3 stale "new finding" blocks deleted from `backend-readiness-review.md`; `author_id`/`authorId` naming corrected in `api-routes.md`; `security-notes.md` API-hardening section rewritten to done state.
- TypeScript 0 errors. Commits: `3713bff` (app), `39197fe` (root).

**Pre-Phase 4 backend prerequisites done (2026-05-22 session 23):**
- ✅ `types/academic.ts` created — `Course`, `CourseSection`, `Semester`, `Programme`, `PastSemesterCourse`, `PastSemesterDetail` split from `types/student.ts` + `data/mock-results.ts`; 7 consumer imports updated
- ✅ `Invoice.amount_outstanding` dropped — compute via Prisma `Payment._sum` aggregate at query time; decision in `docs/database-schema.md` Schema Notes; field annotated mock-era-only in `types/financial.ts`
- ✅ `session_version Int @default(1)` added to `User` table in `docs/database-schema.md`
- ✅ `docker-compose.yml` (Postgres 16-alpine) + `.env.local` created in `app/`

**All pre-Phase 4 prerequisites complete. Ready for `npx prisma init`.**

**Doc drift cleanup done (2026-05-22 session 24):**
- ✅ `docs/database-schema.md`: `amount_outstanding` removed from Invoice table definition; `'announcement'` removed from LearningResource.type enum
- ✅ `docs/backend-readiness-review.md`: `session_version` status synced across R2 gap row, Recommendation, and risk summary
- ✅ `docs/api-routes.md`: post ownership check wording consistent camelCase
- ✅ `app/docker-compose.yml`: env-var substitution for credentials
- TypeScript 0 errors, build clean. No app code changed.

## Phase 4 — Prisma schema + DB ✅

**Schema + migration complete (2026-05-22–23, sessions 25–26):**
- ✅ `app/prisma/schema.prisma` — 20 domain models + `Session`, 16 enums, all constraints
- ✅ Migration `20260522153948_init` + `20260524000000_schema_invariants_and_indexes` applied; 23 tables live
- ✅ Seed complete — 14 users / 3 programmes / 5 semesters / 16 courses / 16 sections / 21 SSE / 8 TA / 70 attendance / 9 invoices / 19 resources + 17 attachments / 11 posts / 10 notifications / 4 feedback

**Phase 4b — page-by-page Prisma migration: COMPLETE ✅ (sessions 29–35)**
- ✅ `lib/prisma.ts` — PrismaClient singleton (PrismaPg adapter, globalThis hot-reload cache)
- ✅ `lib/query-helpers.ts` — shared pure helpers: `GRADE_POINTS`, `toTime`, `toISODate` (extracted from 4 services)
- ✅ `services/academic-queries.ts` + Academic page — narrow `select` shapes (no `include: true`), deterministic `orderBy: { assignedAt: 'asc' }` on lecturer
- ✅ `services/timetable-queries.ts` + Timetable page — deterministic lecturer ordering added
- ✅ `services/finance-queries.ts` + Finance page — COMPLETED-only balance; `totalPaid` from payments not invoice math
- ✅ `services/classes-queries.ts` + Classes page — enrollment-gated; per-post `authorName` via join
- ✅ `services/feedback-queries.ts` + Feedback page — read-only history; `FeedbackForm` submit disabled with Phase-5 notice
- ✅ `services/profile-queries.ts` + Profile page — active-first enrollment fallback; `addressLine2` now rendered; `ENROLLMENT_SELECT` constant deduplicates select shape
- ✅ `services/dashboard-queries.ts` + Dashboard page — 5 queries / 2-stage `Promise.all`; `sectionCode` in announcement pills; corrected CGPA + Balance Due subtitles
- ✅ All 7 student pages on Prisma. Lecturer + Admin pages remain on mocks (Phase 6).

## Phase 5 — Auth.js + authorization ✅

**Complete (2026-05-27, sessions 36–38):**
- ✅ `auth.config.ts` — edge-safe config (no Node.js deps); used by middleware
- ✅ `auth.ts` — CredentialsProvider (Zod + bcrypt); `jwt` callback fetches `studentId`/`lecturerId`/`fullName`; `session` callback maps claims; exports `GET`, `POST` for API route
- ✅ `middleware.ts` — `NextAuth(authConfig)` (edge-safe split); guards student / lecturer-or-admin / admin routes; unauthenticated → `/login?callbackUrl=…`
- ✅ Login page — real `username`+`password` form; server wrapper redirects already-authenticated users
- ✅ `LayoutContext` — `mockRole`/`setMockRole` removed; `DevRoleSwitcher` deleted
- ✅ Portal layout — async, `auth()` call, passes `role`+`userName` to shell components
- ✅ All 7 student pages — `DEMO_STUDENT_ID` → `session.user.studentId`
- ✅ `profile-queries.ts` — P2025 catch → `redirect('/login')`
- ✅ `feedback/actions.ts` — `submitFeedback` Server Action (Zod, Prisma create)
- ✅ `FeedbackForm` — wired to Server Action; disabled stub removed
- ✅ `tsc --noEmit`: 0 errors
- ✅ `middleware.ts` — `getToken` MissingSecret fixed (`secret: process.env.AUTH_SECRET`)
- ✅ `LoginPageClient.tsx` — `suppressHydrationWarning` on both inputs (password manager extension)

**Not in Phase 5 scope (deferred):**
- `sessionVersion` DB check on every request → Phase 6
- TeachingAssignment + StudentSectionEnrollment server-side guards → Phase 6 (lecturer/admin mutations)
- Classes page global announcements strip → Phase 6

## Phase 6 — Lecturer + Admin systems ✅ (complete 2026-06-02)

> **Security pre-requisites (from `docs/auth-rbac-review.md`) — ALL COMPLETE ✅ (session 40 + Codex followup, 2026-05-28):**
>
> - ✅ **[M1]** `proxy.ts` is the active middleware (`middleware.ts` deleted — coexistence breaks Next.js 16 build).
> - ✅ **[M2]** `(portal)/layout.tsx` reads `x-invoke-path` header set by proxy and enforces role-to-route.
> - ✅ **[M3]** All 7 lecturer + 6 admin pages begin with `auth()` + role + profile-ID guard.
> - ✅ **[M4]** `TeachingAssignment` DB lookup established in both dynamic lecturer pages; `uploadedBy → Lecturer.id` / `authorId → User.id` ownership spaces documented.
> - ✅ **[M5]** All Server Actions assert `session.user.role` explicitly as part of the first guard.
> - ✅ **[S1/S2]** `(portal)/layout.tsx` runs one `prisma.user.findUnique({ select: { isActive, sessionVersion } })` per request.
> - ✅ **[S4]** Both dynamic lecturer pages use `prisma.teachingAssignment.findUnique` — mock allowlist removed.
> - ✅ **[S5/S6]** `submitFeedback` redirects on no-session; feedback `body` capped `.max(5000)`.
> - ✅ **All Server Actions** use `getValidatedSession()` from `lib/session-guard.ts` — revalidates `isActive`+`sessionVersion` so stale JWTs can't invoke mutations even when layout is bypassed.

**Feature scope — all complete:**
- ✅ Lecturer: real file upload — `POST /api/upload/resource` (multipart, magic-bytes MIME, 100 MB cap, TeachingAssignment gate, rollback on fail)
- ✅ Lecturer: `TeachingAssignment`-gated Server Actions for resources, posts, attendance, tasks
- ✅ Lecturer: attendance save action wired to DB (`saveAttendance`)
- ✅ Classes page: real download via `GET /api/files/[sectionId]/[attachmentId]` (IDOR guard, role-branched authz)
- ✅ Classes page: global admin announcements strip rendered above section cards
- ✅ Admin: post + resource moderation UI wired (`adminDeletePost`, `adminTogglePublishPost`, `adminDeleteResource`, `adminTogglePublishResource`)
- ✅ Admin: user role-change (LECTURER↔ADMIN) + deactivation — `adminUpdateUser`, `EditUserModal`, `UserTable` on real Prisma data
- ✅ Admin: user create modal — `adminCreateUser` (role-branched; LECTURER → `$transaction(User+Lecturer)`), `CreateUserModal`
- ✅ Admin: last-admin guard — `adminUpdateUser` checks `prisma.user.count` before any ADMIN demotion/deactivation
- ✅ `sessionVersion` increment on role change + isActive toggle
- ✅ `adminTogglePin` UI on `AdminRecentPosts`
- ✅ Dedicated `/admin/posts` page — `getAdminPostsData()`, `AdminPostsTable` with 5-axis filter (search/status/type/scope/pinned-only), 5 stat cards
- ✅ Admin programme CRUD — `adminCreateProgramme` + `adminUpdateProgramme`, `ProgrammeModal`, `ProgrammeTable`
- ✅ Admin sections CRUD — `adminCreateSection` + `adminUpdateSection`, `SectionModal`, `SectionTable`, `isActive` soft-deactivation
- ✅ ThemeToggle stale-closure fix (localStorage read inside effect, not from closure variable)

**Deferred to Phase 7+ (not blocking HCI scope):**
- 🔲 Admin STUDENT role changes (require Student profile-row create/delete)
- 🔲 `callbackUrl` server-side sanitisation in `proxy.ts` redirect (S3 — client-side done, server path still raw)
