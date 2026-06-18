	# Backend Readiness Review

Architectural analysis of the student portal before Phase 4 (Prisma + DB), Phase 5 (Auth.js), and Phase 6 (file upload / admin CRUD). No backend code is implemented here. This document records gaps, decisions, and sequenced recommendations.

Reviewed: 2026-05-21 (updated with full graph analysis). Sources: graphify knowledge graph (1375 nodes, 1915 edges, 135 communities), all `docs/` architecture files, `app/src/types/`, `app/src/services/`, `app/src/data/`.

---

## 1. RBAC Structure

### What is solid

- Flat 3-role enum (`student | lecturer | admin`) is correct for this domain. Multi-role systems add complexity with no benefit at this institution's scale.
- `SessionUser` already carries `studentId?` and `lecturerId?` alongside `role` — the session shape is ready for the Auth.js callback that populates it.
- `Role` type lives in `types/user.ts` (graphify community 0 — isolated, no leakage). Clean.
- The dual-check architecture (Next.js middleware for route-level + each API handler for resource-level) is documented and correctly structured. Both layers are required and must not be collapsed.

### Gaps

| # | Gap | Severity |
|---|---|---|
| R1 | `SessionUser.studentId / lecturerId` are `?` (optional). If the `jwt` callback fails to populate them (broken seed, missing profile row), downstream handlers get `undefined` and fail silently with a type error at runtime, not a 403 | High |
| R2 | `session_version Int @default(1)` added to `User` table in `docs/database-schema.md` (session 23) ✅. Write to `schema.prisma` and embed in JWT in Phase 4/5. | Medium |
| R3 | `middleware.ts` does not yet exist. When written, the route patterns must match `auth-flow.md` exactly — particularly `/classes/**` (not `/resources/**`) | Low (known) |

### Recommendation

- **Fail hard in the `jwt` callback** if `Student`/`Lecturer` profile row does not exist — let `findUniqueOrThrow` propagate, do not swallow. This surfaces broken seeds in Phase 4 instead of mysterious 500s in Phase 5.
- ✅ `session_version Int @default(1)` recorded in `docs/database-schema.md` (session 23). Add to `schema.prisma` when running Phase 4 — the column must exist before the first seed so the JWT callback can embed it.
- Write `middleware.ts` by copy-pasting route patterns from `auth-flow.md` — do not reconstruct from memory.

---

## 2. Enrollment Relationships

Two authorization primitives flow through `CourseSection` (64-node hub in the graph — highest-degree authorization node):

```
TeachingAssignment:        Lecturer ──assigned_to──► CourseSection ◄──enrolled_in── Student :StudentSectionEnrollment
                                                           │
                                     ┌─────────────────────┼─────────────────────┐
                               LearningResource       ClassPost             Attendance
```

### Authorization chains by operation

| Operation | Required check | What breaks without it |
|---|---|---|
| Lecturer uploads resource | `TeachingAssignment(lecturerId, sectionId)` | Any lecturer writes to any section |
| Lecturer creates/edits post | Same | |
| Lecturer records attendance | Same | |
| Student views resources | `StudentSectionEnrollment(studentId, sectionId, status='enrolled')` | Dropped students keep access |
| Student downloads file | Enrollment check **AND** IDOR attachment guard | See §5 |
| Student views results | `Result.isPublished = true` + enrollment FK chain | Unpublished grades exposed |
| Student views timetable | Derived from enrollments — no extra check needed | n/a |

### Result table FK gap

`Result → StudentSectionEnrollment` (via `student_section_enrollment_id`) is correct normalization. The frontend `SectionResult` type in `mock-results.ts` is semantically similar (graphify INFERRED edge) but structurally different from `Result` in `types/student.ts`. When Phase 4 wires Prisma queries, the academic page needs:

```typescript
prisma.studentSectionEnrollment.findMany({
  where: {
    studentId: session.user.studentId,
    courseSection: { semesterId: currentSemesterId },
  },
  include: {
    result: true,
    courseSection: { include: { course: true } },
  },
})
```

Plan for this join shape, not the flat `sectionId` shape mock data uses. Reconcile `Result` vs `SectionResult` during Phase 4 migration.

### AddDropRequest approval is a two-write atomic operation

```typescript
await prisma.$transaction([
  prisma.addDropRequest.update({ where: { id }, data: { status: 'approved' } }),
  prisma.studentSectionEnrollment.create({ ... }),  // or update for drop
])
```

### Section capacity enforcement (missing from API handler plan)

`CourseSection.maxCapacity` exists in the schema but enrollment creation does not document the check. Add inside the same transaction:

```typescript
const count = await tx.studentSectionEnrollment.count({
  where: { courseSectionId, status: 'enrolled' },
})
if (count >= section.maxCapacity) return Response.json({ error: 'Section full' }, { status: 409 })
```

---

## 3. ClassSection Ownership

`CourseSection` is admin-owned. No other role mutates it.

```
Admin creates:  Course → Semester → CourseSection
Admin assigns:  TeachingAssignment  (Lecturer → CourseSection)
Admin enrolls:  StudentSectionEnrollment (Student → CourseSection)
Lecturer reads: sections via TeachingAssignment
Student reads:  sections via StudentSectionEnrollment
```

Timetable is a derived query — no separate `Timetable` table should appear in the Prisma schema. `/admin/sections` in Phase 6 is where section CRUD lives.

---

## 4. Lecturer Permissions

| Action | Allowed? | Gate |
|---|---|---|
| View enrolled students in assigned section | Yes | TeachingAssignment |
| Upload resource to assigned section | Yes | TeachingAssignment |
| Edit/delete own resource | Yes | TeachingAssignment **and** `uploaded_by = lecturerId` |
| Edit/delete another lecturer's resource in same section | **No** | TeachingAssignment alone does not block this — `uploaded_by` check is mandatory |
| Post to assigned section | Yes | TeachingAssignment |
| Edit/delete own post | Yes | TeachingAssignment **and** `authorId = lecturerId` |
| Edit/delete another lecturer's post | **No** | Same gap as resources |
| Take attendance for assigned section | Yes | TeachingAssignment |
| View student personal data (address, guardian, DoB) | **No** | `/api/student/profile` is student-only |
| View another section's resources | **No** | TeachingAssignment check blocks — `WHERE courseSectionId IN (assigned)` |

### Critical gap: `uploaded_by` check on all mutations

```typescript
// After TeachingAssignment check:
const resource = await prisma.learningResource.findUniqueOrThrow({ where: { id: params.resourceId } })
if (resource.uploadedBy !== session.user.lecturerId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
// Same pattern for posts:
const post = await prisma.classPost.findUniqueOrThrow({ where: { id: params.postId } })
if (post.authorId !== session.user.lecturerId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

Read operations (GET) do not need this check — any assigned lecturer may read all content in their section.

### ClassPost field alignment ✅

`types/post.ts` matches the Prisma shape: `courseSectionId: string | null`, `authorId: string`, `isPinned: boolean`, `isPublished: boolean` — all non-optional with correct names. No TS errors expected when `@prisma/client` types are generated.

---

## 5. Resource Authorization

### Write path (lecturer upload)

```
POST /api/lecturer/resources/[sectionId]
  1. Validate session.user.role === 'lecturer'
  2. Validate TeachingAssignment(lecturerId, sectionId)        ← lecturerId from session, never request body
  3. Validate file (MIME whitelist, magic bytes, size ≤ 100MB)
  4. Upload to R2 at resources/{sectionId}/{resourceId}/{uuid}-{safeFilename}
  5. $transaction: create LearningResource + ResourceAttachment
```

### Read path (student download)

```
GET /api/student/classes/[sectionId]/download/[attachmentId]
  1. Validate session.user.role === 'student'
  2. Validate StudentSectionEnrollment(studentId, sectionId, status = 'enrolled')
  3. attachment = findUniqueOrThrow({ id: attachmentId }, include: { resource: true })
  4. if attachment.resource.courseSectionId !== params.sectionId → 403   ← IDOR guard
  5. if !attachment.resource.isPublished → 404                           ← draft guard
  6. download_count++
  7. generateSignedUrl(attachment.storageKey, { expiresIn: 900 })
```

Step 4 is the IDOR guard. Without it, a student enrolled in section A can request `attachmentId` belonging to section B by substituting the `sectionId` URL param.

### LearningResource.attachments field ✅

`types/resource.ts` now has `attachments?: ResourceAttachment[]` on `LearningResource` (added 2026-05-22, session 22 — optional to preserve existing mock data with zero cascade). Phase 4 Prisma query: `include: { attachments: true }`. The mock-era `ClassSectionCard` keeps its local `LearningResource & { attachment?: ResourceAttachment }` single-item intersection; drop it in Phase 4 and read `resource.attachments?.[0]`.

---

## 6. ClassPost vs Announcement — Resolved

**Decision (confirmed):** `ClassPost` and `Announcement` merged into one `ClassPost` table.

- Section-scoped: `courseSectionId` = non-null (lecturer-authored)
- Global: `courseSectionId` = null (admin-authored)
- The `type` enum covers both use cases
- The standalone `Announcement` table has been removed from `database-schema.md`

`AnnouncementFeed` in Phase 4 queries `ClassPost WHERE courseSectionId IS NULL`. Do not create an `Announcement` Prisma model.

---

## 7. API Boundaries

### ClassPost routes

Added to `api-routes.md`. Lecturer (section-scoped, TeachingAssignment required):
```
GET/POST   /api/lecturer/sections/[sectionId]/posts
PATCH/DELETE /api/lecturer/sections/[sectionId]/posts/[postId]
```
Student (read-only, enrollment + isPublished filter):
```
GET /api/student/classes/[sectionId]/posts
```
Admin (moderation):
```
GET /api/admin/posts
PATCH/DELETE /api/admin/posts/[postId]
POST /api/admin/announcements  (courseSectionId = null)
```

### Route URL alignment ✅

`services/student.ts` calls `/api/student/classes/${sectionId}` and `/api/student/classes/${sectionId}/download/${attachmentId}` — corrected in session 16.

### apiFetch hardening ✅

`services/api.ts` exports `ApiError` (carries `status: number`) and `apiUpload<T>` (multipart helper, no `Content-Type` header, optional `AbortSignal`) — added in session 18. `lecturerService.uploadResource` uses `apiUpload`. Callers pattern-match on `err.status`: `401` → login, `403` → permission error, `422` → validation.

### ClassPost methods missing from service stubs

`lecturerService` has no post methods; `studentService` has no `getPosts`. Add when wiring Phase 4:

```typescript
// lecturerService
getPosts: (sectionId) => apiFetch(`/api/lecturer/sections/${sectionId}/posts`),
createPost: (sectionId, body) => apiFetch(`/api/lecturer/sections/${sectionId}/posts`, { method: 'POST', body: JSON.stringify(body) }),
updatePost: (sectionId, postId, body) => apiFetch(`/api/lecturer/sections/${sectionId}/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(body) }),
deletePost: (sectionId, postId) => apiFetch(`/api/lecturer/sections/${sectionId}/posts/${postId}`, { method: 'DELETE' }),

// studentService
getPosts: (sectionId) => apiFetch(`/api/student/classes/${sectionId}/posts`),
```

### Low-cohesion warning from graphify

API + Auth Routes community scored 0.06 cohesion — the lowest in the graph. Expected given domain breadth. Correct response: keep role namespaces (`/api/student/`, `/api/lecturer/`, `/api/admin/`) strictly separated. Do not create shared handler utilities that blur authorization logic.

---

## 8. Prisma Schema — Normalization

### Decision log (all required before schema.prisma is written)

| # | Issue | Decision |
|---|---|---|
| N1 | `Invoice.amount_outstanding` stored computed field — risks drift | **Drop the column. Compute via Prisma `_sum` aggregate at query time.** |
| N2 | `ClassPost` vs `Announcement` — overlapping concepts | **Merged into one `ClassPost` table** (done). Remove `Announcement` from schema. |
| N3 | `ResourceAttachment.storage_key` — no uniqueness constraint | Add `@@unique([storageKey])` |
| N4 | `Attendance` unique constraint | `@@unique([studentId, courseSectionId, date])` — prevents duplicate records from concurrent saves |
| N5 | `Semester.programme_id` join chain is hot path | `INDEX ON Semester (programme_id, is_current)` from day one |
| N6 | `ClassPost.pinned?` is optional in TypeScript | ✅ `isPinned: boolean` (non-optional) in `types/post.ts` — matches Prisma `@default(false)` |
| N7 | `ClassPost` missing `isPublished` | ✅ `isPublished: boolean` (non-optional) in `types/post.ts` — matches Prisma `@default(true)` |
| N8 | `ClassPost` field names diverge from DB | ✅ All fields renamed in session 16: `courseSectionId`, `authorId`, `isPinned`, `isPublished` |
| N9 | `ResourceAttachment` not linked from `LearningResource` | ✅ `attachments?: ResourceAttachment[]` added (optional) in `types/resource.ts` — session 22 |
| N10 | `Result` vs `SectionResult` shape divergence | Reconcile during Phase 4 migration — define one canonical type from Prisma |
| N11 | `Invoice.amount_outstanding` is stored | Drop column (see N1) — no `$transaction` contract to maintain |

### Type file reorganization (prerequisite for Phase 4)

| Current location | Move to |
|---|---|
| `types/student.ts` — `Course`, `CourseSection`, `Semester`, `Programme` | `types/academic.ts` (new file) |
| `mock-results.ts` — `PastSemesterCourse`, `PastSemesterDetail` | `types/academic.ts` |
| `types/student.ts` — `Student`, `ProgrammeEnrollment`, `Result` | Keep in `types/student.ts` |
| `types/user.ts` — `User`, `SessionUser`, `Role` | Keep in `types/user.ts` |

Once Prisma generates types, progressively replace `types/` imports with `@prisma/client` imports per route. Do not big-bang replace.

### `Attendance` FK design is intentional

`Attendance` links to `student_id + course_section_id`, not through `StudentSectionEnrollment`. This is intentional — attendance is a historical observation of physical presence, not an enrollment state. A dropped student's prior attendance records must persist. The `@@unique` constraint is still required to prevent duplicate saves.

---

## 9. Scalability Risks

### Index plan (all required at schema creation)

| Index | Table | Query it enables | Severity |
|---|---|---|---|
| `(user_id, is_read, created_at DESC)` | `Notification` | Recent unread for user — polled on every page load | **High** |
| `(student_id, date)` | `Attendance` | Timetable missed-sessions view | **High** |
| `(programme_id, is_current)` | `Semester` | Current semester for programme — every timetable/academic load | **High** |
| `(lecturer_id, course_section_id)` | `TeachingAssignment` | Assignment check on every lecturer API call | **High** |
| `(student_id, course_section_id)` | `StudentSectionEnrollment` | Enrollment check on every student API call | **High** |
| `(student_section_enrollment_id, is_published)` | `Result` | Academic page published-results filter | Medium |
| `(course_section_id)` | `ClassPost` | Section post feed | Medium |
| `(target_type, target_id)` | `AdminAuditLog` | All actions on a given entity | Low |

### Other risks

| Risk | Severity | Recommendation |
|---|---|---|
| `Invoice.amount_outstanding` drift | **High** | Resolved by dropping the column (N1) |
| SQLite vs Postgres | **High** | Postgres via Docker from day one. SQLite type coercions mask bugs that surface in prod |
| Signed URL per download (R2/S3 API call per click) | Low now | At scale: cache signed URL in edge KV with TTL slightly under 15 min |
| `Attendance` concurrent save duplicates | Medium | `@@unique` constraint required in schema |
| `MOCK_USER_STATS` hand-maintained | Low | Phase 4 replaces with `prisma.user.count({ where: { role: 'student' } })` |

---

## 10. Module Coupling

### Cross-domain mock data leaks

| Export | Source file | Problem |
|---|---|---|
| `MOCK_SECTION_LECTURER_IDS` | `mock-posts.ts` | TeachingAssignment data exported from post file — consumed by timetable, academic, admin/sections pages |
| `MOCK_LECTURER_NAMES` | `mock-posts.ts` | Only lec-001…004; missing lec-005 (Dr. Sarah Tan) |
| `MOCK_TEACHING_ASSIGNMENTS` | `mock-admin.ts` | **Canonical source** (centralized, correct) |

`MOCK_SECTION_LECTURER_IDS` in `mock-posts.ts` is the remaining cross-domain leak. Do not add more consumers. It disappears in Phase 4 when the DB query returns lecturer names via join.

### apiFetch coupling boundary

`apiFetch()` has call edges to all three service namespaces (`studentService`, `lecturerService`, `adminService`). This is correct. Services must stay as pure data functions — do not import UI components from service files or vice versa.

### ClassPostPanel and ResourceManager share type, differ in rules

Lecturer writes (pin/edit/delete) and student reads (isPublished filter) share `ClassPost` but have independent rendering and query logic. This is correct. Phase 4 Prisma queries must be role-separated — **never pass unfiltered posts to a student component and rely on the client to filter `isPublished`**. The filter must be in the Prisma `where` clause.

---

## 11. Prioritized Action List

### Before writing schema.prisma (Phase 4 day 1)

1. Remove `Announcement` table from `database-schema.md` ✅ (done in this review)
2. ✅ Drop `Invoice.amount_outstanding` column — compute via Prisma `_sum` (decision recorded in `database-schema.md`; field annotated mock-era-only in `types/financial.ts`, session 23)
3. Add `@@unique([storageKey])` to `ResourceAttachment`
4. Add `@@unique([studentId, courseSectionId, date])` to `Attendance`
5. ✅ Add `session_version Int @default(1)` to `User` — added to `database-schema.md` User table, session 23
6. Add all 8 indexes from §9 at schema creation time
7. ✅ Create `types/academic.ts` — `Course`, `CourseSection`, `Semester`, `Programme`, `PastSemesterCourse`, `PastSemesterDetail` moved from `types/student.ts` + `data/mock-results.ts`; 7 consumer imports updated (session 23)
8. ✅ `ClassPost.isPinned` / `isPublished` — non-optional `boolean` in `types/post.ts` (session 22; was `isPublished?: boolean` after session 16, now fully non-optional)
9. ✅ `attachments?: ResourceAttachment[]` added to `LearningResource` in `types/resource.ts` — optional, session 22
10. ✅ Use Postgres via Docker — `docker-compose.yml` (Postgres 16-alpine) + `.env.local` created in `app/` (session 23; `.env.local` gitignored)

### Before writing Auth.js config (Phase 5)

11. `jwt` callback: fail hard if `Student`/`Lecturer` profile row missing — let `findUniqueOrThrow` propagate ✅ (added to `auth-flow.md`)
12. Fix middleware route patterns: `/resources/**` → `/classes/**` ✅ (corrected in `auth-flow.md`)
13. Embed `session_version` in JWT; validate against DB in middleware on every request ✅ (documented in `auth-flow.md`)

### Before wiring client components to real routes (Phase 4 → Phase 5 boundary)

14. ✅ `apiFetch` hardened: `ApiError` class, `apiUpload` multipart helper, `AbortSignal` (session 18)
15. ✅ `uploadResource` uses `apiUpload` — no raw `fetch` (session 18)
16. ✅ `studentService` URL paths corrected: `/api/student/classes/` (session 16)
17. Add ClassPost methods to `lecturerService` and `studentService`

### Before writing Phase 6 API handlers

18. IDOR guard on download: verify `attachment.resource.courseSectionId === params.sectionId` before signed URL ✅ (in `security-notes.md`)
19. `uploaded_by` check on PATCH/DELETE: verify `resource.uploadedBy === session.user.lecturerId` after TeachingAssignment ✅ (in `security-notes.md` and `api-routes.md`)
20. `AddDropRequest` approval in `$transaction` with capacity check ✅ (in `api-routes.md`)
21. `ClassPost` isPublished filter in Prisma `where` clause — never client-side ✅ (in `security-notes.md`)

---

## Highest-Risk Items (summary)

| Item | If missed |
|---|---|
| `uploaded_by` check on resource/post PATCH+DELETE | Co-assigned lecturers mutate each other's content |
| IDOR attachment guard on download | Student in section A downloads section B files |
| `Invoice.amount_outstanding` stored field | Financial totals drift after every payment |
| `Announcement` table in Prisma schema | Split post system, ambiguous admin write path |
| `StudentSectionEnrollment` status='enrolled' filter | Dropped students access resources indefinitely |
| `session_version` in `schema.prisma` (Phase 4) + JWT embed (Phase 5) | Role change takes effect only after session expires (up to 24h) |
| `ClassPost.isPublished` filter server-side | Draft posts visible to students |
| Postgres from day one | SQLite masks type-coercion and concurrency bugs that fail in prod |
