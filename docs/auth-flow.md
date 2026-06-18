# Auth Flow

---

## Authentication Stack

- **Auth.js v5 (NextAuth)** — session management, CSRF protection, DB adapter
- **bcrypt** — password hashing (cost factor 12)
- **PostgreSQL** — session store via Prisma adapter
- **Next.js Middleware** — route protection before any page or API handler runs

> **Graphify finding:** The graphify knowledge graph extracted two high-cohesion communities (0.67) — "Security: Auth Hardening" and "Middleware & Session Guard" — confirming that the auth and middleware design is tightly scoped and well-organized. The hyperedge connecting Auth.js + Middleware + Role-Based Redirect + Session Validation was confirmed at 1.00 confidence: these four pieces form a single indivisible auth gate. Weakening any one of them breaks the entire protection model.

---

## Login Flow

```
User visits any URL
      │
      ▼
Next.js Middleware
  ├─ Has valid session? ──Yes──► Route to page
  └─ No session ──────────────► Redirect to /login?callbackUrl=<original>

/login page renders
      │
User submits identifier + password
      │
      ▼
POST /api/auth/[...nextauth]  (Auth.js CredentialsProvider)
      │
Auth.js calls authorize():
  1. If identifier contains '@': Query User WHERE email_institutional = $1 AND role = STUDENT AND is_active = true
     Else: Query User WHERE username = $1 AND is_active = true (role must not be STUDENT)
  2. bcrypt.compare(password, user.password_hash)
  3. On failure → return null → Auth.js returns 401 → UI shows error
  4. On success → return { id, email, role }
      │
      ▼
Auth.js creates session:
  - JWT or DB session (DB session recommended for invalidation support)
  - Stores { userId, role } in session
  - Sets httpOnly, SameSite=Lax, Secure cookie
      │
      ▼
Redirect to callbackUrl (defaults to /dashboard)
```

---

## SessionUser Population (JWT Callback)

`SessionUser` carries `studentId?` and `lecturerId?` alongside `role`. These must be populated at session creation — API handlers rely on them to perform authorization DB queries without a separate lookup on every request.

```typescript
// in auth.ts callbacks.jwt
async jwt({ token, user }) {
  if (user) {
    token.role = user.role
    if (user.role === 'student') {
      const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id } })
      token.studentId = student.id
    }
    if (user.role === 'lecturer') {
      const lecturer = await prisma.lecturer.findUniqueOrThrow({ where: { userId: user.id } })
      token.lecturerId = lecturer.id
    }
    // Embed session version for role-change invalidation (see below)
    token.sessionVersion = user.sessionVersion
  }
  return token
}

// in auth.ts callbacks.session
async session({ session, token }) {
  session.user.role = token.role
  session.user.studentId = token.studentId   // undefined for non-students
  session.user.lecturerId = token.lecturerId // undefined for non-lecturers
  session.user.sessionVersion = token.sessionVersion
  return session
}
```

If `findUniqueOrThrow` throws, it means the User record exists but the profile row (Student/Lecturer) does not — this indicates a broken seed or incomplete user creation. **Let the error propagate; do not swallow it.** A silent failure here means downstream API handlers receive `undefined` for `studentId`/`lecturerId` and fail with a type error at runtime rather than a clear 500 at login time.

---

## Role-Change Session Invalidation

When an admin changes a user's role, the user's active session still holds the old role. To force re-login on role change:

1. Add `session_version Int @default(1)` to the Prisma `User` model. **Add this before Phase 4 seeding — adding it via migration after users exist requires a default value and a data migration.**
2. Embed `session_version` in the JWT (see callback code above — already shown as `token.sessionVersion`).
3. In `middleware.ts`, after decoding the token, query `User.session_version` and compare. Mismatch → `redirect('/login')`.
4. When admin changes a user's role, increment `User.session_version` in the same DB transaction as the role update.

This requires one DB read per protected request in middleware. Use edge-compatible caching (or accept the read) — this is the correct trade-off for a secure role model.

---

## Role-Based Redirect After Login

```typescript
// in auth.ts callbacks.redirect
if (role === 'admin') return '/admin'
if (role === 'lecturer') return '/lecturer'
return '/dashboard'  // student
```

---

## Session Validation (Every Request)

### Pages (Middleware)

`middleware.ts` runs before every request to protected routes:

```
Request hits /dashboard (or any protected route)
      │
middleware.ts:
  1. getToken(req) — reads session JWT from cookie
  2. No token? → redirect to /login
  3. Token present → check token.role
  4. Wrong role for this route? → redirect to /unauthorized
  5. Correct role → pass through to page handler
```

**Protected route patterns:**
```
/dashboard/**         → student only
/academic/**          → student only
/timetable/**         → student only
/financial/**         → student only
/classes/**           → student only   ← route is /classes, not /resources
/feedback/**          → student only
/profile/**           → student only   ← student profile only; other roles have /lecturer/profile, /admin/profile
/lecturer/**          → lecturer only
/admin/**             → admin only
/api/student/**       → student only
/api/lecturer/**      → lecturer only
/api/admin/**         → admin only
```

### API Routes (Double-check)

Middleware handles coarse routing, but every API route handler independently validates the session:

```typescript
// Example pattern used in every API route
const session = await auth()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
if (session.user.role !== 'student') return Response.json({ error: 'Forbidden' }, { status: 403 })
```

This is defense-in-depth — middleware can be bypassed by misconfig, so the API layer must not trust it blindly.

---

## Implementation Status (Post-Phase 5 + Codex Hardening)

> Full findings and status in `docs/auth-rbac-review.md`. All M and S findings are now closed.

### Current implementation matches the designed flow

**Middleware gate (M1, M2 — closed):** `src/proxy.ts` IS the middleware file for Next.js 16 Turbopack (the `proxy.ts` naming convention replaces `middleware.ts` — having both is a build error). The `proxy` function runs on every protected route, enforces student-only / lecturer-only / admin-only role checks, and sets `x-invoke-path` header for layout-level defense-in-depth. Role-to-route enforcement is consistent across all three layers.

**Page guards (M3 — closed):** All 7 lecturer pages and all 6 admin pages now open with `auth()` + role + profile-ID guard before any render or data fetch.

**`sessionVersion` + `isActive` revalidation (S1/S2 — closed):** Implemented in two places:
1. `(portal)/layout.tsx` — one `prisma.user.findUnique({ select: { isActive, sessionVersion } })` per page render.
2. `lib/session-guard.ts` — `getValidatedSession()` runs the same check before every Server Action mutation, ensuring stale JWTs cannot invoke writes even when the layout is bypassed.

```ts
// How it works in layout.tsx and session-guard.ts:
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isActive: true, sessionVersion: true },
})
if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== session.user.sessionVersion) {
  redirect('/login')
}
```

### Remaining open items (nice-to-have)

- **N3:** `findUniqueOrThrow` in the JWT callback returns a 500 on missing profile row instead of "Invalid credentials." Phase 6 fix: swap to `findUnique + return null`.
- **N4:** `sessionVersion` is still surfaced in the client session object. Remove after the admin role-change surface ships.
- **N5:** No `line-clamp` on feedback body in a future admin view.

### `findUniqueOrThrow` in JWT callback lacks error handling (N3 — nice to have)

The SessionUser Population section above notes "let the error propagate." However, a `P2025` here produces a 500 on the login API route rather than a clean auth rejection. Replace with `findUnique` + `return null` to keep the login API returning a structured 401.

---

## Forgot Password Flow

```
User clicks "Forgot Password" on login page
      │
      ▼
/forgot-password page
User enters email address
      │
POST /api/auth/forgot-password
  1. Look up User by email (institutional or personal)
  2. Always return 200 (prevent email enumeration)
  3. If user found: generate crypto.randomUUID() reset token
  4. Store hashed token + expiry (15min) in DB
  5. Send email with reset link: /reset-password?token=<raw_token>
      │
User clicks email link
      │
/reset-password?token=...
  1. Validate token: hash it, look up in DB, check expiry
  2. If invalid/expired → show error, link to /forgot-password
  3. If valid → show new password form
      │
POST /api/auth/reset-password
  1. Validate token again (race condition protection)
  2. bcrypt.hash(newPassword, 12)
  3. Update user.password_hash
  4. Delete reset token from DB
  5. Optionally invalidate all existing sessions for this user
  6. Redirect to /login with success message
```

---

## Session Expiry

- Default session duration: **24 hours** (configurable in auth.ts `session.maxAge`)
- Rolling sessions: disabled by default (session does not auto-extend on activity)
- On expiry: next protected page visit triggers middleware → redirect to /login

---

## Logout Flow

```
User clicks Logout in UserMenu
      │
POST /api/auth/signout  (Auth.js built-in)
  1. Auth.js deletes DB session record
  2. Clears session cookie
  3. Redirect to /login
```

---

## Security Properties

| Property | Implementation |
|---|---|
| Passwords never stored plaintext | bcrypt with cost factor 12 |
| Session token in httpOnly cookie | XSS cannot steal session |
| SameSite=Lax | CSRF protection for navigational requests |
| CSRF token | Auth.js includes CSRF token for POST requests |
| Role stored in JWT/session | Verified server-side on every API call |
| Session invalidation | DB sessions can be deleted (force logout) |
| Reset tokens hashed in DB | Token theft from DB leaks are useless |
| Email enumeration prevented | Forgot-password always returns 200 |
| Rate limiting on /api/auth/login | Prevent brute force (middleware or edge config) |
