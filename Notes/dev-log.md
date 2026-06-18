# 2026-06-02 18:00 — Phase 6: Admin user create modal + last-admin guard (Phase 6 complete)

## Completed

- **`adminCreateUser` Server Action** (`admin/users/actions.ts`) — bcryptjs cost-12 hash; role-branched: LECTURER → `prisma.$transaction(User + Lecturer)`, STUDENT/ADMIN → bare `User.create`. STUDENT profile (15+ required fields) deferred to Phase 7+ enrollment flow.
- **`CreateUserModal` client component** — fixed-overlay modal (plain Tailwind); controlled role select drives visibility of lecturer-profile fields (staffNumber, department) and a "profile will be completed separately" notice for STUDENT/ADMIN. P2002 unique-constraint error surfaced inline. `useTransition` action call mirrors `EditUserModal`.
- **`UserTable` wiring** — "Add User" button opens `CreateUserModal`; on success triggers `router.refresh()` + snapshot-key remount.
- **Last-admin guard** added to `adminUpdateUser` — `prisma.user.count({ where: { id: { not: target }, role: 'ADMIN', isActive: true } })` before any demotion or deactivation of an ADMIN user; returns safe error if result is 0. Belt-and-suspenders: not reachable via UI (actor is always counted), defends against future guard relaxation.
- **AdminPostsTable optimistic toggle fix** — `PostActionRow` `useTransition` per-row sub-component corrected.
- **`tsc --noEmit`**: 0 errors. Phase 6 marked Done in CLAUDE.md.

## Status

**Phase 6 complete.** All lecturer + admin systems fully wired to Prisma. No open Phase 6 items remain.

---

# 2026-06-02 — Phase 6: /admin/posts page + adminTogglePin UI + ThemeToggle stale-closure fix

## Completed

- **`adminTogglePin` UI** added to `AdminRecentPosts` — Pin/Unpin button per post row alongside Publish/Unpublish; `onPinToggled` optimistic local-state patch + `router.refresh()`.
- **ThemeToggle stale-closure fix** — `ThemeToggle` read `theme` from the `useSyncExternalStore` closure inside the mount `useEffect` to decide whether to apply `.dark`. In system mode the store returns `'system'` during hydration regardless of stored value, so the `if (theme === 'system')` check always fired and stripped the server-applied `html.dark` class on refresh. Fix: read `localStorage.getItem('theme')` directly at effect runtime, not from the closure variable. CLAUDE.md updated.
- **`services/posts-queries.ts`** — `getAdminPostsData()`: `prisma.classPost.findMany` (no filter, no take limit), ordered `createdAt desc`; nested `courseSection.course.code` + `author.lecturer.fullName`; maps to `PostsPageRow` (`sectionLabel: 'Global announcement'` when `courseSectionId` is null).
- **`types/admin-posts.ts`** — `PostsPageRow` view-model type.
- **`components/admin/AdminPostsTable.tsx`** (`'use client'`) — `ChipBar` (reusable filter-chip group), `PostActionRow` (Publish/Pin/Remove with 3 separate `useTransition`s + confirm strip + `onDeleted`), `AdminPostsTable` (5-axis filter: search/status/type/scope/pinned-only combined in `useMemo`).
- **`/admin/posts/page.tsx`** — admin role guard; 5 stat cards (Total/Published/Drafts/Pinned/Global); snapshot key `posts:${id}:${isPublished?1:0}:${isPinned?1:0}` per row.
- **Sidebar nav entry** for `/admin/posts` added.
- **`tsc --noEmit`**: 0 errors.

---

# 2026-05-31 — Phase 6: Admin user role-change + deactivation surface

## Completed

- **`src/types/admin-users.ts`** — `UserPageRow` + `UserStats` view-model types (scoped to what `/admin/users` renders; `UserStats` page-only, not passed to `UserTable`).
- **`src/lib/schemas.ts`** — added `userIdSchema` (lenient UUID_RE — Zod v4 strict `uuid()` rejects seed deterministic IDs).
- **`src/app/(portal)/admin/users/actions.ts`** — `adminUpdateUser` Server Action. Guard chain: `assertAdmin()` (getValidatedSession + role check) → UUID validate → self-modification block → DB fetch → source-role scope check. Increments `sessionVersion` on every real write so the affected user is forced to re-login on their next request. Role-change scope: LECTURER↔ADMIN only (STUDENT requires profile-row work — deferred). Revalidates `/admin/users` + `/admin`.
- **`src/app/(portal)/admin/users/page.tsx`** — migrated from mock data to 5 parallel Prisma queries (4 counts + `user.findMany` with nested student/lecturer/programme/teachingAssignment selects). Snapshot-key remount pattern (`users:${...}`). Passes `initialUsers` + `currentAdminId` to `UserTable`.
- **`src/components/admin/EditUserModal.tsx`** — filled the `return null` stub with a full fixed-overlay dialog (plain Tailwind — `Modal.tsx` stub not used). Role select (LECTURER↔ADMIN) + account status select + deactivation warning banner (amber, active→inactive only) + Escape/outside-click close (both blocked while pending) + no-op submit if nothing changed + error display with `role="alert"`.
- **`src/components/admin/UserTable.tsx`** — rewritten: dropped all `mock-admin` / `mock-courses` imports; accepts `initialUsers: UserPageRow[]` + `currentAdminId: string` props; Students tab = STUDENT, Lecturers tab = LECTURER|ADMIN; department filter dynamic from real DB values; Edit button disabled + tooltip for self-row; `EditUserModal` rendered outside `<Card>` in fragment.
- **`tsc --noEmit`**: 0 errors. 5 commits to app submodule + 1 docs commit to project root.

## Pending

Browser-level smoke test (manual): log in as `admin.farouk` / `ucsi2024` → `/admin/users`, test Edit on a lecturer row (role change + deactivation), verify sessionVersion enforcement forces re-login in another tab.

Known gap: no "last admin guard" in `adminUpdateUser` — admin can deactivate all other admins with no DB-level protection. Deferred; direct DB access available as fallback for this scope.

---

# 2026-05-28 (graphify rebuild #2) — Knowledge graph updated post-Phase 5 hardening

## Completed

- **Full graphify pipeline re-run** on the complete project (297 files, ~427,655 words).
- 241/297 files served from cache; 56 new/changed files extracted via 3 parallel semantic subagents.
- New graph: **1,836 nodes · 2,519 edges · 234 communities** · 49.4× token reduction per query.
- **New god node:** `PrismaClient Singleton` (23 edges) — replaces `mock-admin.ts` from session 39 run, reflecting Phase 4/5 DB-layer centrality.
- **New hyperedges captured:** 4-layer auth enforcement, thecn E-Portfolio stack, hybrid section authz (Phase 5→6 bridge), Server Action protection chain, Prisma service layer (all 7 `*-queries.ts`).
- Token cost: 251,679 tokens this run (cache savings ~80%); cumulative 6 runs: 316,679 input / 24,450 output.

## Pending

No code changes. Phase 6 is next.

---

# 2026-05-28 (Codex auth followup) — Phase 5 hardening: 3 Codex rounds, all M+S findings closed

## Completed

**Build break: `middleware.ts` + `proxy.ts` coexisting:**
- Session 40 created `src/middleware.ts` (one-line re-export) alongside `src/proxy.ts`. Next.js 16 Turbopack errors hard when both files exist (`middleware-to-proxy` build error).
- Fix: `src/middleware.ts` deleted. `proxy.ts` is the only middleware file. Function name inside must be `proxy` (not `middleware`).

**Server Action revalidation gap:**
- `(portal)/layout.tsx` runs `isActive`+`sessionVersion` DB check on every render but Server Actions bypass the layout — stale JWTs could invoke mutations for up to 24h.
- Fix: Created `src/lib/session-guard.ts` — `getValidatedSession()` wraps `auth()` with the same `isActive`+`sessionVersion` Prisma query. All 3 Server Actions (`feedback/actions.ts`, `profile/actions.ts`, `lecturer/profile/actions.ts`) switched from raw `auth()` to `getValidatedSession()`.

**Lecturer-route policy inconsistency:**
- Proxy and layout both had `role !== 'lecturer' && role !== 'admin'` (admin allowed). Page guards said admin denied — boundary contradiction.
- Fix: Both changed to `role !== 'lecturer'` only. All three protection layers now agree.

**Ownership identifier doc contradiction:**
- `docs/security-notes.md` used `post.authorId !== session.user.lecturerId` — wrong identifier space. `ClassPost.authorId → User.id` (= `session.user.id`); only `LearningResource.uploadedBy` uses `session.user.lecturerId`.
- Fix: Corrected in `security-notes.md`; `auth-rbac-review.md` M4 code block updated with inline comments distinguishing both spaces.

**Type-runtime consistency:**
- Kept `session.user.id = token.sub ?? ''` with explanatory comment. The `if (token.sub)` form is type-unsound (leaves the field uninitialized while the declared type promises `string`).

**Doc-staleness resolved:**
- `auth-rbac-review.md` M1 and M3 section bodies replaced with "✅ Resolved" notices; removed dangerous "create `src/middleware.ts`" instruction.
- `auth-flow.md` "Known Implementation Gaps" → "Implementation Status".

## Commits

- App submodule: `3a6db03` (session-guard.ts, delete middleware.ts, proxy.ts + layout.tsx lecturer-route fix, 3 actions)
- Root repo: `bc71fb8` (docs + notes + submodule pointer)

## Pending

Phase 5 fully hardened. Phase 6 is next.

---

# 2026-05-28 (session 40) — Phase 5: Auth/RBAC hardening + email login + thecn e-portfolio

## Completed

**Auth.js identifier split:**
- Students use `emailInstitutional` (`20024XXXXX@ucsicollege.edu.my`); lecturers + admin use `username`.
- `authorize()` branches on `identifier.includes('@')`; email path requires `role=STUDENT`; username path rejects any STUDENT.
- `prisma/scripts/updateStudentEmails.ts` — re-run after any `prisma db seed`.

**4-layer route protection wired:**
- Layer 1 (`proxy.ts`): `getToken({ secret })` + role-prefix check; sets `x-invoke-path` on pass-through.
- Layer 2 (`(portal)/layout.tsx`): reads `x-invoke-path` for role-to-route check + `prisma.user.findUnique({ select: { isActive, sessionVersion } })` per request.
- Layer 3 (each page): `auth()` + role + profile-ID guard. All 7 lecturer + 6 admin pages wired.
- Layer 4 (Server Actions): `getValidatedSession()` — added in Codex followup.

**Lecturer `[sectionId]` pages — real DB authorization:**
- Both dynamic pages now query `prisma.teachingAssignment.findUnique({ where: { lecturerId_courseSectionId: … } })`. Real authz; display data still on mocks (Phase 6).

**thecn e-portfolio:**
- Migration `20260528000000_add_thecn_username` added `thecnUsername VARCHAR(100)?` to both `Student` and `Lecturer`.
- `<ThecnEditForm>` on both profile pages; `updateStudentThecnUsername` + `updateLecturerThecnUsername` Server Actions.
- Lecturer profile made `async`; reads `thecnUsername` from DB (partial-migration pattern).

**Security findings closed:** M1–M5, S1/S2, S5/S6. See `docs/auth-rbac-review.md`.

## Pending

Codex review pass (see entry above). Phase 6 next.

---

# 2026-05-28 (session 39) — Graphify full rebuild

## Completed

**Graphify knowledge graph rebuilt from scratch (all 286 files):**
- 1,820 nodes · 2,582 edges · 202 communities
- 156 files served from cache; 130 files re-extracted via 6 parallel semantic subagents
- Community labels assigned to top 37 communities (Auth & Prisma Services, Security & Authorization, Legacy IISV2 UI clusters, Admin Dashboard Shell, etc.)
- HTML visualization regenerated: `graphify-out/graph.html`
- Token reduction benchmark: **58.8×** vs raw file scan (avg query ~2,063 tokens)
- Cumulative cost: 65,000 input / 24,450 output tokens across 5 runs

**God nodes identified:** `formatDate()` (bridges 11 communities), `Badge()`, `Card()`, `CardContent()`, `cn()`, `mock-admin.ts`

**Surprising connections found:**
- Layout Structure Brainstorm (`.superpowers`) still structurally linked to live `PortalLayout()`
- `SectionResourceManager` → `lecturerService` REST stub (Phase 6 forward-dependency visible in graph)
- Page-Scoped View-Model Types pattern directly connected to `ClassesPageData` across doc↔code boundary

## Pending

- No code changes this session. All Phase 5 items remain complete.
- Phase 6 is next: real file uploads, presigned downloads, admin CRUD, `sessionVersion` DB check, `Student.thecnUsername` schema.

---

# 2026-05-27 (session 38) — Phase 5: runtime bug fixes (MissingSecret + hydration mismatch)

## Completed

**`middleware.ts` — MissingSecret runtime error:**
- `getToken({ req })` (introduced by linter in session 37) requires `secret` passed explicitly when called outside the NextAuth handler.
- **Fix:** `getToken({ req, secret: process.env.AUTH_SECRET })`. `AUTH_SECRET` was already in `.env.local`.

**`LoginPageClient.tsx` — password manager hydration mismatch:**
- Browser console: React hydration mismatch on `<input>` elements. The diff showed `data-np-intersection-state="visible"` injected by a password manager extension before React loaded. React 19 treats unexpected attributes as unrecoverable mismatches, killing all event handlers on the subtree.
- **Fix:** Added `suppressHydrationWarning` to both the `username` and `password` inputs (same pattern as `DevRoleSwitcher` `<select>` in Phase 3).

## Pending

- **`sessionVersion` DB check** — deferred to Phase 6. 24h JWT maxAge limits the stale window.
- **Phase 6:** Lecturer/admin pages on mocks; real file upload; presigned download URLs; admin CRUD; `thecnUsername` schema column; Classes page global announcements strip.

---

# 2026-05-27 (sessions 36–37) — Phase 5: Auth.js v5 + RBAC (complete) + Edge Runtime fix

## Completed

**Phase 5 — Auth.js v5 + RBAC fully wired:**
- **Password seed** — `prisma/scripts/seedPasswords.ts` ran UPDATE on all 14 users; all hashed with bcryptjs cost 12; dev password `ucsi2024`.
- **Type augmentation** — `src/types/next-auth.d.ts` extends `Session.user` + `JWT` with `role`, `studentId`, `lecturerId`, `sessionVersion`. `types/user.ts` gained `sessionVersion: number` on `SessionUser`.
- **`auth.ts`** — `CredentialsProvider`: Zod validates `username`+`password`, bcrypt.compare, returns lowercase `role` + `sessionVersion`. `jwt` callback: on sign-in fetches `studentId`/`lecturerId` + `fullName` from DB; admin formats display name from username. `session` callback: maps token claims to `session.user`. Exports `handlers`, `auth`, `signIn`, `signOut`, `GET`, `POST`.
- **`auth.config.ts` (new)** — edge-safe config (no Prisma, no bcrypt) — `pages`, `providers: []`, `session.strategy`. Used by middleware.
- **`middleware.ts`** — calls `NextAuth(authConfig)` (not `@/auth`); JWT-only; redirects unauthenticated to `/login?callbackUrl=…`; student routes, lecturer-or-admin routes, admin-only routes enforced.
- **Login page** — replaced 3-card mock role picker with real `username`+`password` form (`signIn('credentials', { redirect: false })`); inline error on bad credentials; server wrapper redirects already-authenticated users to their role home.
- **`LayoutContext`** — removed `mockRole`/`setMockRole`. Context is now sidebar + mobile state only.
- **Portal layout** — `async`; calls `auth()`; passes `role`+`userName` as props to `TopBar`, `Sidebar`, `MobileDrawer`.
- **Shell components** — `TopBar`, `UserMenu`, `Sidebar`, `MobileDrawer` accept `role`/`userName` props; no more `useLayoutContext` for role. `UserMenu` uses real `signOut({ callbackUrl: '/login' })`. `DevRoleSwitcher` deleted.
- **7 student pages** — all `DEMO_STUDENT_ID` constants replaced with `session.user.studentId` (plus `redirect('/login')` guard). `dashboard-queries.ts` `DEMO_STUDENT_ID` export removed.
- **`profile-queries.ts`** — `findUniqueOrThrow` chained with `.catch()`: Prisma P2025 → `redirect('/login')`; other errors re-thrown.
- **`feedback/actions.ts` (new)** — `'use server'` `submitFeedback` Server Action: reads `session.user.studentId`, Zod validates subject + body, `prisma.feedback.create`.
- **`FeedbackForm.tsx`** — wired to `submitFeedback` via `useActionState`; success banner replaces form on submit; loading state on button; disabled stub + Phase-5 notice removed.
- **`tsc --noEmit`**: 0 errors.

**Edge Runtime fix (session 37):**
- `middleware.ts` imported `auth` from `@/auth` which transitively loaded `@/lib/prisma` (pg driver) + bcryptjs — both require `node:util/types` (Node.js built-in unavailable in the Edge Runtime). Browser logged `Failed to load external module node:util/types`.
- **Fix:** Split config pattern. `auth.config.ts` has no Node.js deps and is imported by middleware. `auth.ts` spreads `authConfig` then adds full providers + callbacks. Middleware calls `const { auth } = NextAuth(authConfig)` locally — Prisma/bcrypt never touch the edge.

## Pending

- **`sessionVersion` DB check** — deferred to Phase 6. JWT carries the claim; middleware does not validate against DB (edge-incompatible). 24h `maxAge` limits stale window.
- **Classes page global announcements strip** — `data.globalPosts` not yet rendered; deferred per roadmap.
- **`Student.thecnUsername` schema field** — E-Portfolio card stays hidden until Phase 6 migration.
- **Phase 6:** Lecturer/admin pages on mocks; real file upload; presigned download URLs; admin CRUD; `thecnUsername` column.

---

# 2026-05-26 (session 35) — Phase 4b: Codex correctness fixes (dashboard + service layer)

## Completed

**Dashboard correctness fixes (3 Codex findings):**
- **CGPA subtitle** — `"Current semester"` → `"All published results"` (`dashboard/page.tsx`). Service computes all-time weighted average; label now matches.
- **Balance Due subtitle** — `{data.semesterName}` → `"Outstanding balance"` (`dashboard/page.tsx`). Service sums all invoices across all semesters; binding it to a semester name was semantically wrong.
- **Announcement UUID pill** — Q4 now selects `courseSection: { select: { sectionCode: true } }`; service maps `sectionCode`; `DashboardPageData` + `DashboardAnnouncement` type both carry the field; pill renders `sectionCode ?? courseSectionId` (fallback preserved). Students now see e.g. "Section: A" not a UUID.

**Service-layer hardening fixes (5 Codex findings):**
- **Nondeterministic lecturer (2 services)** — `academic-queries.ts` and `timetable-queries.ts` both had `teachingAssignments: { take: 1 }` without `orderBy`. Added `orderBy: { assignedAt: 'asc' }`. All 4 services now deterministic (classes + dashboard already had it).
- **`addressLine2` silently dropped** — `profile-queries.ts` fetched it; `types/profile.ts` declared it; `profile/page.tsx` neither destructured nor rendered it. Added to destructure; renders `<Field label="Address Line 2" value={addressLine2} />` conditionally when truthy.
- **`include: true` overfetch in academic-queries** — both `currentEnrollments` and `pastEnrollments` queries used `include: { course: true, result: true }` pulling all columns. Replaced with narrow `select` shapes (only `code`, `title`, `credits`, `type`, `grade`, `isPublished`, `attendancePercentage`, `standing`, and structural join fields). Matches the select pattern of every other Phase 4b service.
- **Helper duplication extracted** — `GRADE_POINTS`, `toTime`, `toISODate` were repeated across academic, timetable, dashboard, and profile services. Extracted to `app/src/lib/query-helpers.ts`; all 4 services now import from there. Local copies removed.
- **Enrollment select duplicated in profile-queries** — the two `findFirst` fallback calls had identical `select` blocks. Extracted to `const ENROLLMENT_SELECT` — fallback behavior unchanged, drift risk eliminated.

**Type-check:** `tsc --noEmit` clean after all changes. 0 errors.

## Pending

- Phase 5: Auth.js v5 — replace all `DEMO_STUDENT_ID` with `session.user.studentId`; wire `FeedbackForm` Server Action; catch `P2025` in `profile-queries.ts` → redirect `/login`.
- Phase 6: Real file upload, presigned download URLs, admin CRUD wired to DB, `Student.thecnUsername` schema column.

---

# 2026-05-26 (session 34) — Phase 4b: Dashboard Prisma migration (Phase 4b complete)

## Completed

- **`app/src/types/dashboard.ts` created** — page-scoped `DashboardScheduleItem` + `DashboardPageData` view-model types. Announcements use inline shape compatible with `DashboardAnnouncement` from `AnnouncementFeed.tsx`.
- **`app/src/services/dashboard-queries.ts` created** — `getDashboardData(studentId)`. 5 Prisma queries across 2 `Promise.all` round-trips: Q1 student + current-semester schedule (`sectionEnrollments` relation), Q2 all-time SSE for CGPA, Q3 invoices for balance; then Q4 announcements + Q5 `notification.count` (with `.catch(() => 0)` fallback). CGPA = weighted average of all published results (GRADE_POINTS map duplicated from academic-queries — YAGNI at 2 consumers). Balance = COMPLETED-only payments, clamped ≥ 0.
- **`app/src/(portal)/dashboard/page.tsx` migrated** — async, removed 6 mock imports (`mockStudent`, `mockCourseSections`, `mockCourses`, `mockInvoices`, `mockCGPA`, `MOCK_SECTION_LECTURER_IDS`/`MOCK_LECTURER_NAMES`) + inline `ANNOUNCEMENTS` array + 2 module-scope `const` computations. No JSX changes.
- **One compile fix:** Prisma relation on Student model is `sectionEnrollments` (not `studentSectionEnrollments`) — caught by `tsc --noEmit`.
- **Playwright verification passed:** Header "Welcome back, Ahmad", UCSI-2022-001, Semester 1 2023/24, CGPA 3.66 (all-time), 11 credits / 4 subjects, Balance RM 1,580.00, Notifications 2 (real unread from DB — was hardcoded 3), 4 schedule cards Mon→Thu with lecturer names, announcements panel populated. 0 console errors.

## Phase 4b Status

**All 7 student pages now on Prisma.** Mock data imports removed from: Academic, Timetable, Finance, Classes, Profile, Feedback, Dashboard. Lecturer + Admin pages still on mocks (Phase 6).

## Pending

- **Phase 5:** Auth.js v5 — replace all `DEMO_STUDENT_ID` constants with `session.user.studentId`; wire `FeedbackForm` to a real Server Action; add `P2025 → redirect('/login')` to `profile-queries.ts`; design Announcements strip on Classes page.
- **Phase 6:** Real file upload, presigned download URLs, admin CRUD wired to DB.

---

# 2026-05-26 (session 33) — Phase 4b: student Profile page Prisma migration

## Completed

- **`app/src/types/profile.ts` created** — page-scoped `ProfilePageData` + `ProfileEnrollment` view-model types (following the `types/classes.ts` pattern). Canonical `Student`/`ProgrammeEnrollment` types unchanged in `types/student.ts`.
- **`app/src/services/profile-queries.ts` created** — `getProfileData(studentId)`:
  - `prisma.student.findUniqueOrThrow` — single query; `select` omits `maritalStatus`, `avatarUrl`, `createdAt`, `updatedAt` (not rendered on the page).
  - Joins `programmeEnrollments` (most-recent by `intakeDate desc`, `take: 1`) → `programme` (name, code) in one nested select; no second query needed.
  - `@db.Date` → `toISODate()` helper (Date → "YYYY-MM-DD") applied to `dateOfBirth`, `intakeDate`, `expectedGradDate`.
  - `Gender` / `ProgrammeEnrollmentStatus` DB enums → `.toLowerCase()`.
  - `addressLine2 ?? undefined` (nullable field).
  - `thecnUsername: undefined` — field is not in the Student schema; E-Portfolio card stays hidden. **TODO Phase 6:** add `thecnUsername` to `Student` model + migration.
- **Profile page migrated** (`app/src/app/(portal)/profile/page.tsx`):
  - Removed `mockStudent` + `mockProgrammeEnrollment` imports from `@/data/mock-student`.
  - Page is now `async`; `DEMO_STUDENT_ID` constant with Phase 5 TODO.
  - `null` guard on enrollment section (empty state: "No programme enrolment on record.").
  - **New field:** `Programme` row added to the enrolment card (shows programme name from the DB join — was absent from the mock-era page).
  - Gender value now capitalized in the Personal Information card (DB returns lowercase; mock was also lowercase but `Field` displayed as-is).
  - E-Portfolio card conditional on `data.thecnUsername` (unchanged — still hidden).
- **Verified:** `tsc --noEmit` — 0 errors. `npm run lint` — clean.
- **Commits:** `464422a` (app); `1d1177c` (root).

## Architecture Decisions

- **`findUniqueOrThrow` for profile** — the demo ID is guaranteed in the seed; a missing record is a seed/config error in Phase 4. Phase 5 should catch `P2025` and redirect to `/login` (missing profile = broken session).
- **Single nested query** — Student + most-recent ProgrammeEnrollment + Programme in one `findUniqueOrThrow`. No N+1. Avoids a second `programmeEnrollment.findFirst` call.
- **`thecnUsername` is a schema gap** — the `Student` model has no `thecnUsername` column. The type returns `undefined`; the card stays hidden. Adding the column + migration is a Phase 6 task (requires schema change + data entry UI).
- **Programme name included in enrollment data** — free to include via the join; makes the enrolment card more informative and avoids a second query when Phase 5 needs it for the header badge.

## Pending

- **Phase 4b remaining:** 2 student pages — `feedback`, `dashboard`. Then lecturer + admin pages.
- **Phase 6 schema gap:** `thecnUsername` not in Student schema → E-Portfolio card always hidden.
- Phase 5: Auth.js v5, replace `DEMO_STUDENT_ID`. Catch `P2025` on `findUniqueOrThrow` → redirect to `/login`.

## Next Recommended Step

Migrate the Feedback page — create `services/feedback-queries.ts`. Simpler than Dashboard (read-only history list + form submit stub). Then Dashboard last (broadest joins).

---

# 2026-05-26 (session 32) — Phase 4b: Classes page Prisma migration

## Completed

- **`app/src/services/classes-queries.ts` created** — `getClassesData(studentId)`:
  - Single `studentSectionEnrollment.findMany` (status=ENROLLED, `isCurrent` semester) with nested selects — one DB round-trip for sections, course, semester name, primary lecturer, published resources + first attachment, published posts.
  - Primary lecturer: `teachingAssignments: { orderBy: { assignedAt: 'asc' }, take: 1 }` — deterministic for co-assigned sections (s001: Amirul Hassan; s003: Khairul Azwan).
  - Published resources only: `where: { isPublished: true }` — hits `@@index([courseSectionId, isPublished])`. Draft resources (r17, r18) excluded at the DB layer.
  - First attachment only: `attachments: { take: 1 }` — matches `ClassSectionCard`'s `ResourceWithAttachment` singular shape. `storageKey` intentionally excluded from select (internal S3/R2 path, not for clients).
  - `fileSizeBytes: BigInt` → `Number()` conversion (safe up to ~8 PB).
  - `ResourceType` / `PostType` DB enum → `.toLowerCase() as ResourceType/PostType`.
  - Posts sorted pinned-first in JS (Prisma can't sort `boolean DESC + datetime DESC` in one `orderBy`).
  - Second query for global posts (`courseSectionId IS NULL, isPublished: true`) — fetched, TODO UI Phase 5.
  - Returns `{ semesterName, sections: ClassesSectionData[], globalPosts: ClassPost[] }`.
- **Classes page migrated** (`app/src/app/(portal)/classes/page.tsx`):
  - Removed 4 mock imports: `mockCourseSections`, `mockCourses` (from `mock-courses`), `mockResources`, `mockAttachments` (from `mock-resources`), `mockClassPosts`, `MOCK_SECTION_LECTURER_IDS`, `MOCK_LECTURER_NAMES` (from `mock-posts`).
  - Page is now `async`; `DEMO_STUDENT_ID = '40000000-0000-0000-0000-000000000001'` (STU[1] Ahmad Hafizi) with Phase 5 TODO comment.
  - Subtitle uses `data.semesterName` (was hardcoded "Semester 1 2023/24"); empty-state when `semesterName` is null.
  - Category grouping logic unchanged — `CATEGORIES.map/filter` now reads from `sec.resources` (enrollment-gated, published-only from DB) instead of `mockResources` + `mockAttachments.find`.
  - `ClassSectionCard` props populated directly from `ClassesSectionData`; no mock maps needed.
  - Added empty-state paragraph when `data.sections.length === 0`.
  - TODO comment in page for `data.globalPosts` UI rendering (deferred — current page design has no global-post surface).
- **Verified:** `tsc --noEmit` — 0 errors. `npm run lint` — clean.
- **Commits:** `0b364f3` (app); `881015d` (root).

## Architecture Decisions

- **Single nested `findMany` for all section data** — avoids N+1 per-section queries. Resources, attachments, posts, and lecturer all pulled in one Prisma call via nested selects.
- **`take: 1` on `teachingAssignments` (ordered by `assignedAt asc`)** — gives the "primary" lecturer without exposing co-assignment complexity to the student view. Phase 6 admin surfaces can join all assignments without this limit.
- **`take: 1` on `attachments`** — ClassSectionCard renders one attachment per resource (download button). The `LearningResource.attachments?` plural field is part of the base type but unused here; `attachment?` (singular) is the card's contract.
- **Global posts fetched but not yet rendered** — requirement says `courseSectionId = null` posts should "still appear"; they're in `data.globalPosts`. UI placement (announcements strip above section cards) is deferred to Phase 5 when page-level design is settled.
- **Category grouping stays in the page** — pure UI transformation (filter resources by type, attach label). No reason to push it into the service layer.

## Pending

- **Phase 4b remaining:** 3 student pages — `dashboard` (next), `feedback`, `profile`. Then lecturer + admin pages.
- Phase 5: Auth.js v5, real session, replace `DEMO_STUDENT_ID`. Also: render `globalPosts` on the Classes page.
- Phase 6: Real file upload, presigned downloads, admin CRUD.

## Next Recommended Step

Migrate the Dashboard page — create `services/dashboard-queries.ts`. Broadest data surface (announcements, upcoming sessions, CGPA, balance due). Follow the academic/timetable/finance templates; apply Maps-over-find for joins and COMPLETED-only filter for any balance shown.

---

# 2026-05-25 (session 31) — Phase 4b: Finance Prisma migration

## Completed

- **`app/src/services/finance-queries.ts` created** — `getFinanceData(studentId)`: single `prisma.invoice.findMany` with full `select` shape (9 columns) + nested payments `select`. Returns `{ invoices, payments }`. Empty-state early return when no invoices.
- **Finance page migrated** — removed `mockInvoices`/`mockPayments` imports; page is `async`; reads live Prisma data. `DEMO_STUDENT_ID` constant with Phase 5 TODO. UI/JSX layout unchanged.
- **`amountOutstanding` computed in JS** (not a DB column): `max(0, tuitionFee − lessAmount − SUM(payments WHERE status = 'COMPLETED'))`. Non-COMPLETED payments must not reduce balance — schema invariant at `schema.prisma:476`.
- **5 Codex-review fixes applied** (`834d1e3`): (1) COMPLETED-only filter + `Math.max(0, ...)` clamp on `amountOutstanding`; (2) `totalPaid` summed from completed payments directly — was deriving from `tuitionFee − amountOutstanding` which incorrectly counted `lessAmount` discounts as money paid; (3) payment status badge now uses `PAYMENT_STATUS_VARIANT` Record map instead of hardcoded "Completed"; (4) `include` on invoice row narrowed to full `select` shape; (5) `referenceNo ?? '—'` fallback in receipt text.
- **Verified live:** Outstanding RM 1,580.00 / Total Paid RM 11,815.60 / Total Invoiced RM 13,395.60 / 3 invoice rows / 3 payment history entries. All matched seed values. `tsc --noEmit`: 0 errors.
- **Commits:** `376b005`, `834d1e3` (app); `3dc487d`, `287c6e5`, `6b2f782` (root).

## Architecture Decisions

- **`select` over `include` even with no PII** — fetch only the 9 columns the page renders; avoids Node memory waste on every load.
- **`totalPaid` must sum completed payments directly** — `Σ(tuitionFee − amountOutstanding)` counts `lessAmount` (discounts/waivers) as money received. The label says "Total Paid" so the value must be actual money in.
- **Hardcoded status badges are a correctness bug** — when the data model carries a status enum, always map via `Record<>` lookup. A failed payment showing a green "Completed" badge actively misinforms the user.
- **Flat payment list via `flatMap`** across invoices' nested arrays; sorted by `paymentDate desc` using ISO string `localeCompare` — ISO strings sort correctly lexicographically, no `new Date()` parse needed.

## Pending

- **Phase 4b remaining:** 4 student pages — `dashboard` (next), `classes`, `feedback`, `profile`. Then lecturer + admin pages.
- Phase 5: Auth.js v5, real session, replace `DEMO_STUDENT_ID`.
- Phase 6: Real file upload, presigned downloads, admin CRUD.

## Next Recommended Step

Migrate the Dashboard page — create `services/dashboard-queries.ts`. Broadest data surface (announcements, upcoming sessions, CGPA, balance due). Follow the finance/academic/timetable templates; apply Maps-over-find for joins and COMPLETED-only filter for any balance shown.

---

# 2026-05-25 (sessions 29–30) — Phase 4b: Academic + Timetable Prisma migration

## Completed

- **`app/src/lib/prisma.ts` created** — PrismaClient singleton with PrismaPg adapter and `globalThis` hot-reload cache. Shared by all Phase 4b service modules.
- **`app/src/services/academic-queries.ts` created (session 29)** — `getAcademicData(studentId)`: 4 Prisma queries (student/enrollment/programme, semesters, current enrollments with course/result/lecturer, past enrollments with result). Grade-point map (Malaysian scale), CGPA + previousCgpa computation. `select:` shape throughout — no PII columns fetched.
- **Academic page migrated (session 29):** Removed 4 mock imports; page is now `async`; reads live Prisma data. UI unchanged.
- **`SectionResult` relocated** to `types/academic.ts` (was `data/mock-results.ts`) — academic component stack no longer imports any mock module.
- **`prisma/seed.ts` typing fix:** `Parameters<typeof prisma.attendance.createMany>[0]['data']` → `Prisma.AttendanceCreateManyInput[]` (lines 612, 680). Unblocked `tsc --noEmit`.
- **`app/src/services/timetable-queries.ts` created (session 30)** — `getTimetableData(studentId)`: 2 Prisma queries (enrolled sections in current semester with course/semester/lecturer; attendance records for those sections). Returns `{ semesterName, sections, courses, lecturerNames, attendance }`.
- **Timetable page migrated (session 30):** Removed 5 mock imports (`mockCourseSections`, `mockCourses`, `MOCK_SECTION_LECTURER_IDS`, `MOCK_LECTURER_NAMES`, `MOCK_STUDENT_ATTENDANCE`). `getLecturerName` helper removed. Module-scope computations moved inside the async component. Semester subtitle now reads from `Semester.name` in DB.
- **Timetable join logic hardened (Codex, session 30):** Replaced repeated O(n) `find()`/`filter()` calls and `!` non-null assertions with precomputed `sectionById`, `courseById`, `attendanceBySection` Maps. Impossible join misses filtered out safely rather than crashing.
- **Verified live:** Both migrated pages render real seed data — correct lecturer names, room numbers, times, attendance records, semester name. `tsc --noEmit`: 0 errors.
- **Commits:** `f0a111c`, `f6e4c76`, `0ade1ba` (app — academic), `ccc5145`, `93e248d` (app — timetable). Root submodule bumps: `14d4b05`, `4c10ac1`, `df2110c`, `263f537`, `89db3d4`, `9159a5f`.

## Architecture Decisions

- **`services/*-queries.ts` pattern established** — each page gets its own `getXxxData(studentId)` service module. `select:` over `include:` for any query touching Student (PII). Page components become `async` and import only the service.
- **`DEMO_STUDENT_ID = '40000000-0000-0000-0000-000000000001'`** (STU[1] Ahmad Hafizi) hardcoded in each page with `// TODO Phase 5: session.user.studentId` comment.
- **Type mappings applied in service layer** (not in components): `dayOfWeek + 1`, `@db.Time → slice(11,16)`, `@db.Date → split('T')[0]`, Decimal → `Number()`, Prisma enum → `.toLowerCase()`, unpublished Result guarded by `isPublished` before reading grade.
- **Maps over find() for join lookups:** O(1) Map lookups replace O(n) array scans wherever attendance/sections/courses are joined in the component.

## Pending

- **Phase 4b remaining:** 5 student pages still on mock data — `dashboard`, `classes`, `finance`, `feedback`, `profile`. Migrate one at a time following `services/academic-queries.ts` + `services/timetable-queries.ts` as templates.
- Phase 5: Auth.js v5, real session, replace `DEMO_STUDENT_ID` with `session.user.studentId`.
- Phase 6: Real file upload, presigned downloads, admin CRUD.

## Next Recommended Step

Migrate the Dashboard page — create `services/dashboard-queries.ts`. The dashboard has the broadest data surface (announcements, upcoming sessions, CGPA, balance due) and will exercise the most Prisma joins. Follow the academic-queries template.

---

# 2026-05-24 (sessions 27–28) — Phase 4: seed fix pass + DAC realism

## Completed

- **`app/prisma/seed.ts` — all tables seeded, clean run.** `npx prisma db seed` completes through all 19 steps with `✅ Seed complete.` Row counts: 14 users / 3 programmes / 5 semesters / 16 courses / 16 sections / 21 SSE / 8 TA / 70 attendance / 9 invoices / 19 resources (+ 17 attachments) / 11 posts / 10 notifications / 4 feedback.
- **Programme/section consistency:** DBM students (stu-4, stu-5) and DAC student (stu-6) were enrolled in DIT sections. Fix: added `SEC.dbm001` + `SEC.dac001` with own courses (`DBM1013`, `ACC1013`) and teaching assignments; repointed their `StudentSectionEnrollment` rows.
- **Past-semester SSE status corrected:** 10 historical SSE rows for stu-1 were `DROPPED`. Fixed to `ENROLLED` — `DROPPED` means withdrew mid-section; past completed coursework must be `ENROLLED`.
- **Attendance dates shifted into semester bounds:** All 65 entries had July/Aug 2023 dates, before `SEM_DIT_3` start (2023-09-01). Rewritten to Sep–Nov 2023, aligned to each section's day-of-week. Statuses preserved.
- **Draft resource notification fixed:** Notification 0004 referenced `LR.r17` (`isPublished: false`). Replaced with published `LR.r07`.
- **Explicit pool shutdown:** `.finally(() => prisma.$disconnect())` → `.finally(async () => { await prisma.$disconnect(); await pool.end() })`. Process previously hung after seed.
- **DAC section reassigned to active lecturer:** `SEC.dac001` was assigned to lec-4 (Rashid, `isActive: false`). Reassigned to lec-2 (Siti, School of Business Management) — inactive lecturer makes the DAC path untestable.
- **DAC activity added:** 5 stu-6 attendance rows in dac001 (Thursdays within SEM_DAC_1); `LR.r19` (Week 1 Accounting slides, `isPublished: true`) + attachment; `CP.p11` (welcome post). DAC section now has enough data to exercise all three resource/post/attendance query paths.
- **Misleading SSE comments removed:** Stripped parentheticals "ENROLLED = completed coursework" from historical SSE comment lines — the status is enrollment state, not a graduation marker. Semantics documented in CLAUDE.md.
- **Commits:** `5a79248` (app — initial seed), `81c73d2` (app — DAC realism), `535c645` + `d80323d` (root — submodule bumps).

## Architecture Decisions

- **DBM/DAC students get their own sections, not repointed to DIT sections.** Minimal fix: no student profile or programme enrollment rows changed. Only two new sections + courses + TA rows added.
- **Seed invariants now stable** — programme/section consistency, ENROLLED vs DROPPED semantics, attendance-within-bounds, notifications-only-published, composite FK validation, PrismaPg adapter, pool.end() shutdown. All documented in CLAUDE.md "Seed data invariants" convention bullet.
- **DAC section must be assigned to an active lecturer** — inactive lecturer can't create a session in Phase 5; assigning one makes the whole teaching path dead on arrival.

## Pending

- **Phase 4 remaining:** Page-by-page Prisma query migration — replace `mock-*.ts` imports one page at a time. Do NOT big-bang. Start with one student-facing page (academic or dashboard).
- Phase 5: Auth.js v5, real session, middleware guards.
- Phase 6: Real file upload, presigned downloads, admin CRUD.

## Next Recommended Step

Begin page-by-page Prisma query migration. Pick one student-facing page (dashboard or academic), replace its mock imports with Prisma queries, verify it renders correctly, then move to the next page.

---

# 2026-05-23 (session 26) — Phase 4: schema correctness + migration squash

## Completed

- **Codex MEDIUM — TIMESTAMP(3) → TIMESTAMPTZ(3):** All 20 instant-in-time `DateTime` fields across 11 tables annotated `@db.Timestamptz(3)` in `schema.prisma`. Covers `User`, `Session`, `Student`, `StudentSectionEnrollment`, `TeachingAssignment`, `LearningResource`, `ClassPost`, `Payment`, `Notification`, `Feedback`, `AddDropRequest`, `ProgressionRequest`, `AdminAuditLog`. Calendar-date (`@db.Date`) and time-of-day (`@db.Time`) fields unchanged.
- **Codex LOW — redundant single-column indexes removed:** Dropped `@@index([courseSectionId])` from `LearningResource` and `ClassPost`; the composite `@@index([courseSectionId, isPublished])` already covers the prefix. Index comments updated.
- **Applied fix migration:** `prisma migrate dev --name timestamptz_and_index_cleanup` → `20260522155528_timestamptz_and_index_cleanup`.
- **Squashed migration history:** Patched `20260522153948_init/migration.sql` directly (all `TIMESTAMP(3)` → `TIMESTAMPTZ(3)`, removed two redundant `CREATE INDEX` statements). Deleted the separate fix migration. Reset dev DB (`prisma migrate reset --force`, user-consented). Single clean init now produces the reviewed schema exactly.
- **Commits:** `65e3145` (schema + fix migration), `d43380a` (squash: patched init, deleted fix migration).

## Architecture Decisions

- **Squash migrations in dev phase before production deployment** — two migrations producing identical final state is acceptable in production; before first deploy it creates noise and obscures intent. Squashing is the right call when no data needs to be preserved.
- **All plain `DateTime` → `@db.Timestamptz(3)` in this schema** — every untyped `DateTime` in the schema is an instant-in-time. Date-only fields already have `@db.Date`; time-of-day fields have `@db.Time`. A global `TIMESTAMP(3)` → `TIMESTAMPTZ(3)` replace in the init SQL was therefore safe.

## Pending

- Phase 4 remaining: seed DB from `mock-*.ts` files (`prisma/seed.ts`); then page-by-page Prisma query migration (do NOT big-bang).
- Phase 5: Auth.js v5, real session, middleware guards.
- Phase 6: Real file upload, presigned downloads, admin CRUD.

## Next Recommended Step

Write `app/prisma/seed.ts` — seed all tables from the existing `mock-*.ts` files so the dev DB has realistic data before replacing mock imports page by page.

---

# 2026-05-22 (session 25) — Phase 4: Prisma schema + initial migration

## Completed

- **AdminRecentPosts.tsx — misdirected CTA removed:** Footer "View all posts" linked to `/admin/resources` (wrong page); no `/admin/posts` route exists. Removed `<CardFooter>` + unused imports. Committed `d332f6a`.
- **`--text-muted` sweep (3 files):** `classes/page.tsx`, `ClassSectionCard.tsx`, `UserMenu.tsx` — readable metadata switched to `--text-secondary`. Committed `14e9211`.
- **`app/prisma/schema.prisma` created** — 20 domain models + `Session`, 16 enums. Key constraints applied from Codex review: `ClassPost.courseSection onDelete: Restrict` (not SetNull), `CourseSection @@unique([semesterId, courseId, sectionCode])`, `@@index([courseSectionId, isPublished])` on `LearningResource` + `ClassPost`, redundant `TeachingAssignment` composite `@@index` removed. Committed `0b8e17c`, `78ef15e`, `d7af865`.
- **`app/prisma.config.ts` created** — Prisma 7 config; `datasource.url`; `loadEnvFile()` helper that reads both `.env` and `.env.local` so `DATABASE_URL` resolves for the CLI subprocess. Committed with schema.
- **`app/.env` created** — `DATABASE_URL` for Prisma CLI (gitignored). Prisma CLI reads `.env`, not `.env.local`.
- **Dependencies installed:** `pg`, `@prisma/adapter-pg`, `@prisma/client`, `prisma` (dev), `@types/pg`.
- **Migration applied:** `prisma migrate dev --name init` → `20260522153948_init`. 23 tables verified in `ucsi_portal` dev DB via `pg` Pool query. Committed `246b293`.
- **CLAUDE.md updated** (project root — Prisma 7 stack quirk, prisma paths, schema invariants, next steps). Left uncommitted pending separate commit.

## Architecture Decisions

- **Prisma 7 breaking changes** — `url` removed from `schema.prisma` datasource block; moved to `prisma.config.ts`. `defineConfig` has no `migrate.adapter` property. CLI reads `.env` only, not `.env.local`.
- **`authorId → User.id` vs `session.user.lecturerId → Lecturer.id`** — two different identifiers. Phase 5 handlers must not conflate them. Documented in ClassPost schema comment.
- **`Invoice.amountOutstanding` not stored** — compute via `prisma.payment.aggregate({ _sum })`. Invariant in schema comment.

## Pending

- Schema correctness issues flagged by Codex (TIMESTAMP(3) → TIMESTAMPTZ(3); redundant indexes) — resolved in session 26 above.
- Phase 4 remaining: seed + page-by-page query migration.
- CLAUDE.md (project root) edits uncommitted.

## Next Recommended Step

(Superseded by session 26 — schema correctness fixes applied before seeding.)

---

# 2026-05-22 (session 24) — Backend-readiness doc drift cleanup (docs-only)

## Completed

- **`docs/database-schema.md` — Invoice table corrected** — removed `amount_outstanding` column from the table definition; it contradicted the Schema Notes decision (§8 N1, §11 item 2) to drop it and compute via `Payment._sum` at query time.
- **`docs/database-schema.md` — LearningResource.type enum corrected** — removed `'announcement'`; announcements are `ClassPost`, and the frontend `ResourceType` dropped this variant in session 16.
- **`docs/backend-readiness-review.md` — session_version status synced** — R2 gap row reworded from "not yet in User type" to ✅ done-state; Recommendation bullet converted from imperative to done-state with forward action; risk summary row updated to name remaining steps (Phase 4 schema.prisma + Phase 5 JWT embed).
- **`docs/api-routes.md` — ownership check wording** — post PATCH/DELETE note changed from mixed `author_id = authorId` to consistent camelCase `post.authorId === session.user.lecturerId`.
- **`app/docker-compose.yml` — credentials** — hardcoded POSTGRES_USER/PASSWORD/DB replaced with `${VAR:-default}` env-var substitution; defaults unchanged, local dev unaffected.
- **`Notes/` files updated** — session 23 superseding note + session 22 Pending annotation (dev-log); session 23 backend-prereqs block + summary line (roadmap).
- **Verification:** `npx tsc --noEmit` — 0 errors. `npm run build` — clean, all 20 routes. No app code changed.
- **Commits:** `3d115e4` (app), `3d6807d` (root), `ee3a27b` (root).

## Architecture Decisions

None new — all changes reconcile existing decisions with their documented state.

## Pending

- **Phase 4 (not started):** `npx prisma init` inside `app/`, write `schema.prisma` from `docs/database-schema.md`, `docker-compose up -d`, seed from mock data. Schema reminders: `@@unique([storageKey])` on `ResourceAttachment`; `@@unique([studentId, courseSectionId, date])` on `Attendance`; all 8 indexes from §9 at creation time.
- Phase 5: Auth.js v5, replace `mockRole`, server-side guards. `session_version` must be in `schema.prisma` before first seed (Phase 4) and embedded in JWT (Phase 5).
- Phase 6: Real file upload, presigned download URLs, admin CRUD.

## Next Recommended Step

Phase 4 — `npx prisma init` inside `app/`, then write `schema.prisma` from `docs/database-schema.md`. No remaining pre-Phase 4 work.

---

# 2026-05-22 (session 23) — Pre-Phase 4 backend prerequisites + Tailwind token fixes

> **Session 23 supersedes session 22's Pending list.** All four prerequisites listed there (`types/academic.ts`, `Invoice.amount_outstanding` decision, `session_version`, `docker-compose.yml`) were completed this session.

## Completed

- **`types/academic.ts` created** — `Course`, `CourseSection`, `Semester`, `Programme`, `PastSemesterCourse`, `PastSemesterDetail` moved from `types/student.ts` + `data/mock-results.ts`. 7 consumer imports updated. TypeScript 0 errors.
- **`Invoice.amount_outstanding` — dropped.** Compute at query time via Prisma `Payment._sum` aggregate. Decision recorded in `docs/database-schema.md` Schema Notes; `types/financial.ts` `amountOutstanding` annotated mock-era-only.
- **`session_version Int @default(1)` added to `User`** — in `docs/database-schema.md`. Required before Phase 4 seeding for role-change session invalidation.
- **`docker-compose.yml` (Postgres 16-alpine) + `.env.local` created in `app/`** — DATABASE_URL + Auth.js placeholders; `.env*` gitignored.
- **Tailwind v4 CSS-var token sweep** — replaced `bg-[--bg-surface]`, `bg-[--bg-elevated]`, `border-[--ucsi-red]`, `hover:text-[--ucsi-red]` Tailwind classes with inline styles or literal hex across 18 files. QuickAction tiles changed to `bg-white dark:bg-zinc-800` (inline style kills hover). UploadResourceForm/EditResourceModal inputs use `INPUT_STYLE` constant. `SkipToMain` focus bg → `focus:bg-white dark:focus:bg-zinc-800`.
- **UUID hardening** — `Date.now()` → `crypto.randomUUID()` in UploadResourceForm and ClassPostPanel.

## Architecture Decisions

- **`Invoice.amount_outstanding` dropped** — stored computed field drifts on every payment update. Aggregate at query time: `prisma.payment.aggregate({ _sum: { amount: true }, where: { invoiceId, status: 'completed' } })`. No `$transaction` contract to maintain.
- **Base-surface + hover-class conflict** — inline `style` (specificity 1000) beats a `hover:` Tailwind class. Elements needing both a base bg AND a hover bg must use a literal Tailwind utility for the base, not inline style.
- **`INPUT_STYLE` constant for shared form controls** — `const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }`. Apply via `style={INPUT_STYLE}`; do not put `bg-[--bg-surface]` in a shared className string.

## Pending

- Phase 4: `npx prisma init` inside `app/`, schema from `docs/database-schema.md`, Postgres via Docker, seed from mock data. Schema-level reminders: add `@@unique([storageKey])` on `ResourceAttachment` and `@@unique([studentId, courseSectionId, date])` on `Attendance`.
- Phase 5: Auth.js v5, replace `mockRole`, server-side guards.
- Phase 6: Real file upload, presigned download URLs, admin CRUD.

## Next Recommended Step

All Phase 4 prerequisites are complete. Start Phase 4: `npx prisma init` inside `app/`, then write `schema.prisma` from `docs/database-schema.md`.

---

# 2026-05-22 (session 22) — ClassPost/LearningResource type alignment + doc cleanup

## Completed

- **`ClassPost.isPinned` / `isPublished` made non-optional** — Prisma `@default` means these are never `undefined`. Removed `?` from both fields in `types/post.ts`. Cascade: all 9 mock posts in `mock-posts.ts` given explicit `isPinned: false, isPublished: true`; `ClassPostPanel.handleAdd` literal given `isPublished: true` (required because `PostFormData` carries no `isPublished`). Truthiness render paths (`post.isPinned && …`) unchanged — work identically for non-optional booleans.
- **`LearningResource.attachments?: ResourceAttachment[]` added** — optional (preserves all 18 existing mock resource literals with zero cascade). Phase 4 Prisma query: `include: { attachments: true }`. Mock-era `ClassSectionCard` keeps its local intersection type for now.
- **`AnnouncementFeed` refactored to `Pick<ClassPost,…>`** — removed local `Announcement` interface (`scope: 'global'|string`, `date`). Replaced with exported `DashboardAnnouncement = Pick<ClassPost, 'id'|'title'|'body'|'courseSectionId'|'createdAt'>`. `dashboard/page.tsx` retyped `ANNOUNCEMENTS` constant (`scope→courseSectionId`, `date→createdAt`). Scoped announcement now shows "sec-001" instead of "DIT7044 Section A" — accepted mock-data text change; Phase 4 join provides real label.
- **Doc cleanup (docs-only, no app code)** — removed 3 stale "new finding" blocks from `backend-readiness-review.md` (§4 ClassPost misalignment table, §7 route-URL block, §7 apiFetch-gaps block — all already fixed in sessions 16/18). Corrected `lecturer_id = lecturerId` → `author_id = authorId` ownership check wording in `api-routes.md`. Marked §11 items 14/15/16 ✅. Rewrote `security-notes.md` "Client-Side API Client Hardening" section to done state.
- **Verification:** `npx tsc --noEmit` — 0 errors. No behavioral changes.
- **Commits:** `3713bff` (app submodule — `types/post.ts`, `types/resource.ts`, `mock-posts.ts`, `ClassPostPanel.tsx`, `AnnouncementFeed.tsx`, `dashboard/page.tsx`); `39197fe` (root — `api-routes.md`, `backend-readiness-review.md`, `security-notes.md`, `CLAUDE.md`, prior session log).

## Architecture Decisions

- **Optional `attachments?` not required** — optional is zero-cascade for existing mock data; required would ripple to all 18 `mockResources` literals. Default to optional when the field is genuinely absent in current mock data. Phase 4 drops in real data with no type change.
- **`Pick<DbType,…>` as view-model type** — `DashboardAnnouncement = Pick<ClassPost,…>` keeps the component structurally synced to the canonical type. Phase 4 real data drops in with no prop-shape change. Now a CLAUDE.md convention.
- **Delete stale "new finding" doc blocks entirely** — annotating them risks a future reader redoing already-completed work. Replace with a one-line ✅ note confirming resolution.

## Pending

- ~~Phase 4 prerequisites~~ **(all four resolved in session 23 — see above)** (from `docs/backend-readiness-review.md` §11):
  - Move `Course`, `CourseSection`, `Semester`, `Programme`, `PastSemesterCourse`, `PastSemesterDetail` → `types/academic.ts`
  - Decide `Invoice.amount_outstanding`: drop + compute via Prisma `_sum` vs keep with `$transaction` contract
  - Add `session_version Int @default(1)` to Prisma `User`
  - Create `docker-compose.yml` + `.env.local` (neither exists yet)
- Phase 4: `npx prisma init`, schema from `docs/database-schema.md`, Postgres via Docker, seed from mock data.
- Phase 5: Auth.js v5, replace `mockRole`, server-side guards.
- Phase 6: Real file upload, presigned download URLs, admin CRUD.

## Known Risks

- Classes page download button and lecturer resource upload are UI-only stubs (Phase 6). Intentional.

## Next Recommended Step

All pre-Phase 4 frontend/type prerequisites are complete. Start Phase 4: resolve the 4 remaining §11 prerequisites (types/academic.ts, Invoice decision, session_version, docker-compose.yml), then run `npx prisma init` inside `app/`.

---

# 2026-05-21 (session 16) — type/docs alignment (pre-Phase 4 cleanup)

## Completed

- **`/resources` → `/classes` URL drift fixed** — `services/student.ts` `getResources` and `getDownloadUrl` stubs corrected to `/api/student/classes/…`; `ResourceDownloadButton.tsx` comment updated.
- **`ClassPost` type aligned with backend shape** — renamed `classSectionId` → `courseSectionId: string | null` (null = global admin post), `lecturerId` → `authorId`, `pinned` → `isPinned`; added `isPublished?: boolean`. Cascaded rename across all 8 consumers: `mock-posts.ts`, `ClassPostPanel.tsx`, `ClassSectionCard.tsx`, `AdminRecentPosts.tsx`, `classes/page.tsx`, `lecturer/page.tsx` (+ null guard), `lecturer/resources/page.tsx`, `lecturer/resources/[sectionId]/page.tsx`.
- **`ResourceType` — `'announcement'` removed** — announcements are now `ClassPost`; stale type variant removed from `types/resource.ts` and cascaded to `ClassSectionCard.tsx` (TYPE_ICON/TYPE_VARIANT + unused Bell import), `SectionResourceManager.tsx` (TYPE_LABELS), `classes/page.tsx` (CATEGORIES array).
- **`docs/api-routes.md`** — duplicate `### Announcements` section removed; File Download Flow URL corrected to `/api/student/classes/…`.
- **`Notes/roadmap.md`** — Phase 4 DB note updated from `SQLite dev / Postgres prod` → Postgres from day one (per backend-readiness-review decision).
- TypeScript type-check: 0 errors. No behavioral changes.

## Architecture Decisions

- None new — changes implement decisions already recorded in `docs/backend-readiness-review.md` and `docs/security-notes.md`.

## Pending

- Phase 4: `npx prisma init` inside `app/`; write schema from `docs/database-schema.md`; stand up Postgres via Docker; seed from mock data. Key pre-requisites per `backend-readiness-review.md` §11 still apply:
  - Move `Course`, `CourseSection`, `Semester`, `Programme`, `PastSemesterCourse`, `PastSemesterDetail` to `types/academic.ts`
  - Decide `Invoice.amount_outstanding` (drop + compute vs `$transaction` contract)
  - Add `session_version Int @default(1)` to Prisma `User` before seeding

## Known Risks

- `AnnouncementFeed.tsx` (student dashboard) still uses a local `Announcement` interface with `scope: 'global' | string` — not yet converted to `ClassPost`. Acceptable for Phase 3 mock data; must be wired in Phase 4 when real global announcements come from the DB.
- Classes download button and lecturer resource upload remain UI-only stubs (Phase 6). No regressions.

## Next Recommended Step

Phase 4 — Prisma schema. Start with `npx prisma init` inside `app/`, write schema from `docs/database-schema.md`, stand up Postgres via Docker. No more pre-Phase 4 cleanup items.

---

# 2026-05-21 (session 15) — backend readiness review + academic/timetable features

## Completed

- **Academic page — current-semester class schedule** — added "Class Schedule" subsection under the current semester tab: course, section code, day, time, room, lecturer columns. Data derived from `MOCK_SECTION_LECTURER_IDS` + `MOCK_LECTURER_NAMES`. Past-semester tabs unchanged.
- **Timetable page — Missed Sessions view** — replaced per-course attendance blocks with a unified chronological "Missed Sessions" table (date/course/status/type) + compact "Attendance by Subject" per-course summary. Flat chronological list is far more useful to students.
- **Pre-backend architecture audit** (`docs/backend-readiness-review.md`) — 15-section review of RBAC, enrollment model, lecturer permissions, resource auth, ClassPost merge, Prisma normalization, Auth.js session shape, scalability, and sequencing. No backend code written.
- **Five docs updated** — `database-schema.md` (ClassPost table, UNIQUE storage_key, 6 indexes), `auth-flow.md` (SessionUser population code, session_version, fixed `/resources/**` → `/classes/**`), `api-routes.md` (student routes to `/classes`, IDOR guard notes, ClassPost CRUD, global announcements, AddDropRequest $transaction), `security-notes.md` (IDOR guard + uploaded_by sections with TypeScript examples), `CLAUDE.md` (Phase 3.5 row, pre-Phase 4 prerequisites).

## Architecture Decisions

- **ClassPost + Announcement merged** — `courseSectionId = null` = global (admin-authored); non-null = section-scoped (lecturer-authored). One table, one query shape.
- **IDOR guard required on student download** — enrollment check alone insufficient; must verify `attachment.resource.courseSectionId === params.sectionId` before signing URL.
- **`uploaded_by` / `authorId` ownership check** on PATCH/DELETE — TeachingAssignment authorizes section access but not cross-lecturer mutation.
- **Postgres from day one** (Docker) — SQLite coercions mask bugs that surface only in prod.
- **`session_version Int @default(1)` on User** — embed in JWT; admin role change increments it to force re-login.
- **AddDropRequest approval is a two-write `$transaction`** with `maxCapacity` check inside.

## Pending

- Phase 4 prerequisites (§11 of `backend-readiness-review.md`): `types/academic.ts`, Invoice decision, Postgres Docker, `session_version`.
- Phase 4: Prisma schema + DB seed.
- Phase 5: Auth.js v5, replace mockRole, server-side guards.
- Phase 6: file upload, presigned downloads, admin CRUD.

## Known Risks

- Frontend stubs still reference old field names (`classSectionId`, `lecturerId`, `pinned`) — type misalignment with documented DB shape. **Resolved in session 16.**
- `services/student.ts` calls `/api/student/resources/…` — wrong route since Phase 2 rename. **Resolved in session 16.**

## Next Recommended Step

Session 16 type/docs alignment (now complete), then Phase 4.

---

# 2026-05-21 (session 14) — hover sweep complete + --text-muted sweep complete

## Completed

- **`hover:bg-[--bg-elevated]` sweep — all 10 remaining locations** — CSS-var hover class silently fails in Tailwind v4. All 10 locations fixed:
  - Layout shell icon buttons (TopBar hamburger, ThemeToggle toggle, NotificationBell bell, UserMenu trigger + Profile link) → `hover:bg-zinc-100 dark:hover:bg-white/10`
  - Table rows (`admin/resources`, `admin/programmes`, `CourseResultTable`) → `hover:bg-zinc-50 dark:hover:bg-white/5`
  - `ClassSectionCard` resource item div → `hover:bg-zinc-50 dark:hover:bg-white/5`; collapse button header → `hover:bg-zinc-100/50 dark:hover:bg-white/5` (subtler for a large click target)
  - `FinanceDownloadButton` → `hover:bg-zinc-100 dark:hover:bg-white/10`; also fixed `hover:text-[--ucsi-red]` → `hover:text-[#C1272D]` (same CSS-var failure on text color)
- **`--text-muted` sweep continuation — all remaining files** — readable metadata still using `--text-muted` (2.6:1, fails WCAG AA). Completed the sweep across all remaining locations:
  - **Profile pages** (`profile/page.tsx`, `lecturer/profile/page.tsx`, `admin/profile/page.tsx`): `Field` component labels (all three share the same `Field` pattern), ID numbers in headers, Registrar footer text (student + lecturer only; admin has none) → `--text-secondary`
  - **Attendance pages** (`lecturer/attendance/page.tsx`, `[sectionId]/page.tsx`): page subtitles → `--text-secondary`
  - **`CourseResultTable.tsx`**: column headers (Code, Subject, Cr, Grade, Att., Standing, Room) → `--text-secondary`. Room cell value kept muted (supplementary decorative detail).
  - **`AttendanceRosterPanel.tsx`**: student numbers per row + "Not marked" count in session summary → `--text-secondary`. Empty state and inactive toggle button labels kept muted.
  - **`LecturerActivityFeed.tsx`**: timestamps → `--text-secondary`. Icon color + empty state kept muted.
  - **`SectionResourceManager.tsx`**: attachment filename + download count → `--text-secondary`; resource date → `--text-secondary`. Search icon, placeholder text, empty state kept muted.
  - Note: `SectionResourceManager` description was already `--text-secondary` (fix-queue item was stale for that specific field).
- TypeScript type-check: 0 errors. ESLint: clean.

## Architecture Decisions

- **Hover replacement rules are now canonical** — three tiers depending on context:
  1. Icon buttons on light content area (TopBar, ThemeToggle, NotificationBell, UserMenu): `hover:bg-zinc-100 dark:hover:bg-white/10`
  2. Table rows and list item divs: `hover:bg-zinc-50 dark:hover:bg-white/5`
  3. Large clickable headers (ClassSectionCard collapse): `hover:bg-zinc-100/50 dark:hover:bg-white/5` — softer to avoid overwhelming a large surface
  - Icon buttons on the dark sidebar already use `hover:bg-white/10` (existing, correct).
- **`--text-muted` is now strictly decorative-only** — sweep is complete across all pages and components. `--text-secondary` covers all readable metadata. No further audit needed unless new components are added. The rule is now stable enough to apply by convention without a sweep.

## Pending

- Phase 4: Prisma schema + SQLite dev DB. Schema from `docs/database-schema.md`. Key tables: `Course`, `CourseSection`, `TeachingAssignment`, `StudentSectionEnrollment`, `ClassPost`, `LearningResource`, `Attendance`.
- Phase 5: Auth.js v5, replace `mockRole` with real session, server-side access guards.
- Phase 6: Real file upload, presigned download URLs, admin CRUD wired to DB.
- Nice-to-have deferred: extract shared admin table helpers, unify section/course display helpers, overlay focus-return polish. None are blocking Phase 4.

## Known Risks

- Other components using `bg-[--bg-surface]` or `bg-[--bg-elevated]` as Tailwind classes (not inline style) will silently render transparent in some v4 builds. The pattern is now documented and `Card.tsx` is the primary example. Check any new surface component before Phase 4 wires real data.
- `MOCK_USER_STATS` stat card values in `admin/users` are hand-maintained — counts must stay in sync with `MOCK_ADMIN_USERS` until Phase 4 replaces them with real queries.
- Classes download button and lecturer resource upload are UI-only stubs (Phase 6). Not regressions — intentional scope deferral.

## Next Recommended Steps

1. **Phase 4** — `npx prisma init` inside `app/`; write schema from `docs/database-schema.md`; create SQLite dev DB; seed from mock data files. Replace mock imports with Prisma queries page-by-page. No more pre-Phase 4 polish items remain.

---

# 2026-05-21 (session 13) — Dark mode cascade fix + fix-queue sweep + admin/users table

## Completed

- **`admin/users` — UserTable Name column bug** — Name column was unbounded, expanding to ~380px from long email addresses and pushing the Actions column off-screen at narrow viewports. Fixed: `w-[200px] max-w-[200px]` on sticky th + td; `truncate` on name and email `<p>` elements. Row hover `hover:bg-[--bg-elevated]` (CSS-var class failure) → `hover:bg-zinc-50 dark:hover:bg-white/5`. Sticky th background changed from `var(--bg-elevated)` to `var(--bg-surface)` to match cells — was causing a visible color step in the sticky column.
- **Dark mode cascade root fix (`globals.css` + `Card.tsx`)** — UCSI dark tokens were defined in `.dark {}` (specificity `0,1,0`) but overridden by the later `:root {}` UCSI block (same specificity, later in file → wins). Result: `var(--bg-surface)` always resolved to `#ffffff` regardless of dark mode. The `Card.tsx` `bg-[--bg-surface]` class silently failed (v4 CSS-var failure), so cards were transparent — the bug was hidden until `Card.tsx` was fixed to use inline style. Fix: UCSI dark tokens moved from `.dark {}` to `html.dark {}` (specificity `0,1,1`, beats `:root` unconditionally). `Card.tsx` background moved from `bg-[--bg-surface]` to `style={{ backgroundColor: 'var(--bg-surface)' }}`.
- **Fix-queue item 1 — Centralize teaching-assignment mock data** — `MOCK_TEACHING_ASSIGNMENTS: Record<string, string[]>` exported from `mock-admin.ts`. Duplicate `LECTURER_SECTION_IDS` local constants removed from `LecturerAssignmentsCard.tsx` and `admin/sections/page.tsx`; both import from single source. Bonus: `hover:bg-[--bg-elevated]` on sections table rows also fixed.
- **Fix-queue item 2 — `--text-muted` sweep (6 pages)** — All readable metadata on `dashboard`, `academic`, `timetable`, `lecturer/timetable`, `finance`, `feedback` pages switched to `--text-secondary`. Includes: page subtitles, stat card labels, table column headers, session metadata, semester dates, payment details. Empty states ("No classes scheduled", "Free", "No payments recorded", "No feedback submitted yet") intentionally kept as `--text-muted`. Finance invoice table row hover fixed as a bonus.
- **CLAUDE.md updated** — `html.dark {}` pattern documented; dark mode token section rewritten; Card background inline-style rule added.
- TypeScript type-check: 0 errors throughout.

## Architecture Decisions

- **`html.dark {}` not `.dark {}` for UCSI tokens** — `.dark` has specificity `(0,1,0)`, same as `:root`. The UCSI `:root {}` block at line 158 in globals.css comes AFTER `.dark {}` (line 86), so `:root` always wins by cascade order. `html.dark {}` has specificity `(0,1,1)` which beats `:root` regardless of order — exactly the same reasoning already applied to `html.light {}`. This only affects UCSI tokens; shadcn tokens in `.dark {}` are unaffected because no later `:root` redefines them.
- **`Card.tsx` background must be inline style** — `bg-[--bg-surface]` is a CSS-var Tailwind class that silently produces no output in v4. Cards appeared dark before only because the failed class left them transparent (inheriting the page bg). Any component that needs `--bg-surface` as a solid background must use `style={{ backgroundColor: 'var(--bg-surface)' }}`.
- **`MOCK_TEACHING_ASSIGNMENTS` as single source of truth** — Phase 4 will replace this with `TeachingAssignment` DB queries. Having one canonical mock source means one cutover point, not three scattered files.

## Pending

- **`hover:bg-[--bg-elevated]` sweep** — 10 remaining locations still use failing CSS-var hover class. Layout shell buttons (TopBar hamburger, ThemeToggle, NotificationBell, UserMenu trigger + menu items) are highest priority — visible on every page with no hover feedback. Also: `admin/resources`, `admin/programmes`, `CourseResultTable`, `ClassSectionCard`, `FinanceDownloadButton`.
- **`--text-muted` sweep continuation** — not all pages were in fix-queue scope. Remaining: `profile/page.tsx`, `lecturer/profile/page.tsx`, `admin/profile/page.tsx`, `lecturer/attendance/page.tsx`, `lecturer/attendance/[sectionId]/page.tsx`, `CourseResultTable.tsx` column headers, `AttendanceRosterPanel.tsx` student numbers + "Not marked", `LecturerActivityFeed.tsx` timestamps, `SectionResourceManager.tsx` descriptions.
- Phase 4: Prisma schema + SQLite dev DB.
- Phase 5: Auth.js v5, replace `mockRole`.
- Phase 6: Real file upload, presigned download URLs, admin CRUD wired to DB.

## Known Risks

- `hover:bg-[--bg-elevated]` still used in layout shell buttons — every page has non-functional hover states on TopBar, ThemeToggle, NotificationBell, UserMenu until the sweep is done.
- Other components using `bg-[--bg-surface]` or `bg-[--bg-elevated]` via Tailwind class (not inline style) will have the same dark mode issue as Card.tsx had — check before Phase 4 adds new surfaces.

## Next Recommended Steps

1. **hover sweep** — fix layout shell buttons (TopBar, ThemeToggle, NotificationBell, UserMenu) + remaining table rows. ~15–30 min.
2. **`--text-muted` sweep continuation** — profile pages + component files. ~20 min.
3. **Phase 4** — `npx prisma init`, schema from `docs/database-schema.md`, SQLite dev DB, seed from mock data. Key tables: `Course`, `CourseSection`, `TeachingAssignment`, `StudentSectionEnrollment`, `ClassPost`, `LearningResource`, `Attendance`.

---

# 2026-05-21 (session 11) — Admin UI polish: resource grouping + button hover feedback

## Completed

- **`admin/resources` — grouped by section** — flat sorted-by-date list replaced with section-grouped layout. Each section gets a shaded header row showing section label, course title, and a draft-count badge. Resources within each section sorted by type then title (Slides → Tutorials → etc.). Redundant Section badge removed from individual rows (section heading covers it). Also fixed `border-[--ucsi-red]/30` CSS-var failure on Publish button → `border-[#C1272D]/30`.
- **`admin/sections` — Assign button hover** — `border-[--ucsi-red]/30` was silently producing no border in Tailwind v4 (CSS-var with opacity modifier failure), making the button look like plain red text. Fixed to `border-[#C1272D]/30`. Added `cursor-pointer` to both View and Assign buttons.
- **`admin/programmes` — Add Programme hover** — no hover state on the solid-red primary button. Added `cursor-pointer transition-opacity hover:opacity-90`. Same for View/Edit text buttons in table rows (`cursor-pointer`).
- **`admin/users` — Add User hover** — same fix as Add Programme: `cursor-pointer transition-opacity hover:opacity-90`.
- TypeScript type-check: 0 errors.

## Architecture Decisions

- **`border-[#C1272D]/30` not `border-[--ucsi-red]/30`** — the Tailwind v4 CSS-var arbitrary-value failure applies to `border-` as well as `bg-` and `text-`. For any border that needs the UCSI red at partial opacity, use the literal hex. This extends the existing rule in CLAUDE.md (already applied to bg/text) to border.
- **`transition-opacity hover:opacity-90` for solid-red primary buttons** — inline `style={{ backgroundColor: 'var(--ucsi-red)' }}` means Tailwind hover-bg classes can't be used. `hover:opacity-90` is the lightest hover signal that works without JS and without fighting the inline style. Applies to all "Add X" primary CTA buttons.
- **Section grouping as Server Component** — resources grouped server-side using `new Set(resources.map(r => r.courseSectionId))` + `filter`; zero client state required. Section header rows rendered as `<Fragment>` wrappers with `<tr colSpan={N}>` headers. `bg-[--bg-elevated]` on header cells uses inline `style={{ backgroundColor: 'var(--bg-elevated)' }}` per the CSS-var failure rule.

## Pending

- Phase 4: Prisma schema + SQLite dev DB (next major milestone).
- Phase 5: Auth.js v5, replace `mockRole`.
- Phase 6: Real file upload, presigned download URLs, admin CRUD wired to DB.
- Open stubs: classes download button, lecturer resource upload file input (both Phase 6).

## Known Risks

- `MOCK_ADMIN_USERS` has 8 students by design (Phase 3 mock data — enough to exercise search/filter/badge logic). Not a bug; real counts come from DB seed in Phase 4.
- `MOCK_USER_STATS` stat card values are hand-maintained — must stay in sync with `MOCK_ADMIN_USERS` until Phase 4 replaces them with real queries.

## Next Recommended Steps

1. **Phase 4** — run `npx prisma init`, write schema from `docs/database-schema.md`, create SQLite dev DB, seed from mock data files. Replace mock imports with Prisma queries page-by-page.

---

# 2026-05-20 (session 10) — Turbopack root warning + React 19 script/hydration fixes

## Completed

- **`next.config.ts` — Turbopack root warning silenced** — Next.js 16 Turbopack detected `/Users/mayumi/package-lock.json` (home dir) instead of the project lockfile. Fixed by setting `turbopack.root: path.resolve(__dirname)` in `next.config.ts`.
- **`layout.tsx` — React 19 script tag warning fixed** — Moved inline theme-init `<script dangerouslySetInnerHTML>` from `<body>` to `<head>`. React 19 warns when it encounters a `<script>` in the component body during client hydration ("Scripts inside React components are never executed when rendering on the client"). `<head>` is the correct location; the script still runs before body parse, before React loads.
- **`ThemeToggle.tsx` — Hydration mismatch fixed** — `useState` initializer was reading `localStorage` synchronously; server renders `'system'` but client immediately read `'light'` from storage, causing icon/aria-label mismatch. Fixed: initialize to `'system'` (matches server), sync from `localStorage` in `useEffect` after mount. The inline `<head>` script already applies the correct CSS class before first paint, so there is no visual flash — only the toggle button icon is one frame behind, which is imperceptible.

## Architecture Decisions

- **Turbopack `root` must be explicit when multiple lockfiles exist** — Next.js/Turbopack searches up from the working directory for lockfiles; a `package-lock.json` at `~` confused it. Always set `turbopack.root: path.resolve(__dirname)` in projects inside user home directories.
- **Theme init script belongs in `<head>`, not `<body>`** — architecturally correct (runs before body, before any paint) and avoids the React 19 inline-script-in-body warning. No behavior change.
- **SSR-safe localStorage pattern** — never read `localStorage` in a `useState` initializer or render path. Pattern: `useState(serverDefault)` + `useEffect(() => { syncFromStorage() }, [])`. The inline script handles the visual theme; the React state only controls the button UI.

## Pending

- `/admin/profile`, `/admin/sections`, `/admin/resources` — unchanged from session 9.
- Phase 4: Prisma schema + SQLite dev DB.
- Phase 5: Auth.js v5 + real session.

## Known Risks

- No new risks. The `useEffect` sync in `ThemeToggle` means the button icon always briefly shows Monitor on hard refresh before snapping to the stored value — acceptable for dev; imperceptible in practice (one paint frame).

## Addendum — Phase 3 confirmed complete

After committing accumulated app changes, verified all 6 admin routes exist under `app/src/app/(portal)/admin/`: `page.tsx`, `profile/`, `users/`, `programmes/`, `sections/`, `resources/`. All were built in prior sessions but never committed. Phase 3 is fully done.

- Updated CLAUDE.md Phase 3 status row → Done; rewrote Next steps to Phase 4/5/6.
- Updated `Notes/roadmap.md` — admin remaining items → ✅ done; added "Phase 3 COMPLETE" banner.

## Next Recommended Steps

1. **Phase 4** — Prisma schema from `docs/database-schema.md`, SQLite dev DB, seed from mock data. Key tables: `Course`, `CourseSection`, `TeachingAssignment`, `StudentSectionEnrollment`, `ClassPost`, `LearningResource`, `Attendance`. Timetable is a derived query, not a table.
2. **Phase 5** — Auth.js v5; replace `mockRole` with real session; server-side access guards.
3. **Phase 6** — Real file upload + presigned download URLs; admin CRUD wired to DB.

---

# 2026-05-20 (session 9) — Phase 3 status review + next-steps planning

## Completed

- `/resume` run: CLAUDE.md + last 3 session logs reviewed for project state.
- Confirmed Phase 3 state: `/admin`, `/admin/users`, `/admin/programmes` done. 3 admin sub-pages remain.
- No code changes this session.

## Architecture Decisions

- No new decisions. Conventions from sessions 7–8 (pure Server Component list pages, admin list table a11y, tab-scoped search) carry forward to the remaining 3 admin pages.

## Pending

- `/admin/profile` — reuse `/lecturer/profile` pattern; omit Registrar footer (admin IS the registrar); `PROFILE_HREF['admin']` already wired in UserMenu; use `MOCK_ADMIN_PROFILE`.
- `/admin/sections` — section list + lecturer assignment rows (TeachingAssignment scaffold); Phase 6 timetable-edit surface; use `MOCK_SECTION_ENROLLMENT`.
- `/admin/resources` — system-wide resource moderation view across all sections; reuse `AdminResourceModeration` pattern from dashboard.
- Phase 4: Prisma schema + SQLite dev DB.
- Phase 5: Auth.js v5 + real session.

## Known Risks

- No new risks identified this session.

## Next Recommended Steps

1. Build `/admin/profile` (simplest — no table, no state, pure Server Component, 1 mock object).
2. Build `/admin/sections` (medium complexity — table with `TeachingAssignment` scaffold; no real mutations yet).
3. Build `/admin/resources` (reuses existing `AdminResourceModeration` pattern; system-wide scope).
4. After all 3: mark Phase 3 done in CLAUDE.md + kick off Phase 4 Prisma schema.

---

# 2026-05-20 (session 8) — Phase 3: Admin Users + Admin Programmes pages

## Completed

- **`/admin/users` page** — Server Component (header + 4 stat cards) + `UserTable` client island. Stat cards: Students 8 / Lecturers 5 / Active 11 / Inactive 2.
- **`UserTable` component** (`'use client'`) — tabbed Students/Lecturers table. Tab-scoped search (name or ID), per-tab role filter (programme for students, department for lecturers), status badges, sticky Name column, empty state, Add User / View / Edit placeholder buttons.
- **`/admin/programmes` page** — pure Server Component, no client JS. Table: code badge, programme name, student count, sections, lecturer summary (`first +N more`), status badge, View/Edit placeholders, Add Programme placeholder.
- **`mock-admin.ts` extended** — added `MOCK_ADMIN_USERS` (8 students + 5 lecturers, `MockUser` discriminated union), `MOCK_USER_STATS`; extended `MockProgramme` with `status` + `lecturerIds` and updated all 3 `MOCK_PROGRAMMES` entries.
- Verified both pages with Playwright: `/admin/users` 25/25 checks, `/admin/programmes` 20/20 checks. TypeScript 0 errors throughout.

## Architecture Decisions

- **Pure Server Component for `/admin/programmes`** — no search/filter/sort needed for 3 rows, so the whole page (incl. placeholder buttons) stays server-rendered. Placeholder `<button type="button">` with no handler is valid server-side. Extracting a client component is a 5-min refactor when search lands. Contrast `/admin/users` which needs a client `UserTable` for search + tabs.
- **Tabbed table over combined (Users page)** — students and lecturers have materially different metadata (programme/student-no vs department/staff-id/sections); tabs keep each table narrow. Confirmed scalable for future growth.
- **Table over card grid (Programmes page)** — user flagged future growth (10–20+ programmes); a table scans and scales better than cards past ~6 items.
- **Tab-scoped search** — search + filters reset on tab switch; each tab starts clean. Simpler mental model than global cross-tab search.
- **Lecturer assignments derived from department** — DIT←IT dept (lec-001/003/005), DBM←Business (lec-002), DAC←Accounting (lec-004).

## Key Learnings

- **Summary-with-overflow cell** — list-valued column shows `first name +N more` when >1, bare name when 1, `—` when 0. Keeps rows single-line.
- **Admin list table a11y baseline** — `<table aria-label>`, `<th scope="col">`, status badge `aria-label="Status: …"`, action button `aria-label="View {name}"`, `hidden sm:table-cell` for secondary columns.

## Pending
- `/admin/{profile,sections,resources}` sub-pages
- Phase 4: Prisma schema + SQLite dev DB
- Phase 5: Auth.js + real session

## Known Risks
- `MOCK_USER_STATS` counts are hand-maintained constants — must update if `MOCK_ADMIN_USERS` changes. Phase 4 derives them from real queries.
- View/Edit/Add buttons across both pages are inert placeholders — wired to modals in Phase 5/6.

---

# 2026-05-20 (session 7) — Phase 3: Admin Dashboard bento grid

## Completed

- **`/admin` dashboard static UI** — full bento-grid layout: header → Quick Actions row → 4 stat cards → two `md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]` content rows.
- **`AdminQuickActions`** (Server Component) — 4 nav tiles: Manage Users / Manage Sections / Manage Programmes / View Resources. All 4 point to distinct sub-page URLs.
- **`AdminActivityFeed`** (Server Component) — 6-item system activity list; urgent posts get red icon (`style={{ color: 'var(--ucsi-red, #C1272D)' }}`); uses `AdminActivityItem` type (`post|resource|user`).
- **`AdminRecentPosts`** (Server Component) — top-4 posts across all sections sorted by date descending; urgent posts: `variant="warning"` + "priority" label (lecturer/admin semantic softening rule).
- **`LecturerAssignmentsCard`** (`'use client'`) — tabbed card: Lecturers tab (table with section badge, student count, Unassigned badge for lec-004) + Programmes tab (enrollment bars with `h-1` capacity fill, cap at 100%). Tab buttons in `CardHeader` inner `flex justify-between`; active tab inline-style red bg.
- **`AdminResourceModeration`** (`'use client'`) — 2 draft resources with optimistic publish (immediate list move) + inline delete-confirm strip. Only 2 client components total; other 3 stay Server Components.
- **`/admin/page.tsx`** — replaced 4-line stub with full bento-grid dashboard using all 5 components.
- **Playwright verification** — 34/34 checks passed across desktop / dark mode / mobile viewports.
- **Design spec + impl plan committed** — `docs/superpowers/specs/2026-05-20-admin-dashboard-design.md`, `docs/superpowers/plans/2026-05-20-admin-dashboard.md` (7 tasks).
- TypeScript type-check: 0 errors throughout.

## Architecture Decisions

- **Bento-grid layout (Approach B)** over vertical flow or KPI-heavy variant — extends lecturer dashboard layout language; proportional `[1fr_300px]` column rhythm consistent across both role dashboards.
- **Tabbed `LecturerAssignmentsCard` (Approach C)** — single client component with Lecturers table + Programmes enrollment bars. Two peer views a user toggles between → in-card tabs, not separate routes.
- **Static `LECTURER_SECTION_IDS` map inside component for Phase 3** — lec-001→sec-001, lec-002→sec-002, lec-003→sec-003+sec-004, lec-004→[] (Unassigned badge), lec-005→sec-001+sec-003. Double-counts sec-001 students between lec-001/lec-005 — accepted for mock data; Phase 4 fixes via `TeachingAssignment` table.
- **`app/` is a nested git repo (submodule)** — `git add app/src/...` from project root fails with "is in submodule 'app'". Stage/commit from inside `app/`. Docs/specs/plans/Notes at project root commit normally from root. Documented in CLAUDE.md.

## Key Learnings

- **In-card tab pattern** — card is `'use client'` with `useState<Tab>`; tab buttons in `CardHeader`'s inner `flex justify-between`; each tab view is a separate sub-function (`LecturersTab`, `ProgrammesTab`) in the same file. Active tab: inline `style={{ backgroundColor: 'var(--ucsi-red)' }}` + `text-white`. Inactive: border + `hover:bg-[--ucsi-red]/15`.
- **Progress/capacity bar pattern** — `h-1 rounded-full overflow-hidden` track with `style={{ backgroundColor: 'var(--bg-elevated)' }}` inline + fill div with both `width` and `backgroundColor` via inline `style` (CSS-var classes fail in v4). Cap value with `Math.min(100, …)`.
- **Playwright setup on this machine** — needed `pip3 install playwright --break-system-packages` then `python3 -m playwright install chromium` (PEP 668 externally-managed environment, macOS Python 3.14). `page.evaluate("localStorage...")` throws SecurityError if called before navigating — navigate to the origin first, then set localStorage, then navigate to target.

## Files Modified

- `app/src/components/admin/AdminQuickActions.tsx`: created (Server Component, 4 nav tiles)
- `app/src/components/admin/AdminActivityFeed.tsx`: created (Server Component, 6-item activity list)
- `app/src/components/admin/AdminRecentPosts.tsx`: created (Server Component, top-4 posts desc)
- `app/src/components/admin/LecturerAssignmentsCard.tsx`: created (client, tabbed Lecturers table + Programmes enrollment bars)
- `app/src/components/admin/AdminResourceModeration.tsx`: created (client, optimistic publish + inline delete-confirm strip)
- `app/src/app/(portal)/admin/page.tsx`: replaced 4-line stub with full bento-grid dashboard
- `docs/superpowers/specs/2026-05-20-admin-dashboard-design.md`: created
- `docs/superpowers/plans/2026-05-20-admin-dashboard.md`: created (7 tasks)
- `CLAUDE.md`: updated — Phase 3 status, Paths (admin components), 4 new conventions, Next steps, git submodule note

## Pending
- `/admin/profile` — use `/lecturer/profile` pattern; omit Registrar footer; `PROFILE_HREF['admin']` already wired in UserMenu
- `/admin/users` — wire empty `UserTable` / `CreateUserModal` / `EditUserModal` stubs
- `/admin/programmes`, `/admin/sections`, `/admin/resources` — list + mock CRUD UI shells
- Phase 4: Prisma schema + SQLite dev DB
- Phase 5: Auth.js v5 + real session

## Known Risks
- Static `LECTURER_SECTION_IDS` map double-counts sec-001 students (lec-001 + lec-005 both assigned). Acceptable for Phase 3; Phase 4 fixes via `TeachingAssignment` query.
- Admin sub-pages will need consistent mock CRUD patterns — risk of over-engineering for Phase 3 (UI shells only, no real persistence).

---

# 2026-05-19 (session 6) — Phase 3: Lecturer Attendance management (full feature)

## Completed

- **Lecturer Attendance `/lecturer/attendance`** — section picker (Server Component), mirrors `/lecturer/resources` layout: 2 section cards with student counts, pending session badge, "Manage →" link
- **Lecturer Attendance `/lecturer/attendance/[sectionId]`** — async Server Component, validates sectionId against `MOCK_LECTURER_SECTION_IDS`, redirects if invalid; passes initial data to `AttendanceShell`
- **`AttendanceShell` client wrapper** — owns shared state (`selectedDate`, `entries`, `records`); passes callbacks down to both panels; owns optimistic-save logic and `markedDates` derivation
- **`AttendanceDatePanel`** (left column) — scrollable date list auto-derived from teaching schedule via `generateSessionDates`; Done (green) / Pending (amber) badges; selected date highlighted with red left border + light bg
- **`AttendanceRosterPanel`** (right column) — per-student P/A/L/E toggle group with per-status active colors; summary row (present/absent/late/excused counts); Mark All Present (idempotent — only sets unmarked); Save with 2-second "Saved ✓" confirmation via `useState` + `setTimeout`
- **`mock-attendance.ts` created** — `AttendanceStatus` type, `StudentRoster` + `AttendanceRecord` interfaces, `generateSessionDates(dayOfWeek, start, end)` utility (handles JS Sun=0 quirk), `MOCK_SECTION_STUDENTS` (8 students for sec-001, 6 for sec-003), `MOCK_ATTENDANCE_RECORDS` (first 10 sessions pre-marked per section)
- **Nav + Quick Actions updated** — `nav.ts` gained Attendance entry with `ClipboardList` icon; `LecturerQuickActions` replaced "New Post" with "Attendance" → all 4 tiles now point to truly distinct destinations
- TypeScript type-check: 0 errors throughout.

## Architecture Decisions

- **Shell wrapper pattern for sibling client panels** — `AttendanceShell` owns `selectedDate` + `entries` + `records`; child panels receive callbacks, not shared state. Avoids prop drilling, avoids Context for a 2-component scope. Enables clean optimistic-update path (Shell's local `records` state flips `markedDates` immediately on save).
- **Auto-derive session dates** — `generateSessionDates(dayOfWeek, startDate, endDate)` returns every ISO date matching the day-of-week in the range. No manual session entry needed in Phase 3. Phase 4 keeps this utility; attendance percentage = `present_count / total_sessions`.
- **Per-status active color map** — `{ present: green-600, absent: red-600, late: amber-600, excused: blue-600 }` applied as inline `style` only when active; inactive is always border-only with red hover tint. Single-source `STATUS_ACTIVE_BG` map. Reusable for any multi-status row toggle.
- **Mock save → optimistic UI** — `setRecords` in Shell updates local state which recomputes `markedDates` (Done/Pending badges update immediately); child shows "Saved ✓" for 2s. Phase 4 swaps `setRecords` for a Server Action.
- **Mark All Present idempotent semantics** — only sets students with `null` status to Present; already-marked statuses untouched. Preserves intentional A/L/E entries during bulk workflow.

## Key Learnings

- **JS `getDay()` Sunday quirk** — JS returns 0 for Sunday (ISO is 7). `generateSessionDates` converts: `const jsDow = dayOfWeek === 7 ? 0 : dayOfWeek`. Needs to live inside the utility, not at call sites.
- **Shell wrapper vs Context** — for exactly 2 sibling components sharing state, a parent client wrapper is cleaner than React Context; Context overhead is only justified at 3+ consumers or deep-tree propagation.

## Pending
- Admin pages: `/admin` dashboard, `/admin/{users,programmes,sections,resources}`, `/admin/profile`
- Phase 4: Prisma schema + SQLite dev DB
- Phase 5: Auth.js + real session (replaces mockRole)

## Known Risks
- `mock-attendance.ts` `AttendanceRecord` keyed by `[sectionId][dateISO]` — flat map works for Phase 3; Phase 4 needs normalized `Attendance` rows with FK constraints
- `generateSessionDates` assumes contiguous semester range; no holiday exclusion logic yet (acceptable for Phase 3 demo)

---

# 2026-05-19 (session 5) — Phase 3: Graphify refresh + Sidebar contrast + Profile footer + Admin mock data

## Completed

- **Graphify full-project refresh** — 213 files → 1375 nodes, 1915 edges, 135 labeled communities. 21.4x token reduction per query vs raw source browsing. `cn()` identified as bridge node marking the client/server boundary: communities importing it are interactive client layers; communities without it are pure server data/types/nav.
- **Profile footer contact pattern** — student + lecturer profiles now end with "contact the Registrar's Office at registrar@ucsicollege.edu.my" (`Phone` icon + `mailto:` link, UCSI-red + hover underline, `flex-wrap` for narrow viewports). Admin profile omits (admin IS the registrar).
- **"Urgent" semantic softening** — lecturer/admin contexts: `<Badge variant="danger">{n} urgent</Badge>` → `<Badge variant="warning">{n} priority</Badge>`; StatCard `sub="Action required"` → `sub="High importance"`. `variant="danger"` + "urgent" wording reserved for student-facing views only.
- **Sidebar 4-tier contrast hierarchy** — inactive nav `text-zinc-400` → `text-zinc-300` (~9.5:1 AAA); active `bg-white/10|/15` collapsed → `bg-white/20 text-white`; NavGroup labels stay at `text-zinc-400` (intentionally dimmer); collapse button `text-zinc-400` → `text-zinc-300`. NavGroup font `text-[10px]` → `text-[11px]` (10px was borderline illegible on high-density displays).
- **`mock-admin.ts` created** — `AdminActivityItem` + `MockProgramme` interfaces; `MOCK_ALL_LECTURERS` (all 5, including lec-005 Dr. Sarah Tan — use this for admin views, not `MOCK_LECTURER_NAMES`); `MOCK_PROGRAMMES` (DIT/DBM/DAC); `MOCK_SECTION_ENROLLMENT`; `MOCK_ADMIN_STATS` (derived counts); `MOCK_ADMIN_ACTIVITY` (6 items: posts + resources + users); `MOCK_ADMIN_PROFILE` (Ahmad Farouk, UCSI/ADM/2020/001).
- TypeScript type-check: 0 errors throughout.

## Architecture Decisions

- **`MOCK_ALL_LECTURERS` separate from `MOCK_LECTURER_NAMES`** — admin sees all 5 lecturers; `MOCK_LECTURER_NAMES` only has 4 (lec-001…004, section-post authors). Kept separate to avoid scope bleed. Phase 4 collapses both into the `Lecturer` table.
- **"Urgent" reserved for student-facing views** — urgency as alarm (`danger` variant, "urgent" label) vs urgency as emphasis (`warning` variant, "priority" label) depends on the viewer's relationship to the content. Lecturers see their own posts; students are the intended audience of the alarm.
- **Active bg jump `/10` → `/20`** is the primary visual cue for "you are here"; the red `border-l-2` is supporting evidence. Before this fix, hover and active shared `bg-white/10` and only the border differentiated — insufficient at a glance.

## Key Learnings

- **Graphify `cn()` as client/server watermark** — any community touching `cn()` is interactive UI (NavItem, StatCard, AttendanceShell, ResourceManager). Communities without it are pure server data/types/nav. Useful for scoping Phase 4 migration surface.
- **`CardHeader` is `flex flex-col gap-1`** (not row). For "title + right-aligned action" pattern, wrap both in an inner `<div className="flex items-center justify-between">`. Documented in CLAUDE.md for admin dashboard use.
- **Contrast on slate-800**: zinc-400 = 5.5:1 (passes AA but reads as washed-out at 14px); zinc-300 = 9.5:1 (AAA, truly scannable). "Passes AA" ≠ "actually readable" for small text near the threshold.

## Pending
- `/admin/page.tsx` JSX — mock data ready; layout: Quick Actions → Stat cards → Lecturer Assignments + System Activity (2-col) → Recent Posts + Resource Moderation (2-col)
- `/admin/{profile,users,programmes,sections,resources}`

## Known Risks
- Admin page complexity: multiple sub-pages, each needing mock CRUD patterns. Scope creep risk if CRUD gets over-engineered for Phase 3 (Phase 3 = UI shells only, no real persistence).

---

# 2026-05-19 (session 4) — Phase 3: Lecturer timetable + filter chips + UX fixes

## Completed

- **Lecturer Timetable `/lecturer/timetable`** — new Server Component page for teaching schedule:
  - Added `TeachingSession` interface + `MOCK_LECTURER_TEACHING_SESSIONS` to `mock-lecturer.ts` (2 sessions: DIT7044 Mon 09:00–11:00 A-301, DIT7031 Wed 10:00–12:00 Lab-1, with `studentCount`)
  - Same mobile-agenda + desktop-weekly-grid + all-sessions-list layout as student timetable
  - Shows `Users` icon + enrolled count instead of "Lecturer" field; section badge (`ucsi` variant)
  - `nav.ts` lecturer Timetable href updated `/timetable` → `/lecturer/timetable`
  - Admin-only timetable editing rule documented in CLAUDE.md top section
- **Lecturer Quick Actions dedup** — removed "Upload Resource" (redundant with "My Classes" — both linked to `/lecturer/resources`); replaced with "Profile" → `/lecturer/profile`. Fixed Timetable href to `/lecturer/timetable`. All 4 tiles now point to distinct destinations. Removed unused `Upload` icon import.
- **Student Classes filter chips** — added content-type filtering to `ClassSectionCard`:
  - `activeFilter` state (`'all' | 'posts' | ResourceType`); resets to `'all'` on card collapse
  - Filter chips built dynamically from what exists in each section: "All" always; "Posts" if posts exist; per-type chip for each resource category present
  - Chips hidden entirely when section has ≤1 distinct content type (prevents pointless single-chip bar)
  - Active: inline `style={{ backgroundColor: 'var(--ucsi-red)' }}` + `text-white` + `bg-white/20` count pill; Inactive: border + hover red tint
  - No prop changes — fully self-contained within `ClassSectionCard`
- TypeScript type-check: 0 errors throughout.

## Architecture Decisions

- **Separate `/lecturer/timetable` route** over single role-branched `/timetable` URL — matches existing per-role pattern (`/lecturer/profile`); avoids conditional Server Component logic. Student nav unchanged.
- **Timetable is a derived view (no DB table)** — lecturer view = `CourseSection` JOIN `TeachingAssignment`; student view = `CourseSection` JOIN `StudentSectionEnrollment`. Only Admin mutates sections/assignments/enrollments. Clarified after user questions on DB editing permissions.
- **ClassPost DB model confirmed** — `ClassPost` table: `id`, `sectionId` (FK), `authorId` (FK), `type` enum, `title`, `body`, `isPinned`, `createdAt`, `updatedAt`. Lecturer writes only to assigned sections (TeachingAssignment gate); students read only enrolled sections (StudentSectionEnrollment gate); admin can moderate-delete.
- **Filter chip `>2` threshold** — chips only render when `filterChips.length > 2` (i.e. at least "All" + 2 distinct content types). A section with only slides shows no filter bar — there's nothing to filter to.
- **Filter state not persisted** — ephemeral UI preference, reset on collapse. Doesn't warrant localStorage like collapse state does.
- **Quick-action dedup principle** — tiles must each point to a distinct URL. Two tiles sharing an href is borderline acceptable when intent differs and deep-linking is planned; 3+ is always wrong.

## Key Learnings

- **Admin timetable control is CRUD on `CourseSection` + `TeachingAssignment` + `StudentSectionEnrollment`** — not a separate "timetable" table. Students/lecturers are permanently read-only on these entities. Phase 6 admin CRUD UI lives at `/admin/sections`.
- **Course/section/assignment chain** — Admin creates Course → Section(s) → assigns Lecturer (TeachingAssignment) → enrolls Students (StudentSectionEnrollment). Role-specific timetable views are queries over this chain, not independent data.

## Pending
- Admin pages: `/admin` dashboard, `/admin/{users,programmes,sections,resources}`, `/admin/profile`
- Phase 4: Prisma schema + SQLite dev DB
- Phase 5: Auth.js + real session (replaces mockRole)

## Known Risks
- Admin pages require mock-data scaffolding for users, programmes, sections — none yet exist
- Phase 4 cutover: mock data shape may not 1:1 match Prisma schema; expect import refactoring
- `Date.now()` ids in client state (inline forms) will collide on rapid-fire creates — acceptable for Phase 3, replaced by DB UUIDs in Phase 4

---

# 2026-05-19 (session 3) — Phase 3: Lecturer Dashboard UX refinement + Lecturer Resources pages

## Completed

- **Lecturer Dashboard UX refinement** — improved workflow clarity, urgency hierarchy, and scannability:
  - Quick Actions moved to top (above StatCards) — lecturer arrives and acts before reading stats
  - Quick Actions layout changed from stacked vertical tiles to horizontal `icon + label` rows
  - Pending Tasks card moved into right column alongside Recent Activity (stacked) — was full-width at bottom
  - Pending Tasks now interactive: `'use client'` with checkbox toggle (`CheckCircle2` / `Circle`), `line-through` + `opacity-50` on done, "Done" replaces due label
  - Activity Feed urgent styling refined: removed `border-l-2 border-[--ucsi-red] pl-3` (broke left-edge alignment) → red icon color (inline `style={{ color: 'var(--ucsi-red, #C1272D)' }}`) + existing urgent Badge
  - Header subtitle: `--text-muted` → `--text-secondary` (WCAG AA)
- **ui-ux-pro-max audit** — design system verdict confirmed "Data-Dense Dashboard" pattern. Three fixes applied:
  - Student profile avatar: `bg-[--ucsi-red]` → inline `style={{ backgroundColor: 'var(--ucsi-red)' }}` (CSS-var failure bug carried over from initial profile page)
  - PendingTasks checkbox: added `cursor-pointer`
  - LecturerSectionRow "Open →" link: `py-1.5` → `py-2.5` (~32px → ~40px touch height, closer to 44px minimum)
- **Lecturer Resources pages built** — full brainstorm → spec → plan → inline execution flow:
  - Spec: `docs/superpowers/specs/2026-05-19-lecturer-resources-design.md` (committed)
  - Plan: `docs/superpowers/plans/2026-05-19-lecturer-resources.md` — 11 tasks, complete code (committed)
  - Section picker `/lecturer/resources`: server component, 2 section cards (DIT7044 + DIT7031) with stats (resources/posts/students), urgent badge, last activity date, Manage → link
  - Section detail `/lecturer/resources/[sectionId]`: async server component, validates section against `MOCK_LECTURER_SECTION_IDS` (redirects if invalid), two-column layout (`lg:grid-cols-[1fr_380px]`)
  - Left panel `ResourceManager` (client): search, dynamic type filter chips (`presentTypes` from `[...new Set]`), resource rows with type badge / description / filename / download count / publish toggle / Edit / Delete, inline upload form, inline edit form, self-contained delete confirm strip
  - Right panel `ClassPostPanel` (client): pinned-first sort, type badges (urgent=danger, reminder=warning, announcement=info, update=neutral), red Pin icon for pinned, `line-clamp-2` body, Pin/Unpin · Edit · Delete actions, inline new-post form, inline edit form, inline delete confirm strip
  - Mock data extended: 2 draft resources (res-017/018, `isPublished: false`) + 2 lec-005 posts (post-008/009)
- TypeScript type-check: 0 errors throughout. 8 commits.

## Architecture Decisions

- **Two-page split for Lecturer Resources (Approach A)** — `/lecturer/resources` picker is bookmarkable, deep-linkable; `[sectionId]` detail is its own URL. Matches existing scaffold. Rejected: single page with URL query param (SPA-feel, but worse with App Router) and local-state-only (no deep linking).
- **Side-by-side resources + posts** — both visible at once on desktop, stacks on mobile. Rejected: tabs (extra click, worse for cross-referencing), single scrolling page (forms make it too long).
- **Inline form expand** — Upload / Edit / New Post forms expand within the column, pushing the list down. Not modals, not drawers. Keeps focus in context, simplifies state (single `open` flag per form).
- **Self-contained `DeleteResourceButton`** — manages its own `confirming` state. Parent only passes `onDelete`. Avoids lifting `deletingId` state into ResourceManager. Cleaner encapsulation. (ClassPostPanel keeps deletingId state inline because the strip needs to appear below the post body, not replace the button.)
- **Filename `EditResourceModal.tsx` retained, export renamed to `EditResourceForm`** — spec uses inline form, not modal. Keeping the file name avoids new-file/delete-file churn on a stub; export name reflects actual usage. Trade-off accepted.
- **Form `id` generation via `Date.now()`** — sufficient for in-memory mock state; replaced by DB-generated UUIDs in Phase 4.
- **Pinned-first `sortPosts` re-run on every mutation** — keeps the panel consistent without optimistic-shift trickery. Tiny array, no perf concern.

## Key Learnings

- **Next.js 16 dynamic-route params are `Promise<...>`.** Pages must be `async`; `const { sectionId } = await params`. Synchronous destructure errors at build time. Confirmed via `package.json` (`next: 16.2.6`).
- **Mock data array bracket placement gotcha.** Used `Edit` to append entries after the last item; landed AFTER the closing `]` instead of before it. TypeScript caught it (`';' expected`). Fix: include the closing `]` in the `old_string` and re-emit it after the new entries. Generalizable: when extending a typed array, anchor the edit on a unique line ending with `,` not the closing `]`.
- **`hover:bg-[--ucsi-red]/15` works in Tailwind v4** despite the broader CSS-var hover failure rule — tinted opacity IS supported in `hover:` variants. Already used in `LecturerSectionRow` and `ClassSectionCard` download buttons. Re-confirmed working in new code.
- **Filter chip active state needs inline-style bg AND `text-white` class** — `bg-[--ucsi-red]` fails, but pairing inline-style red bg with `text-white` static class works reliably across themes.

## Pending
- Admin pages: `/admin` dashboard, `/admin/{users,programmes,sections,resources}`, `/admin/profile`
- Open bugs (low priority): MobileDrawer animation already fixed; classes page download still a Phase 6 stub
- Phase 4: Prisma schema + SQLite dev DB

## Known Risks
- Admin pages will require similar mock-data scaffolding (user list, programme CRUD UI patterns) — none yet exist
- Phase 4 migration: mock data shape may not 1:1 match Prisma schema; expect some refactoring of imports during the cutover
- `Date.now()` ids in client state will collide if a user rapid-fires creates within the same millisecond — acceptable for static UI, replaced in Phase 4

---

# 2026-05-19 (session 2) — Phase 3: TopBar bug fixes + theme system overhaul

## Completed

- **Bug: UserMenu avatar invisible in light mode** — `bg-[--ucsi-red]` Tailwind v4 CSS-var failure on the avatar circle. Fixed: `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style.
- **Click-outside close: NotificationBell + UserMenu** — both lacked outside-click dismissal. Fixed: `useRef` on container div + `useEffect` with `document.addEventListener('mousedown', ...)` wired to `setOpen(false)`. Listener added/removed based on `open` state.
- **Transparent dropdown panels** — `bg-[--bg-surface]` Tailwind v4 CSS-var failure on both dropdown panels. Fixed: `style={{ backgroundColor: 'var(--bg-surface)' }}` inline style. Shadow bumped to `shadow-xl`, margin to `mt-2` for clearer topbar separation.
- **Theme system root cause fixed** — UCSI tokens only responded to `@media (prefers-color-scheme: dark)`, not the `.dark` class set by ThemeToggle. OS-dark + manual-light caused dropdowns (and all UCSI-var surfaces) to remain dark:
  - `globals.css`: UCSI dark token values added inside `.dark {}` (class beats media query for explicit dark). Added `html.light {}` with light token values for manual-light override.
  - `ThemeToggle.tsx`: `light` now adds `.light` + removes `.dark`; `dark` adds `.dark` + removes `.light`; `system` removes both and defers to media query.
  - `layout.tsx` inline script: adds `.light` class on initial load when `localStorage.theme === 'light'`; updated system/change listener to clear `.light` when switching back.
- **CSS specificity bug**: initial `.light {}` (specificity `0,1,0`) tied with `@media :root` (`0,1,0`) and lost due to cascade order. Fixed: `html.light {}` (specificity `0,1,1`) unconditionally beats the media query's `:root` rule.
- TypeScript type-check: 0 errors throughout.

## Architecture Decisions

- **UCSI tokens must be in `.dark {}` AND `html.light {}`**: the `@media (prefers-color-scheme: dark)` block is not sufficient alone — manual ThemeToggle state diverges from OS preference. All three states (system/light/dark) now resolve correctly.
- **`html.light` not `.light`**: element + class selector `(0,1,1)` beats pseudo-class `:root` `(0,1,0)` regardless of source order. Any future forced-light override should use `html.light`.
- **Dropdown bg pattern**: same as solid UCSI red — use `style={{ backgroundColor: 'var(--bg-surface)' }}`, not `bg-[--bg-surface]`. Tailwind v4 CSS-var arbitrary-value backgrounds are unreliable for any token, not just `--ucsi-red`.

## Pending
- Open bugs: MobileDrawer slide animation
- Open bugs: Timetable weekly grid unreadable below 480px
- Open bugs: Academic result table mobile scroll UX
- Lecturer pages: `/lecturer`, `/lecturer/resources`, `/lecturer/resources/[sectionId]`
- Admin pages: `/admin` + sub-routes

---

# 2026-05-19 — Phase 3: UI polish, bug fixes, dashboard UX audit

## Completed

- **StatCard icon theme fixed** — accent state: `bg-[--ucsi-red] text-white` → `bg-[--ucsi-red]/15 text-[--ucsi-red]`. Removes hardcoded white; tinted bg + UCSI red icon works in all theme combinations.
- **StatCard `items-center` regression reapplied** — disk still had `items-start`; reapplied from dev-log.
- **Finance page download stubs** — Created `components/finance/FinanceDownloadButton.tsx` (client component; Blob + object URL). Invoice download column added to Fee Statements table; receipt download button added to each Payment History row. Content is plain-text stub (invoice/receipt detail). Finance page remains Server Component.
- **ClassSectionCard collapse persistence** — `useEffect` reads `localStorage.getItem('class-open-${sectionId}')` on mount; toggle writes. Accepts brief open→closed flash on first load (standard SSR trade-off).
- **Bug: localStorage key collision** — `class-open-${sectionCode}` collided across courses sharing Section A. Fixed: key is now `class-open-${sectionId}` (e.g. `class-open-sec-001`). `sectionId` prop added to `ClassSectionCard`; classes page updated.
- **Bug: NotificationBell badge** — `bg-[--ucsi-red]` Tailwind v4 CSS-var failure; badge appeared white-on-white in light mode. Fixed: `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style. Badge repositioned from `right-1.5 top-1.5` (inside button, cramped) to `-right-1 -top-1` (corner overflow, standard badge pattern).
- **Bug: Schedule day/time pill** — same `bg-[--ucsi-red]` CSS-var failure. Fixed: inline style on `UpcomingClassWidget`.
- **Dashboard UX audit + polish** (ui-ux-pro-max analysis):
  - StatCard label + sub: `text-[--text-muted]` → `text-[--text-secondary]` (WCAG AA: 2.6:1 → 4.95:1)
  - Schedule day label: `text-[9px]` → `text-[10px]`
  - Schedule metadata row: `text-[10px] text-[--text-muted]` → `text-[11px] text-[--text-secondary]`
  - Schedule card padding: `p-3.5` → `p-4` (aligns to 4px grid)
  - Schedule empty state: "No classes scheduled this week." when `mockCourseSections` is empty
  - Schedule card sub-heading: `text-[--text-muted]` → `text-[--text-secondary]`
  - Announcement date: `text-[10px] text-[--text-muted]` → `text-[11px] text-[--text-secondary]`
  - Announcement scope tag: contrast fixed; prefixed with `"Section:"`
  - QuickActions: visible `"Quick Access"` label added above tile grid (was screen-reader only via `aria-label`)
- TypeScript type-check: 0 errors after all changes

## Architecture Decisions

- **Tailwind v4 CSS-var background rule**: `bg-[--ucsi-red]` silently produces no background in some Tailwind v4 builds. Pattern for all solid UCSI red backgrounds: `style={{ backgroundColor: 'var(--ucsi-red)' }}`. Tailwind class removed for that property. Applied to: FeedbackForm button, NotificationBell badge, schedule day pill.
- **`--text-muted` is not WCAG AA compliant for readable text**: `#a1a1aa` on `#ffffff` = ~2.6:1 contrast. `--text-muted` is decorative-only. All metadata that must be readable uses `--text-secondary` (#71717a, ~4.95:1). `--text-muted` reserved for: empty-state messages, dividers, placeholder text.
- **localStorage key scope**: collapse keys must use globally-unique IDs (`sectionId`), not display-scoped codes (`sectionCode`). Codes like "A" repeat across courses.
- **Finance download pattern**: Server Component pages create content strings (invoiceText/paymentReceiptText helpers); client component handles Blob/URL mechanics. No coupling between data shape and download trigger.
- **`bg-[--ucsi-red]/15` tinted icon containers**: replaces solid red + white text for accent StatCard icons. Works reliably across all theme combinations; preserves red brand emphasis without hardcoded foreground.

## Pending
- Open bugs: NotificationBell + UserMenu click-outside close
- Open bugs: MobileDrawer slide animation
- Open bugs: Timetable weekly grid unreadable below 480px
- Open bugs: Academic result table mobile scroll UX
- Lecturer pages: `/lecturer`, `/lecturer/resources`, `/lecturer/resources/[sectionId]`
- Admin pages: `/admin` + sub-routes

---

# 2026-05-18 (session 3) — Phase 3: Sidebar visual polish + stat card spacing

## Completed
- **Sidebar bg softened** — `#18181b` (zinc-900, near-black) → `#1e293b` (slate-800, dark blue-slate) for light OS; `#09090b` → `#0f172a` (slate-900) for dark OS. Both Sidebar.tsx and MobileDrawer.tsx inline-style fallback hex updated to match.
- **Active NavItem redesigned** — replaced full red block (`bg-[var(--ucsi-red)] text-white`) with `bg-white/10 text-white` + `border-l-2 border-[var(--ucsi-red,#C1272D)] pl-[10px]` left indicator. `pl-[10px]` compensates the 2px border so text stays at the same 12px visual edge as inactive items.
- **NavItem hover standardised** — `bg-white/15 text-zinc-100` → `bg-white/10 text-zinc-100`. Standard Tailwind opacity scale; avoids arbitrary-value syntax which is unreliable in Tailwind v4.
- **NavGroup section label fixed** — `text-[--text-muted]` → `text-zinc-400` (same defensive Tailwind utility pattern as NavItem inactive text).
- **StatCard alignment fixed** — `items-start` → `items-center` on the card's outer flex; value text `text-xl` → `text-lg sm:text-xl`. Fixes Balance Due card appearing off-centred and Notifications card having awkward empty space on mobile 2-col grid.
- **Stat card grid breakpoints improved** — `lg:grid-cols-4` → `md:grid-cols-4` in dashboard/page.tsx and academic/page.tsx. 4-column layout now activates at 768px (tablet) instead of 1024px.
- **Schedule/Announcements layout improved** — `lg:grid-cols-[1fr_360px]` → `md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]`. Side-by-side at tablet (300px sidebar column), expands at desktop.
- TypeScript type-check: 0 errors

## Architecture Decisions
- **Active state differentiator is the border-l-2, not bg opacity**: hover and active both use `bg-white/10` — the red `border-l-2` is what makes active unmistakable. Avoids the need for imperceptibly different opacity levels (e.g. 8% vs 10%).
- **Collapsed nav accepts hover = active visually**: on collapsed sidebar (icons-only, no border-l visible), active and hover look identical since both are `bg-white/10`. This is acceptable — collapsed mode relies on tooltips + pathname-driven state, not background differentiation.
- **Tailwind v4 opacity policy**: arbitrary opacity syntax (`bg-white/[7%]`, `bg-white/[0.07]`) is unreliable in v4 — can silently produce no background in certain CSS contexts. Always use standard scale (`bg-white/5`, `/10`, `/15`, `/20`).
- **Sidebar bg = slate-800 not zinc-900**: zinc-900 felt aggressive against the `#fafafa` content area ("hacker dark"). Slate-800 (`#1e293b`) has a subtle blue tint that reads as enterprise SaaS (pattern used by Linear, GitHub dark sidebar, Vercel dashboard). Dark-OS variant uses slate-900 (`#0f172a`) to stay visually distinct from the near-black page bg.
- **StatCard `items-center`**: icon (40px) + text block (~48px) are vertically centred together. When one card in a grid row is taller than expected (e.g. currency value wraps on mobile), neighbouring cards' content centres in the stretched cell rather than sitting top-anchored with empty space below.

## Pending
- Lecturer pages: `/lecturer` dashboard, `/lecturer/resources` (My Classes), `/lecturer/resources/[sectionId]` (ClassPost CRUD)
- Admin pages: `/admin` dashboard, `/admin/{users,programmes,sections,resources}`
- UI polish: click-outside for dropdowns, MobileDrawer slide animation (see bugs.md)

---

# 2026-05-18 (continued, session 2) — Phase 3: UI fixes + classes category view

## Completed
- **Fixed FeedbackForm submit button visibility** — button was in the DOM but `bg-[--ucsi-red]` may silently fail in some Tailwind v4 builds; replaced with `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style to guarantee rendering
- **Classes page: grouped resources by category** — instead of a flat list, resources are now sectioned under Slides, Tutorials, Exercises, Assignments, Recordings, Notices, Other Files (only sections with content appear)
- **Expanded mock-resources.ts** — 16 resources across HCI (sec-001: 7), DBMS (sec-002: 4), WAD (sec-003: 5) with slides, tutorials, exercises, and assignments per section; sec-004 (BM) intentionally empty to show "No resources published yet" state
- **Added `Dumbbell` + `Video` + `Bell` icons** to classes page for exercise, recording, and announcement types
- TypeScript type-check: 0 errors

## Architecture Decisions
- Classes page remains a Server Component — category grouping done with `.filter()` + `.map()` on imported mock arrays, no client state needed
- `ResourceItem` extracted as a plain function inside the module (not exported, not a named component) — avoids creating a separate file for a purely presentational helper used only in this page
- `CATEGORIES` ordered array drives both the display order and label text — adding a new `ResourceType` only requires adding one entry here

## UI Branding Updates
- Updated topbar branding from "Student Portal" to "IISV3 Student Portal"

## Pending
- Classes page Download button still a stub (Phase 6: presigned URLs or `/api/files/[id]`)
- Lecturer pages: `/lecturer` dashboard + `/lecturer/resources` (My Classes)
- Admin pages: `/admin` dashboard + sub-routes

---

# 2026-05-18 (continued) — Phase 3: Static UI pages

## Completed
- Implemented Card and Badge UI primitives (used across all pages)
- Created data/mock-results.ts — SectionResult type, per-section grades, mockCGPA (3.75), mockPreviousCGPA (3.62)
- Created data/mock-feedback.ts — 3 mock feedback entries with statuses (resolved, under_review, submitted)
- Built components/dashboard/StatCard.tsx — icon + value + sub-label card with optional UCSI red accent
- Built components/dashboard/UpcomingClassWidget.tsx (ClassScheduleItem) — day/time badge + course + room display
- Built components/dashboard/AnnouncementFeed.tsx (AnnouncementCard) — title, body, scope tag, date
- Built components/dashboard/QuickActions.tsx — 4 nav shortcut tiles (Results, Pay Fees, Timetable, Feedback)
- Built components/dashboard/FeedbackForm.tsx — 'use client' form component (extracted to avoid server component event handler error)
- Built components/academic/CourseResultTable.tsx — full table with grade badge, attendance %, standing, room
- Implemented app/(portal)/dashboard/page.tsx — stat grid, schedule, announcements, quick actions
- Implemented app/(portal)/academic/page.tsx — CGPA trend, credits, graduation date; results table; past semesters
- Implemented app/(portal)/timetable/page.tsx — Mon–Fri weekly grid + sortable list view
- Implemented app/(portal)/classes/page.tsx — per-section resource cards with type badge, file size, download count
- Implemented app/(portal)/finance/page.tsx — balance summary, invoice table with status badges, payment history
- Implemented app/(portal)/profile/page.tsx — avatar, enrolment, personal info, guardian, address sections
- Implemented app/(portal)/feedback/page.tsx — FeedbackForm + feedback history with status badges
- TypeScript type-check: 0 errors across all pages
- All 7 student pages verified returning HTTP 200

## Architecture Decisions
- All Phase 3 pages are Server Components; only the feedback form extracted to 'use client' (has onSubmit handler)
- Card and Badge are the only shared UI primitives needed — no Table wrapper created, tables inlined in pages
- FeedbackForm kept in components/dashboard/ (not components/ui/) as it's domain-specific, not a primitive
- Mock data files (mock-results.ts, mock-feedback.ts) created separately to keep mock-courses.ts and mock-student.ts clean
- Timetable weekly grid uses a 5-column CSS grid (Mon–Fri only); Sat slot not shown since no weekend classes in mock data
- Classes page uses ResourceType → icon/label/badge-variant lookup maps for extensibility when real types are added

## Pending
- Phase 3 remaining: Lecturer dashboard (/lecturer), Lecturer My Classes (/lecturer/resources), Admin dashboard (/admin)
- Update CLAUDE.md status table (Phase 2 → Done, Phase 3 → In Progress)
- UI polish pass: click-outside close for NotificationBell and UserMenu dropdowns
- UI polish pass: slide animation for MobileDrawer

## Known Risks
- Authorization complexity (Phase 5): TeachingAssignment + StudentSectionEnrollment enforcement server-side
- Timetable weekly grid is too small on mobile — each cell needs min-width or a list-only view on small screens
- Academic result table overflows horizontally on narrow screens (has overflow-x-auto wrapper, but UX is poor)
- Classes page download button is a stub — no real file URLs yet; clicking does nothing
- Learning resource permissions per section (lecturer upload gating) — Phase 6

---

# 2026-05-18 — Phase 2: Layout system

## Completed
- Installed shadcn/ui (base-nova style, @base-ui/react primitives) and lucide-react
- Restored utils.ts after shadcn overwrote it — preserved cn() (clsx + tailwind-merge) plus formatRM, formatDate, DAY_LABELS
- Updated globals.css: appended UCSI design tokens on top of shadcn's generated structure (did not replace it)
- Stripped root layout.tsx to html/body only; updated metadata to "UCSI Student Portal"
- Replaced root page.tsx with redirect to /dashboard
- Deleted create-next-app template SVGs (next.svg, vercel.svg, file.svg, globe.svg, window.svg)
- Created lib/nav.ts — NAV_CONFIG for all 3 roles (Student, Lecturer, Admin); /resources renamed to /classes
- Created contexts/LayoutContext.tsx — sidebarCollapsed, mobileOpen, mockRole state
- Created components/layout/SkipToMain.tsx — WCAG skip link
- Implemented components/layout/NavItem.tsx — active state via aria-current, collapsed icon-only mode
- Implemented components/layout/NavGroup.tsx — labeled section wrapper
- Created components/layout/SidebarNav.tsx — role-aware nav tree shared by Sidebar + MobileDrawer
- Created components/layout/DevRoleSwitcher.tsx — dev-only role dropdown (returns null in production)
- Implemented components/layout/NotificationBell.tsx — bell + badge stub (mock unread: 3)
- Implemented components/layout/UserMenu.tsx — avatar + mock name/role + dropdown stub
- Implemented components/layout/Sidebar.tsx — 240px ↔ 64px collapsible, hidden on mobile
- Created components/layout/MobileDrawer.tsx — focus trap, Escape close, scroll lock
- Implemented components/layout/TopBar.tsx — hamburger, logo, DevRoleSwitcher, NotificationBell, UserMenu
- Created app/(portal)/layout.tsx — portal shell wiring LayoutProvider + TopBar + Sidebar + MobileDrawer
- Moved all pages into (portal)/ route group; /resources → /classes (rename complete)
- TypeScript type-check: 0 errors
- Dev server verified: all routes return 200, portal shell renders correctly

## Architecture Decisions
- shadcn base-nova uses @base-ui/react (not Radix UI) — impacts any future shadcn component additions
- UCSI tokens appended to globals.css rather than replacing it — preserves shadcn token chain
- Renamed --color-border → --ucsi-border and --sidebar-border → --sidebar-nav-border to avoid conflict with shadcn's @theme inline mappings
- Dark mode: OS preference via @media (prefers-color-scheme: dark) on UCSI tokens only; shadcn's .dark class system left intact for its own components
- Route group (portal)/ — all authenticated pages share one layout shell; login sits outside at /login
- DevRoleSwitcher uses inner component pattern to avoid hooks-after-conditional-return lint violation
- Mock role stored in LayoutContext; will be replaced by real Auth.js session in Phase 5

## Pending
- Phase 3: Build static UI pages with mock data
  - Dashboard (GPA card, upcoming classes, balance due, announcements)
  - Academic (enrolled modules, grades table)
  - Timetable (weekly grid)
  - Classes (subject/resource browser — replaces thecn.com)
  - Financial (fees, payment history)
  - Feedback (form stub)
  - Profile (student info card)
- Update CLAUDE.md status table (Phase 2 → Done)

## Known Risks
- Authorization complexity (Phase 5): TeachingAssignment + StudentSectionEnrollment enforcement server-side
- Responsive academic/timetable tables on small screens
- Learning resource permissions per section (lecturer upload gating)
- shadcn base-nova component APIs may differ from shadcn docs (uses @base-ui/react, not Radix)

---

# 2026-05-17

## Completed
- Installed Next.js
- Installed Graphify
- Added screenshot analysis
- Ran /graphify
- Generated architecture documentation prompt
- Generate frontend folder structure

## Architecture Decisions
- Student, Lecturer, Admin roles
- Learning resources tied to ClassSection
- Enrollment-based access control
- Lecturer uploads restricted by TeachingAssignment
- Sidebar navigation
- Mobile-first redesign

## Pending
- Review generated docs
- Build layout system

## Known Risks
- Authorization complexity
- Responsive academic tables
- Learning resource permissions
