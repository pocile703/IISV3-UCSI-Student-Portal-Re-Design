# Fix Queue — Static UI Stabilization

## Status

Fix-queue contains post-Phase-3 frontend consistency work. No backend/auth/Prisma/API items should be added here.

## Priority Order

1. Fix shared frontend consistency issues that can drift before backend work.
2. Clean up repeated static mock-data mappings and helper duplication.
3. Defer pure polish unless it reduces future integration risk.

---

## Next Queue

### Must fix now

No blocking static-UI defects currently queued.

Current verification baseline:
- `cd app && npm run lint` ✅
- `cd app && npx tsc --noEmit` ✅
- `cd app && npm run build` ✅

### Should fix before backend

No remaining "should fix before backend" items — hover sweep and `--text-muted` sweep are both complete.

1. **Keep placeholder services/hooks clearly quarantined from Phase 3 UI**
   - `app/src/services/admin.ts`
   - `app/src/services/student.ts`
   - `app/src/services/lecturer.ts`
   - `app/src/hooks/useAuth.ts`
   - `app/src/hooks/useStudent.ts`
   - Problem: these placeholders are acceptable, but they must not start leaking into static page implementations before backend/auth phases begin.
   - Expected fix: if touched, improve comments/docs only; do not wire them into pages yet.
   - Constraint: no API implementation, no auth, no DB.

### Nice to have later

1. **Extract shared admin table/action styling helpers**
   - Candidate files:
     - `app/src/app/(portal)/admin/programmes/page.tsx`
     - `app/src/app/(portal)/admin/resources/page.tsx`
     - `app/src/app/(portal)/admin/sections/page.tsx`
     - `app/src/components/admin/UserTable.tsx`
   - Problem: bordered action buttons, table captions, and mobile-hidden secondary columns are now consistent by convention but still copied page-by-page.
   - Expected fix: only extract if it stays simple and clearly reduces repetition.

2. **Unify repeated section/course display helpers**
   - Candidate files:
     - `app/src/app/(portal)/admin/resources/page.tsx`
     - `app/src/app/(portal)/admin/sections/page.tsx`
     - `app/src/components/admin/LecturerAssignmentsCard.tsx`
   - Problem: repeated local `find()`-based lookups for section labels, schedule strings, and course metadata.
   - Expected fix: shared frontend-only display helper, not a service layer.

3. **Polish overlay/menu behavior**
   - Candidate files:
     - `app/src/components/layout/NotificationBell.tsx`
     - `app/src/components/layout/UserMenu.tsx`
     - `app/src/components/layout/MobileDrawer.tsx`
   - Problem: current behavior is acceptable, but focus-return and menu/dialog polish can be improved later.
   - Expected fix: small a11y polish only; preserve current shell architecture.

### Explicit non-queue items

These are intentional scope deferrals and should not be “fixed” in this queue:
- Classes page download button is a Phase 6 stub (file storage)
- Lecturer Resources upload/edit file input is a Phase 6 stub
- Any backend/auth/Prisma/API/database implementation work

---

## Resolved (2026-05-21 session 14)

| Fix | Status | Resolved |
|---|---|---|
| `hover:bg-[--bg-elevated]` — all 10 remaining locations | ✅ Done | 2026-05-21 |
| `--text-muted` sweep continuation — all remaining profile/component files | ✅ Done | 2026-05-21 |

**Convention reinforced:** icon buttons on TopBar/content area use `hover:bg-zinc-100 dark:hover:bg-white/10`; table rows and resource item divs use `hover:bg-zinc-50 dark:hover:bg-white/5`; large clickable headers use `hover:bg-zinc-100/50 dark:hover:bg-white/5`. `FinanceDownloadButton` also had `hover:text-[--ucsi-red]` failure — fixed to `hover:text-[#C1272D]`. `--text-muted` sweep is now fully complete; `--text-secondary` covers all readable metadata across all pages and components.

---

## Resolved (2026-05-21 session 12)

| Fix | Status | Resolved |
|---|---|---|
| `ThemeToggle` React 19 lint failure (`set-state-in-effect`) | ✅ Done | 2026-05-21 |
| TopBar mobile nav button static aria-label | ✅ Done | 2026-05-21 |
| NotificationBell missing expanded/dialog semantics | ✅ Done | 2026-05-21 |
| UserMenu missing popup/menu semantics | ✅ Done | 2026-05-21 |
| Finance table missing `aria-label` / `th scope="col"` | ✅ Done | 2026-05-21 |
| Admin dashboard lecturer-assignments table missing column scopes/label | ✅ Done | 2026-05-21 |

**Convention reinforced:** shared shell fixes should stay minimal and frontend-only. Accessibility and table semantics are in scope for Phase 3; backend wiring is not.

---

## Resolved (2026-05-21 session 11)

| Fix | Status | Resolved |
|---|---|---|
| `admin/resources` flat unnavigable list | ✅ Done | 2026-05-21 |
| `admin/sections` Assign button CSS-var border failure + no cursor | ✅ Done | 2026-05-21 |
| `admin/programmes` Add Programme no hover/cursor | ✅ Done | 2026-05-21 |
| `admin/users` Add User no hover/cursor | ✅ Done | 2026-05-21 |

**Convention reinforced:** `border-[--ucsi-red]/30` fails in Tailwind v4 (CSS-var + opacity modifier). Use `border-[#C1272D]/30`. Extends the existing bg/text CSS-var failure rule to border properties. All solid-red primary buttons with inline-style bg need `cursor-pointer transition-opacity hover:opacity-90` — not Tailwind hover-bg classes.

---

## Resolved (2026-05-20 session 10)

| Fix | Status | Resolved |
|---|---|---|
| Turbopack workspace root warning | ✅ Done | 2026-05-20 |
| React 19 `<script>` in body console error | ✅ Done | 2026-05-20 |
| ThemeToggle hydration mismatch (icon/aria-label) | ✅ Done | 2026-05-20 |

---

## Patterns to carry forward

- **In-card tab pattern** — `'use client'` + `useState<Tab>`; tab buttons in `CardHeader`'s inner `flex justify-between`; active tab inline-style red bg + `text-white`; each tab view a sub-function in the same file.
- **Pure Server Component list page** — when no search/filter/sort is needed (`/admin/programmes`), keep the whole page server-rendered; placeholder `<button type="button">` with no handler is valid server-side.
- **Admin list table a11y** — `<table aria-label>`, `<th scope="col">`, status badge `aria-label="Status: …"`, action `aria-label="View {name}"`, `hidden sm:table-cell` for secondary columns.
- **Tab-scoped search** — switching tabs resets search + filters; tab count labels show unfiltered totals.
- **Summary-with-overflow cell** — `first name +N more` / bare name / `—`.
- **Server-first default** — only extract `'use client'` when tab/optimistic state is needed.
- `CardHeader` = `flex flex-col gap-1`; for title + right-aligned action: inner `<div className="flex items-center justify-between">`.
- Delete confirm: self-contained inline strip (see `AdminResourceModeration` + `DeleteResourceButton`).
