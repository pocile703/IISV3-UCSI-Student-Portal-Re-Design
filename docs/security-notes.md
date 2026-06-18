# Security Notes

---

## Access Control Architecture

The single most critical security requirement of this system is **server-side authorization enforcement** for learning resources. Both the Lecturer upload restriction and the Student access restriction must be verified in the database — never inferred from client-supplied data.

> **Graphify confirmation:** The graphify knowledge graph extracted a hyperedge (confidence 1.00) connecting `TeachingAssignment`, `StudentSectionEnrollment`, and `Server-Side Authorization` as a unified access-control primitive. These three nodes cannot be separated — weakening any one of them breaks the security model for the entire Learning Resources module.

### Lecturer Resource Authorization

Before processing any resource upload, edit, or delete:

```typescript
const assignment = await prisma.teachingAssignment.findFirst({
  where: {
    lecturerId: session.user.lecturerId,
    courseSectionId: params.sectionId,
  },
})
if (!assignment) return Response.json({ error: 'Forbidden' }, { status: 403 })
```

The `sectionId` comes from the URL. The `lecturerId` comes from the session — **never from the request body**.

### Student Resource Authorization

Before serving any resource metadata or file:

```typescript
const enrollment = await prisma.studentSectionEnrollment.findFirst({
  where: {
    studentId: session.user.studentId,
    courseSectionId: params.sectionId,
    status: 'enrolled',
  },
})
if (!enrollment) return Response.json({ error: 'Forbidden' }, { status: 403 })
```

Dropped students (`status: 'dropped'`) lose access immediately.

### IDOR Guard on File Download

The enrollment check above is necessary but not sufficient for the download endpoint. A student enrolled in section A could request `attachmentId` belonging to section B by substituting the `sectionId` URL param. Always verify the attachment belongs to the asserted section before generating a signed URL:

```typescript
// GET /api/student/classes/[sectionId]/download/[attachmentId]
const attachment = await prisma.resourceAttachment.findUniqueOrThrow({
  where: { id: params.attachmentId },
  include: { resource: true },
})
// IDOR guard — attachment must belong to the section the student is enrolled in
if (attachment.resource.courseSectionId !== params.sectionId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
// Also enforce published state — don't serve drafts
if (!attachment.resource.isPublished) {
  return Response.json({ error: 'Not found' }, { status: 404 })
}
```

### isPublished Filter Must Be Server-Side

`ClassPost.isPublished` and `LearningResource.isPublished` control draft vs live content. These filters must appear in the Prisma `where` clause on the server — never rely on the client to filter unpublished items from a full response:

```typescript
// CORRECT — draft posts never reach the client
await prisma.classPost.findMany({
  where: { courseSectionId, isPublished: true },
  orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
})

// WRONG — full list returned, client filters; drafts exposed to network inspection
const all = await prisma.classPost.findMany({ where: { courseSectionId } })
return all.filter(p => p.isPublished)
```

Applies to every student-role route that returns posts or resources.

### Lecturer Mutation Authorization (uploaded_by check)

`TeachingAssignment` authorizes a lecturer to work within a section, but it does not prevent a co-assigned lecturer from mutating another lecturer's resources or posts. PATCH and DELETE operations must additionally verify ownership:

```typescript
// For resources — uploadedBy → Lecturer.id → compare with session.user.lecturerId
const resource = await prisma.learningResource.findUniqueOrThrow({ where: { id: params.resourceId } })
if (resource.uploadedBy !== session.user.lecturerId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

// For posts — authorId → User.id → compare with session.user.id (NOT lecturerId)
const post = await prisma.classPost.findUniqueOrThrow({ where: { id: params.postId } })
if (post.authorId !== session.user.id) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

Read operations (GET list, GET detail) do not need this check — any lecturer assigned to the section may read all content in it.

---

## Authentication Security

### Password Handling
- All passwords hashed with **bcrypt**, cost factor 12
- Plaintext passwords never logged, stored, or returned
- Password minimum length: 8 characters, enforced server-side (Zod schema)

### Session Cookies
- `httpOnly: true` — JavaScript cannot read the session cookie
- `secure: true` in production — HTTPS only
- `sameSite: 'lax'` — prevents cross-origin form POST CSRF
- Auth.js adds CSRF token for state-changing Auth.js actions

### Brute Force Prevention
- Rate limit `/api/auth` endpoints: max 10 attempts per IP per 15 minutes
- Implement at edge (Cloudflare WAF, Vercel Edge Middleware, or `rate-limiter-flexible`)
- After 5 failed attempts: add artificial delay (exponential backoff)

---

## File Upload Security

File uploads for learning resources are a significant attack surface.

### MIME Type Validation (Server-Side)
Never trust the Content-Type header. Use file signature (magic bytes) inspection:

```typescript
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'application/zip',
])
```

### File Size Limit
- Per-file maximum: 100MB (enforced before reading the stream)
- Total request body: 110MB (Next.js `bodyParser` limit config)

### Storage Isolation
- Files stored in **private** S3/R2 bucket — no public access
- Object keys are namespaced: `resources/{sectionId}/{resourceId}/{uuid}-{filename}`
- Filenames sanitized: strip path traversal characters, normalize encoding

### Signed URL Download
- Download URLs are signed with 15-minute expiry
- The download endpoint re-validates enrollment before generating the signed URL
- Signed URLs include a content-disposition header to prevent inline execution of unexpected types

### No Execution
- Uploaded files are never executed server-side
- HTML and JavaScript files are not in the allowed MIME whitelist (prevents stored XSS via file download)

---

## Client-Side API Client Hardening ✅

`services/api.ts` exports `ApiError` (carries `status: number`) and `apiUpload<T>` (multipart helper with optional `AbortSignal`, does not set `Content-Type` so the browser sets the multipart boundary). `lecturerService.uploadResource` uses `apiUpload`. Callers pattern-match on `err.status` — `401` → redirect to `/login`, `403` → permission error UI, `422` → field validation errors. Completed in session 18.

---

## Injection Prevention

### SQL Injection
- All DB queries go through **Prisma ORM** — parameterized queries only
- Raw SQL (`prisma.$queryRaw`) only used with `Prisma.sql` template tag (safe interpolation)
- Never concatenate user input into SQL strings

### XSS
- React escapes all dynamic content by default (no `dangerouslySetInnerHTML` except in vetted rich-text rendering)
- Rich text (feedback body, announcements): sanitize with `DOMPurify` server-side before storage, and again before render
- Content-Security-Policy header set to restrict script sources

### CSRF
- Auth.js handles CSRF token for auth-related forms
- For other POST/PATCH/DELETE routes: Next.js App Router uses SameSite=Lax + origin checks
- Sensitive state-changing API calls check `Origin`/`Referer` header matches the app domain

---

## Data Exposure

### Over-fetching Prevention
- API routes return only the fields needed for the calling client
- Financial data (invoices, payments): only returned for the authenticated student's own records
- Academic results: only returned if `is_published = true` (or admin/lecturer role for their section)
- Student personal data: never returned to lecturer-role requests

### No Sensitive Data in Client State
- Role stored in session (httpOnly cookie) — not in localStorage or Zustand
- Payment reference numbers: returned in full only when explicitly requesting invoice detail
- Passwords: never returned in any API response even as `undefined`

---

## Infrastructure

### Environment Variables
- Database URL, Auth.js secret, R2/S3 credentials: stored as environment variables
- Never committed to version control
- `AUTH_SECRET` rotated if compromised — all sessions invalidated
- `.env` added to `.gitignore`

### Error Messages
- API errors return generic messages in production: `{ error: "Internal server error" }`
- Detailed error info in server logs only (never exposed to client)
- The legacy portal's `v1.202106` version number in the footer is removed — no version disclosure

### HTTPS
- Production deployment must enforce HTTPS
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Role Escalation Prevention

- Role is stored in the DB on the `User` record and read at session creation
- Clients cannot change their role by modifying a cookie or request header
- Role changes (admin escalation) require an admin to update the DB record, which forces the affected user to re-login for the new session to reflect it

---

## Phase 5 Auth.js + RBAC — Identified Gaps

> Full analysis in `docs/auth-rbac-review.md`. Summary of actionable items here.

### Must Fix Before Mutations

**M1 — `src/middleware.ts` is missing.**  
`src/proxy.ts` has the route-guard logic but Next.js only loads `middleware.ts`. Without it, any authenticated user can reach any route — the portal layout only checks `if (!session)`, not role. One-line fix: `export { proxy as middleware, config } from './proxy'`.

**M2 — Portal layout is role-agnostic.**  
`(portal)/layout.tsx` passes any authenticated session regardless of role. Even with M1 fixed, a middleware bypass would grant full cross-role access. Phase 6 layout split (student / lecturer / admin groups) resolves this structurally.

**M3 — Lecturer and admin pages have no `auth()` call.**  
Student pages all guard with `auth()` + `if (!studentId) redirect('/login')`. Every lecturer/admin page omits this entirely. When Phase 6 adds live Prisma queries, these pages will serve real data to any authenticated user. Pattern required before each Phase 6 page migration:
```ts
const session = await auth()
const lecturerId = session?.user?.lecturerId
if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')
```

**M4 — No `TeachingAssignment` + ownership verification pattern exists.**  
The schema documents the two-gate model but no code implements it. Establish the canonical guard before writing any Phase 6 Server Action (see `docs/auth-rbac-review.md` § M4 for the code pattern). The two identifier spaces must not be confused: `TeachingAssignment.lecturerId → Lecturer.id = session.user.lecturerId`; `LearningResource.uploadedBy → Lecturer.id = session.user.lecturerId`; `ClassPost.authorId → User.id = session.user.id`.

**M5 — thecn Server Actions lack an explicit role assertion.**  
Both profile actions guard on `if (!studentId)` / `if (!lecturerId)` but not `session.user.role`. Admin users (who have neither profile ID) hit a Prisma runtime error rather than a clean redirect. Fix: assert role as the first check.

### Should Fix Soon

**S1 — `sessionVersion` not validated against DB.**  
Embedded in JWT at login but `proxy.ts` defers the per-request DB check to Phase 6. Admin role changes do not terminate active sessions; the old-role JWT remains valid for up to 24 hours.

**S2 — `isActive` not re-checked after login.**  
`authorize()` filters `isActive: true` at sign-in, but existing JWTs for deactivated users stay valid until expiry. Resolved by the same DB query as S1.

**S3 — `callbackUrl` not validated as a relative URL.**  
The `proxy.ts` construction (`pathname + search`) is safe, but confirm Auth.js `AUTH_URL` is set in production and no custom redirect logic follows `callbackUrl` verbatim.

**S4 — Lecturer `sectionId` params validated against mock allowlist.**  
`MOCK_LECTURER_SECTION_IDS.includes(sectionId)` is a placeholder. Must be replaced with a `TeachingAssignment` DB lookup in Phase 6 (M4 pattern). Add a `// TODO Phase 6` comment at both call sites now.

**S5 — `submitFeedback` returns error object on missing session.**  
All other Server Actions `redirect('/login')`. This one returns `{ status: 'error', message: '...' }`. Inconsistent session-expiry behaviour.

**S6 — Feedback `body` has no max length.**  
`subject` has `.max(255)`; `body` has only `.min(1)`. Add `.max(5000)`.

---

## Audit Considerations

- Financial transaction records (`Invoice`, `Payment`) must not be deletable — soft-status only (`status = 'cancelled'`)
- Resource upload events and download events should be logged (who, what, when) for academic integrity purposes — `ResourceAttachment.download_count` covers download tracking; upload logging goes via `LearningResource.created_at` + `uploaded_by`
- Auth failures logged with IP and timestamp (server-side only)
- Admin actions (user creation, role change, enrollment change) should be auditable via `AdminAuditLog` table — schema defined in `docs/database-schema.md`

### AdminAuditLog Events to Capture

| Event | `action` value |
|---|---|
| User created | `user.create` |
| User role changed | `user.role_change` |
| User deactivated | `user.deactivate` |
| Password reset forced | `user.password_reset` |
| TeachingAssignment created | `assignment.create` |
| TeachingAssignment deleted | `assignment.delete` |
| StudentSectionEnrollment created | `enrollment.create` |
| StudentSectionEnrollment status changed | `enrollment.status_change` |
| Resource unpublished by admin | `resource.unpublish` |
| Resource deleted by admin | `resource.delete` |
