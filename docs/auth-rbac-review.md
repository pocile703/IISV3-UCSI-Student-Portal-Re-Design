# Auth.js + RBAC Security Review

**Reviewed:** 2026-05-28 (session 40)  
**Scope:** Post-Phase 5 static analysis — no mutations implemented yet. All findings are pre-emptive.  
**Method:** Code inspection of `src/proxy.ts`, `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts` (absent), `(portal)/layout.tsx`, all student pages, all Server Actions, all lecturer/admin pages, `schema.prisma`, `types/next-auth.d.ts`.

---

## Summary

Phase 5 (Auth.js v5 + RBAC) is functionally complete for the student role. The JWT callback, session propagation, and per-page `auth()` guards on all 7 student pages are correct. The three existing Server Actions (`submitFeedback`, `updateStudentThecnUsername`, `updateLecturerThecnUsername`) are correctly scoped to the session owner.

**Critical structural gaps exist in the middleware and in the lecturer/admin layer.** These do not expose live data today (lecturer and admin pages are still on mock data), but they will directly enable cross-role mutations in Phase 6 if not fixed first.

---

## 1. Must Fix Before Mutations

---

### M1 — `src/middleware.ts` does not exist (all edge-layer route protection is dead)

> ✅ **Resolved (session 40 + Codex pass).** `src/proxy.ts` IS the middleware in Next.js 16 Turbopack — the framework loads it directly under the `proxy.ts` naming convention. **Do NOT create `middleware.ts`** — having both files present causes a hard build error (`middleware-to-proxy`). The `proxy` function export + `config` matcher are active and running on every protected request.

**Original finding (preserved for context):** `proxy.ts` contained the correct logic but Next.js 13–15 required the file to be named `middleware.ts`. Next.js 16 Turbopack changed this to `proxy.ts`. The original one-line fix (`export { proxy as middleware, config } from './proxy'`) is now obsolete and would break the build.

**Current state:**
- All protected routes intercepted by `proxy.ts` (student-only / lecturer-only / admin-only role checks).
- `x-invoke-path` header set on every pass-through for layout-level defense-in-depth.
- All 7 lecturer pages + all 6 admin pages have explicit `auth()` + role + profile-ID guards (M3 closed alongside).
- `isActive` + `sessionVersion` re-validated per request in `(portal)/layout.tsx` and per mutation in `lib/session-guard.ts`.

---

### M2 — Portal layout is role-agnostic (no role-to-route enforcement)

**Priority: Fix alongside M1.**

`(portal)/layout.tsx`:
```ts
const session = await auth()
if (!session) redirect('/login')
const role = (session.user.role ?? 'student') as Role  // see also N2
```

It checks session existence but not whether the role matches the route prefix. Even with M1 fixed (middleware restored), defense-in-depth requires the layout to also enforce role boundaries. A middleware bypass — misconfigured matcher, a new route group not added to the matcher list, or a Next.js routing edge case — would otherwise grant any authenticated user full cross-role access.

**Fix pattern:** Split the portal into three layout groups — `(student)/layout.tsx`, `(lecturer)/layout.tsx`, `(admin)/layout.tsx` — each enforcing its own role check. This is the correct Phase 6 architecture anyway. Alternatively, derive the expected role from the path inside the single shared layout and redirect mismatches.

---

### M3 — Lecturer and admin pages have no server-side session guard

> ✅ **Resolved (session 40).** All 7 lecturer pages and all 6 admin pages now open with `auth()` + role + profile-ID guard. The fix pattern below matches what is deployed.

All 7 student pages follow:
```ts
const session = await auth()
const studentId = session?.user?.studentId
if (!studentId || session.user.role !== 'student') redirect('/login')
```

**All lecturer and admin pages now implement the same pattern:**
```ts
// Lecturer pages:
const session = await auth()
const lecturerId = session?.user?.lecturerId
if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

// Admin pages:
const session = await auth()
if (session?.user?.role !== 'admin') redirect('/login')
```

For any new Phase 6 page: add this guard as the FIRST statement, before any data fetch or render.

---

### M4 — No `TeachingAssignment` + ownership verification pattern exists before Phase 6 mutations

**Priority: Establish the pattern before writing any Phase 6 Server Action.**

The schema documents the authorization model:
> `TeachingAssignment` is the authorization gate for all lecturer mutations on a section.  
> `uploadedBy` / `authorId` must additionally be checked on PATCH/DELETE.  
> These are **different identifier spaces**: `TeachingAssignment.lecturerId → Lecturer.id = session.user.lecturerId`; `LearningResource.uploadedBy → Lecturer.id = session.user.lecturerId`; `ClassPost.authorId → User.id = session.user.id`.

No code implements either check yet. Co-assigned lecturers can mutate each other's resources and posts without the double-gate in place.

**Canonical guard to establish before any write action:**
```ts
// Gate 1 — lecturer is assigned to this section
const assignment = await prisma.teachingAssignment.findUnique({
  where: {
    lecturerId_courseSectionId: { lecturerId: session.user.lecturerId, courseSectionId },
  },
})
if (!assignment) return { error: 'Unauthorized' }

// Gate 2 — caller owns the resource/post (PATCH/DELETE only)
// uploadedBy → Lecturer.id → compare with session.user.lecturerId
if (resource.uploadedBy !== session.user.lecturerId) return { error: 'Forbidden' }
// authorId → User.id → compare with session.user.id (different identifier space from uploadedBy)
if (post.authorId !== session.user.id) return { error: 'Forbidden' }
```

---

### M5 — thecn Server Actions lack an explicit role assertion

**Priority: Fix before Phase 6.**

`updateStudentThecnUsername` guards with:
```ts
if (!studentId) redirect('/login')
```
It does not assert `session.user.role === 'student'`. `updateLecturerThecnUsername` is symmetric. Today this is self-enforcing — students have no `lecturerId`, lecturers have no `studentId`. Two failure modes:

1. Admin users (who have neither profile ID) can invoke either action without triggering the redirect, hitting a Prisma `where: { id: undefined }` runtime error rather than a clean rejection.
2. If the JWT shape ever changes (e.g., admin gets all profile IDs for a moderation tool), the role barrier disappears silently.

**Fix:** First assertion in every Server Action:
```ts
if (!studentId || session.user.role !== 'student') redirect('/login')
```

---

## 2. Should Fix Soon

---

### S1 — `sessionVersion` is in the JWT but is never validated against the DB

`User.sessionVersion` is fetched at login and embedded in the JWT (confirmed in `auth.ts` jwt callback and `types/next-auth.d.ts`). `proxy.ts` line 1 defers this explicitly: `// No Prisma calls here — sessionVersion DB check deferred to Phase 6.`

Until this check lands, incrementing `sessionVersion` (the designed mechanism for admin role changes to force re-login) has no effect. A user whose role was changed or who was deactivated after login retains their old JWT role for up to 24 hours.

**Impact:** Medium. An admin demotes a lecturer to student; the ex-lecturer retains lecturer-role JWT and can continue to access lecturer routes and mark attendance for 24 hours.

**Fix (in middleware, Phase 6):**
```ts
const dbUser = await prisma.user.findUnique({
  where: { id: token.sub },
  select: { isActive: true, sessionVersion: true },
})
if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== token.sessionVersion) {
  return NextResponse.redirect(new URL('/login', req.url))
}
```
This also resolves S2 — both checks are in the same query.

---

### S2 — `isActive` is checked at login only, not on subsequent requests

`authorize()` filters `where: { isActive: true }` so disabled accounts cannot sign in. But an account disabled after login retains a valid JWT until expiry (24 hours). The middleware performs no `isActive` re-check.

**Fix:** Same query as S1 — include `isActive: true` in the per-request DB check. One query covers both.

---

### S3 — `callbackUrl` in the middleware redirect is not validated as a relative URL

✅ **Resolved.** `proxy.ts` now routes the value through an inline `safeCallback()` guard (edge-safe, no imports) before setting the query param — it rejects any non-`/` prefix and protocol-relative `//` paths, falling back to `/dashboard`. This mirrors `getSafeCallbackUrl()` in `LoginPageClient.tsx`, so both the writer (proxy) and the consumer (login client) sanitise independently (defense-in-depth).

```ts
loginUrl.searchParams.set('callbackUrl', safeCallback(`${nextUrl.pathname}${nextUrl.search}`))
```

The `pathname` + `search` of a request to the app origin is already relative, so the original construction was safe in practice; the guard closes the gap defensively and keeps the proxy consistent with the client validation. (Auth.js v5 additionally validates `callbackUrl` against `AUTH_URL`.)

---

### S4 — Lecturer `sectionId` route params are validated against a hardcoded mock allowlist

`/lecturer/resources/[sectionId]` and `/lecturer/attendance/[sectionId]` validate the param with:
```ts
if (!MOCK_LECTURER_SECTION_IDS.includes(sectionId)) redirect('/lecturer/resources')
```

This is the **only** authorization gate for those routes. When Phase 6 migrates these pages to DB queries, if this check is not replaced with a `TeachingAssignment` DB lookup, any authenticated lecturer can access any section by guessing a UUID.

**Action now:** Add a comment at both call sites:
```ts
// TODO Phase 6: replace with TeachingAssignment DB check (M4 pattern)
// prisma.teachingAssignment.findUnique({ where: { lecturerId_courseSectionId: { lecturerId, courseSectionId: sectionId } } })
```

**Fix when migrating (Phase 6):**
```ts
const assignment = await prisma.teachingAssignment.findUnique({
  where: { lecturerId_courseSectionId: { lecturerId, courseSectionId: sectionId } },
})
if (!assignment) redirect('/lecturer/resources')
```

---

### S5 — `submitFeedback` returns an error object on missing session instead of redirecting

```ts
if (!studentId) return { status: 'error', message: 'You must be signed in to submit feedback.' }
```

Every other Server Action calls `redirect('/login')` on a missing session. The inconsistency means an expired session shows an in-form error instead of re-authenticating, degrading UX and breaking the session-expiry contract.

**Fix:**
```ts
if (!studentId) redirect('/login')
```

---

### S6 — Feedback `body` field has no maximum length validation

```ts
body: z.string().min(1, 'Details are required')
// missing: .max(5000) or similar
```

`subject` already has `.max(255)`. Without a max on `body`, any student can submit a multi-megabyte string causing a large unbounded DB write to `@db.Text`. Add `.max(5000)` (matches the UX intent of a feedback field).

---

## 3. Nice to Have

---

### N1 — `session.user.id = token.sub ?? ''` — empty string is a silent failure mode

If `token.sub` is undefined (malformed or expired token edge case), `session.user.id` becomes `''`. Any downstream `prisma.X.findUnique({ where: { id: '' } })` silently returns `null` rather than throwing, producing confusing null-checks rather than a clear auth failure.

**Fix:**
```ts
if (!token.sub) return redirect('/login')  // in session callback
session.user.id = token.sub
```

---

### N2 — Portal layout role fallback defaults to `'student'` on undefined role

```ts
const role = (session.user.role ?? 'student') as Role
```

A malformed token with no `role` claim silently renders the student navigation. Fail-closed is always correct here — an undefined role should redirect to `/login`, not assume least privilege.

---

### N3 — `findUniqueOrThrow` in the JWT callback has no try/catch

✅ **Resolved.** The `jwt` callback in `auth.ts` uses `findUnique` (not `findUniqueOrThrow`) for both the Student and Lecturer profile lookups, with null-safe handling — a missing profile row no longer throws `P2025`/500 during sign-in.

```ts
const student = await prisma.student.findUnique({ where: { userId } })
// null-safe: token fields simply remain unset rather than throwing
```

---

### N4 — `sessionVersion` is exposed to the client but has no client-side use

`session.user.sessionVersion` is surfaced to every Server Component and client session reader. It is a server-side comparison value only. Once S1's DB validation is implemented, remove it from the `session` callback return to reduce JWT surface area.

---

### N5 — No maximum length on feedback `body` allows unbounded admin view render

`feedback.body` is stored as `@db.Text` and rendered in the portal as `{fb.body}` (safe — no `dangerouslySetInnerHTML`). But a future admin "view all feedback" surface would render all bodies with no length cap. S6 solves the storage side; add `line-clamp` or a "show more" truncation pattern at the admin render layer.

---

## Findings Reference Table

**Last updated:** 2026-06-29 (S3 closed via `proxy.ts` `safeCallback`; N3 confirmed closed; N1/N4/N5 accepted for assignment scope)

| ID | Area | Risk | Status |
|----|------|------|--------|
| **M1** | `middleware.ts` missing | Cross-role page access | ✅ Closed — `src/middleware.ts` re-exports proxy |
| **M2** | Portal layout role-agnostic | Bypass on middleware failure | ✅ Closed — proxy sets `x-invoke-path`; layout enforces role-to-route |
| **M3** | Lecturer/admin pages have no `auth()` | Unguarded live mutations in Phase 6 | ✅ Closed — all 7 lecturer + 6 admin pages guarded |
| **M4** | No `TeachingAssignment` + ownership pattern | Lecturer cross-mutation | ✅ Closed — both `[sectionId]` pages use DB check; pattern documented |
| **M5** | thecn actions lack role assertion | Admin can invoke wrong-role action | ✅ Closed — all 3 Server Actions assert role explicitly |
| **S1** | `sessionVersion` not DB-validated | Role changes don't terminate sessions | ✅ Closed — layout runs `prisma.user.findUnique` per request |
| **S2** | `isActive` not re-checked post-login | Disabled accounts retain 24h access | ✅ Closed — same query as S1 covers both |
| **S3** | `callbackUrl` not validated as relative | Open redirect risk | ✅ Closed — `safeCallback()` in `proxy.ts` (writer) + `getSafeCallbackUrl()` in `LoginPageClient.tsx` (consumer) both reject non-`/` and `//` |
| **S4** | Lecturer `sectionId` uses mock allowlist | Missed replacement = IDOR in Phase 6 | ✅ Closed — both pages now use `TeachingAssignment` DB check |
| **S5** | `submitFeedback` error-not-redirect on no session | Inconsistent session-expiry UX | ✅ Closed — redirects to `/login` on missing session |
| **S6** | Feedback `body` has no max length | Unbounded DB write | ✅ Closed — `.max(5000)` added to Zod schema |
| **N1** | `token.sub ?? ''` silent empty | Silent bad state on malformed token | Accepted — layout DB check provides indirect safety; downstream `if (!userId)` guards catch the empty sentinel. No code change for assignment scope. |
| **N2** | `role ?? 'student'` fail-open | Malformed token gets student nav | ✅ Closed as side-effect of M2 — layout now fails-closed on undefined role |
| **N3** | `findUniqueOrThrow` in JWT callback | 500 on missing profile row at login | ✅ Closed — `auth.ts` jwt callback uses `findUnique` with null-safe handling |
| **N4** | `sessionVersion` exposed to client | Unnecessary JWT surface area | Accepted — it is a server-only comparison value; exposure is harmless (no secret). Trimming the `session` return is cosmetic; deferred. |
| **N5** | No feedback body length cap at admin render | Unbounded render in future admin view | Accepted — storage capped at 5000 chars (S6); a render-time `line-clamp` is only needed when an admin feedback view is built (not in scope). |
