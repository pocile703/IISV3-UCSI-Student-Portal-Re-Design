# API Routes

All routes are Next.js App Router Route Handlers (`app/api/...`). Every route validates the session and role before processing. Responses follow a consistent envelope.

> **Cohesion note (from graphify):** The graphify knowledge graph flagged the combined API + Auth Routes community as having very low cohesion (0.06). This reflects the fact that auth routes, student data routes, lecturer resource routes, and admin management routes serve fundamentally different concerns. Keep them in separate sub-route groups with separate middleware checks — do not consolidate shared utilities in ways that blur role boundaries.

---

## Invoice Status Codes

The legacy IISV2 portal used opaque status codes (e.g. `DPY`) that were never explained in the UI. The redesign uses explicit status values:

| Status | Meaning |
|---|---|
| `unpaid` | Invoice issued, no payment received |
| `partial` | At least one payment, still outstanding balance |
| `paid` | Fully settled |
| `overdue` | Due date passed, still unpaid |
| `cancelled` | Voided invoice (soft cancel — record retained) |

Never surface raw DB enum values in the UI — always map through a display label.

---

## Response Envelope

```typescript
// Success
{ data: T, meta?: { total?: number, page?: number } }

// Error
{ error: string, code?: string }
```

HTTP status codes follow REST conventions: 200, 201, 400, 401, 403, 404, 422, 500.

---

## Auth Routes

| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | Public | Auth.js handler (login, logout, session) |
| POST | `/api/auth/forgot-password` | Public | Send password reset email |
| POST | `/api/auth/reset-password` | Public | Consume reset token, set new password |
| GET | `/api/auth/me` | Any authed | Return current user + role |

---

## Student Routes

All require role = `student`. Server also checks the student record belongs to the session user.

### Profile

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/profile` | Fetch own profile |
| PATCH | `/api/student/profile` | Update editable fields (mobile, address, guardian) |

### Academic

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/academic` | Programme enrollment(s) + all semester summaries |
| GET | `/api/student/academic/semesters/[semesterId]` | Courses, results, attendance for one semester |
| GET | `/api/student/academic/transcript` | Generate + stream PDF transcript |

### Timetable

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/timetable` | All enrolled sections for current semester with schedule |
| GET | `/api/student/timetable?semesterId=[id]` | Sections for a specific semester |

### Financial

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/financial` | Balance summary + all invoices |
| GET | `/api/student/financial/invoices/[invoiceId]` | Invoice detail + payment history |
| GET | `/api/student/financial/invoices/[invoiceId]/pdf` | Download invoice PDF |

### Learning Resources

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/classes` | Enrolled sections with resource counts |
| GET | `/api/student/classes/[sectionId]` | Resources for one enrolled section |
| GET | `/api/files/[sectionId]/[attachmentId]` | Download resource attachment (app-proxied) |

> Server checks: (1) `StudentSectionEnrollment` exists for this student + section, status = `enrolled`. (2) `resource.isPublished = true` before returning metadata. (3) **IDOR guard on download:** verify `attachment.resource.courseSectionId === params.sectionId` before reading the file — without this, a student enrolled in section A can request an attachment belonging to section B by substituting the sectionId param. (4) File is streamed from local disk; `Cache-Control: no-store` prevents stale cached responses.

### Section Posts (ClassPost — read)

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/classes/[sectionId]/posts` | Section posts for one enrolled section |

> Server checks: `StudentSectionEnrollment` (status = `enrolled`) + `isPublished = true`. Returns posts sorted pinned-first then by `createdAt DESC`.

### Workflow

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/add-drop` | Own add/drop requests |
| POST | `/api/student/add-drop` | Submit add/drop request |
| GET | `/api/student/progression` | Own progression requests |
| POST | `/api/student/progression` | Submit progression request |
| GET | `/api/student/feedback` | Own feedback list |
| POST | `/api/student/feedback` | Create new feedback |
| GET | `/api/student/feedback/[feedbackId]` | Feedback detail |

### Notifications

| Method | Route | Description |
|---|---|---|
| GET | `/api/student/notifications` | Unread + recent notifications |
| PATCH | `/api/student/notifications/[id]/read` | Mark as read |
| PATCH | `/api/student/notifications/read-all` | Mark all as read |

---

## Lecturer Routes

All require role = `lecturer`. Server checks `TeachingAssignment` on any section-scoped action.

| Method | Route | Description |
|---|---|---|
| GET | `/api/lecturer/sections` | Assigned course sections (current semester) |
| GET | `/api/lecturer/sections/[sectionId]` | Section detail + enrolled student count |
| GET | `/api/lecturer/resources/[sectionId]` | Resources uploaded to this section |
| POST | `/api/lecturer/resources/[sectionId]` | Upload a new resource (multipart/form-data) |
| PATCH | `/api/lecturer/resources/[sectionId]/[resourceId]` | Edit title, description, type, published |
| DELETE | `/api/lecturer/resources/[sectionId]/[resourceId]` | Delete resource + attachment(s) |

> Every `sectionId`-scoped route first queries: `SELECT 1 FROM TeachingAssignment WHERE lecturer_id = $1 AND course_section_id = $2`. Returns 403 if not found.
>
> **PATCH and DELETE additionally check `uploaded_by = lecturerId`.** TeachingAssignment alone does not prevent a co-assigned lecturer from mutating another lecturer's resources. Read operations (GET) do not need this check.

### Section Posts (ClassPost — write)

| Method | Route | Description |
|---|---|---|
| GET | `/api/lecturer/sections/[sectionId]/posts` | Posts for this section |
| POST | `/api/lecturer/sections/[sectionId]/posts` | Create post |
| PATCH | `/api/lecturer/sections/[sectionId]/posts/[postId]` | Edit title, body, type, isPinned, isPublished |
| DELETE | `/api/lecturer/sections/[sectionId]/posts/[postId]` | Delete post |

> All post write routes check TeachingAssignment. PATCH/DELETE additionally check `post.authorId === session.user.lecturerId` (same ownership pattern as `resource.uploadedBy` on resource mutations).

---

## Admin Routes

All require role = `admin`.

### Users

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/users` | Paginated user list with filters |
| POST | `/api/admin/users` | Create user + linked student/lecturer profile |
| GET | `/api/admin/users/[userId]` | User detail |
| PATCH | `/api/admin/users/[userId]` | Edit role, active status |
| POST | `/api/admin/users/[userId]/reset-password` | Force password reset |

### Programmes & Courses

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/admin/programmes` | List / Create |
| PATCH/DELETE | `/api/admin/programmes/[id]` | Update / Delete |
| GET/POST | `/api/admin/courses` | List / Create |
| PATCH/DELETE | `/api/admin/courses/[id]` | Update / Delete |
| GET/POST | `/api/admin/semesters` | List / Create |
| PATCH/DELETE | `/api/admin/semesters/[id]` | Update / Delete |
| GET/POST | `/api/admin/sections` | List / Create course sections |
| PATCH/DELETE | `/api/admin/sections/[id]` | Update / Delete |

### Assignments & Enrollments

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/admin/assignments` | List / Create TeachingAssignment |
| DELETE | `/api/admin/assignments/[id]` | Remove assignment |
| GET/POST | `/api/admin/enrollments` | List / Create StudentSectionEnrollment |
| PATCH | `/api/admin/enrollments/[id]` | Change status |

### Global Announcements (ClassPost with `courseSectionId = null`)

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/announcements` | All global announcements |
| POST | `/api/admin/announcements` | Create global announcement (`courseSectionId` = null) |
| PATCH | `/api/admin/announcements/[id]` | Edit / pin / unpublish |
| DELETE | `/api/admin/announcements/[id]` | Delete |

### System-Wide Post Moderation

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/posts` | All ClassPosts across all sections (paginated, filterable by section/type) |
| PATCH | `/api/admin/posts/[id]` | Toggle `isPublished`, toggle `isPinned` |
| DELETE | `/api/admin/posts/[id]` | Remove any post regardless of author |

### Workflow Moderation

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/add-drop` | All add/drop requests with filters |
| PATCH | `/api/admin/add-drop/[id]` | Approve or reject |
| GET | `/api/admin/progression` | All progression requests |
| PATCH | `/api/admin/progression/[id]` | Approve or reject |
| GET | `/api/admin/feedback` | All feedback items |
| PATCH | `/api/admin/feedback/[id]` | Update status |

> **`PATCH /api/admin/add-drop/[id]` (approve) is a two-write operation** and must be wrapped in a `$transaction`: update `AddDropRequest.status` + create/update `StudentSectionEnrollment`. For `action = add`, create a new enrollment. For `action = drop`, set enrollment `status = 'dropped'`. Enrollment creation must also check `section.maxCapacity` against current enrolled count inside the same transaction:
> ```typescript
> const count = await tx.studentSectionEnrollment.count({
>   where: { courseSectionId, status: 'enrolled' },
> })
> if (count >= section.maxCapacity) return Response.json({ error: 'Section full' }, { status: 409 })
> ```

### Resources Moderation

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/resources` | All resources across all sections |
| PATCH | `/api/admin/resources/[id]` | Toggle published |
| DELETE | `/api/admin/resources/[id]` | Remove resource |

---

## File Upload Flow

Storage backend: **local filesystem** under `<app-root>/uploads/` (gitignored). This is intentional for a college project — not a production multi-tenant deployment. The `storageKey` field in `ResourceAttachment` is the only DB-stored locator; no bucket URLs or CDN paths.

1. Client POSTs to `POST /api/upload/resource` as `multipart/form-data`
2. Server: `requireApiAuth()` (revalidates `isActive` + `sessionVersion`) + lecturer role check
3. Server: `TeachingAssignment` gate — lecturer must be assigned to the section
4. Server: file size check (100 MB hard cap), magic-bytes MIME validation (no HTML/JS/SVG)
5. Server: creates `LearningResource` row (its `id` anchors the storage key path)
6. Server: writes file to `uploads/resources/{sectionId}/{resourceId}/{uuid}-{filename}`
7. Server: creates `ResourceAttachment` row with `storageKey`
   — if step 7 fails, both the storage file and the resource row are rolled back
8. Client receives `{ resourceId, attachmentId }` — `201 Created`

## File Download Flow

1. Client requests `GET /api/files/[sectionId]/[attachmentId]`
2. Server: `requireApiAuth()` + role check
3. Server: IDOR guard — `attachment.resource.courseSectionId` must equal `:sectionId` path param
4. Server: role-branched authz:
   - **student**: `isPublished` check + `StudentSectionEnrollment(status=ENROLLED)` check
   - **lecturer**: `TeachingAssignment` check (can preview unpublished drafts)
   - **admin**: no section check (global moderation access)
5. Server: reads file from local disk; `downloadCount` incremented fire-and-forget
   — `downloadCount` measures "requests served" (file read from disk), not bytes confirmed received by client
6. Server: streams file with `Content-Disposition: attachment`, `Cache-Control: no-store`

> **Note:** This is an app-proxied download (server buffers the file). Acceptable at college-project scale. For production with large files, replace `readFile` + `NextResponse` body with a redirect to a pre-signed object-store URL and swap `lib/storage.ts` to an S3-compatible adapter.

## Add/Drop + Progression Request Flow (Phase 7)

Server Actions, not Route Handlers. Models: `AddDropRequest`, `ProgressionRequest` (status `PENDING|APPROVED|REJECTED`).

**Student side** (`app/(portal)/requests/actions.ts`, surface `/requests`):
1. `submitAddDropRequest` / `submitProgressionRequest` — `getValidatedSession()` + explicit `role === 'student'` (M5).
2. Server-side validation (form option lists are convenience only): section must be `isActive` + in a `isCurrent` semester + belong to a programme the student is enrolled in; action consistent with current enrollment (no DROP of a non-ENROLLED section, no ADD of an already-ENROLLED one); one PENDING request per section / one PENDING progression at a time.
3. `revalidatePath('/requests')`.

**Admin side** (`app/(portal)/admin/requests/actions.ts`, surface `/admin/requests`):
1. `approveAddDropRequest` — `assertAdmin()` + lenient `requestIdSchema`. **`$transaction`**: re-reads the request `FOR`-status `PENDING`, then ADD → capacity check (`count ENROLLED < maxCapacity`) + `upsert` enrollment to `ENROLLED`; DROP → `update` enrollment to `DROPPED`; finally marks the request `APPROVED` with `reviewedBy`/`reviewedAt`. Aborts with a friendly message on capacity/decided/missing-enrollment.
2. `rejectAddDropRequest` / `approve|rejectProgressionRequest` — guarded `updateMany WHERE status='PENDING'`; `count === 0` → "already decided". Progression decisions are **status-only** (enrollment migration is a Registrar back-office step, out of scope).
3. Revalidates `/admin/requests`, `/admin`, `/requests` (+ `/timetable`, `/classes` on an approved add/drop).

## Admin STUDENT Create / Edit Flow (Phase 7)

Server Actions in `app/(portal)/admin/users/actions.ts` (all `assertAdmin`-guarded).

- **`adminCreateUser` (STUDENT branch)** — single `$transaction` creates `User` (role STUDENT) +
  `Student` profile (18 fields, Zod `studentProfileSchema`) + initial `ProgrammeEnrollment`. The
  selected programme is checked to exist + be active before the transaction opens. Dates are
  calendar-validated (`isoDateSchema` round-trips through `Date` to reject e.g. 2026-02-31). P2002
  surfaces field-specific errors (username / email / studentNumber).
- **`getStudentProfileForEdit(userId)`** — on-demand read of a Student's editable PII (name,
  contact, guardian, address). Loaded only when the edit modal opens so the users table never
  bulk-fetches PII.
- **`adminUpdateStudentProfile(userId, patch)`** — edits the mutable Student fields (`studentProfileEditSchema`).
  Identity fields (studentNumber, dateOfBirth, gender) and the programme enrollment are NOT patched here.
- **Role-change boundary:** `adminUpdateUser` supports LECTURER↔ADMIN only. Switching a role TO or
  FROM STUDENT is intentionally unsupported (would require creating/deleting a full profile row).
  Students are created with their profile via `adminCreateUser`.
