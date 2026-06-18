# Bugs & Issues

## Resolved

### shadcn init overwrote utils.ts (2026-05-18)
`npx shadcn@latest init` replaced utils.ts with a minimal cn()-only file, deleting formatRM, formatDate, and DAY_LABELS.
**Fix:** Restored all three exports while keeping the new clsx + tailwind-merge based cn().

### shadcn globals.css incompatible with plan's replacement strategy (2026-05-18)
shadcn generated globals.css using `@import "shadcn/tailwind.css"` with oklch color tokens and `@custom-variant dark (&:is(.dark *))`. The plan intended to fully replace globals.css, which would have broken shadcn component compatibility.
**Fix:** Appended UCSI tokens after shadcn's generated content instead of replacing the file.

### --color-border and --sidebar-border token name conflicts (2026-05-18)
shadcn's `@theme inline` already maps `--color-border: var(--border)` and defines `--sidebar-border` as a sidebar token. Overriding them with UCSI values would silently break shadcn utilities like `border-border`.
**Fix:** Renamed to `--ucsi-border` and `--sidebar-nav-border` throughout all components.

### DevRoleSwitcher: hooks after conditional return (2026-05-18)
Original plan code called `useLayoutContext()` after an early `if (NODE_ENV !== 'development') return null`, violating React's rules of hooks.
**Fix:** Extracted inner component `DevRoleSwitcherInner` that holds the hook; outer `DevRoleSwitcher` does the conditional render.

## Resolved (session 3 — sidebar polish + stat card spacing)

### Balance Due stat card off-centred on mobile (2026-05-18)
`StatCard` used `items-start` on its outer flex. "RM 1,580.00" (`text-xl`, ~10 chars) wraps to 2 lines at 375px viewport in a 2-col grid (only ~72px text area available). This made that grid row taller, causing the Notifications card ("3") to sit top-anchored with empty space below — both cards looked misaligned.
**Fix:** `items-start` → `items-center` on the outer flex div; value font `text-xl` → `text-lg sm:text-xl` (prevents wrap at mobile, scales back up at sm).

### NavGroup section label invisible on dark sidebar (2026-05-18)
"STUDENT" / "LECTURER" / "ADMIN" group labels used `text-[--text-muted]` (CSS variable). In light OS mode the variable resolves to `#a1a1aa`, but CSS variable resolution can fail silently on always-dark surfaces when cascade order is unexpected, making the label render at an unreadable color.
**Fix:** `text-[--text-muted]` → `text-zinc-400` (Tailwind utility, same defensive pattern as NavItem inactive text). Guaranteed to resolve.

### Sidebar hover state: arbitrary opacity syntax unreliable in Tailwind v4 (2026-05-18)
Changed hover to `bg-white/[7%]` (arbitrary opacity) during sidebar refinement. Arbitrary opacity modifiers (`bg-white/[7%]`, `bg-white/[0.07]`) can silently produce no background in Tailwind v4 — standard scale only (`/5`, `/10`, `/15`).
**Fix:** Standardised hover on `bg-white/10 text-zinc-100` throughout NavItem and Sidebar collapse button.

## Resolved (session 2)

### FeedbackForm submit button invisible (2026-05-18)
`bg-[--ucsi-red]` Tailwind arbitrary-value syntax may silently produce no background in some Tailwind v4 builds, rendering the white `text-white` button invisible against a white card background.
**Fix:** Replaced with `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style; Tailwind class removed for that property. Button is now always rendered with correct UCSI red.

### Classes page showed flat unsorted resource list (2026-05-18)
All resources in a section were rendered as one undifferentiated list regardless of type, making it hard to find assignments vs slides.
**Fix:** Resources now grouped by type under labeled section headers (Slides, Tutorials, Exercises, Assignments, Recordings, Notices, Other Files). Only groups with content are shown. mock-resources.ts expanded to 16 entries across 3 sections to fully exercise the categories.

## Resolved (2026-05-19)

### StatCard icons white in light mode (2026-05-19)
Accent state used `bg-[--ucsi-red] text-white`. In cross-mode scenarios (OS dark + manual light or vice versa), UCSI media-query vars and Tailwind `.dark` class diverge, leaving white icon on near-white surface.
**Fix:** `bg-[--ucsi-red]/15 text-[--ucsi-red]` — tinted background + UCSI red icon. No hardcoded white. Works in all theme combinations.

### NotificationBell badge white in light mode + awkward spacing (2026-05-19)
`bg-[--ucsi-red]` Tailwind v4 CSS-var failure — badge rendered with no background, making white number invisible. Badge also sat cramped inside button at `right-1.5 top-1.5`.
**Fix:** `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style; position changed to `-right-1 -top-1` (corner overflow, standard badge pattern).

### Schedule day/time pill white in light mode (2026-05-19)
Same `bg-[--ucsi-red]` CSS-var failure on the day/time pill in `UpcomingClassWidget`.
**Fix:** `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style.

### ClassSectionCard collapse state resets on navigation (2026-05-19)
`useState(defaultOpen)` resets on every App Router remount.
**Fix:** `useEffect` reads `localStorage.getItem('class-open-${sectionId}')` on mount; toggle writes. Accepts brief open→closed flash on first load (standard SSR trade-off).

### ClassSectionCard localStorage key collision (2026-05-19)
Storage key `class-open-${sectionCode}` collided across courses sharing the same section code ("A"). Toggling DIT7044 toggled DIT7031 and MPW1143 simultaneously.
**Fix:** Key changed to `class-open-${sectionId}` (e.g. `class-open-sec-001`). `sectionId` prop added to `ClassSectionCard`.

### Dashboard: `--text-muted` fails WCAG AA contrast (2026-05-19)
`#a1a1aa` on `#ffffff` = ~2.6:1. WCAG AA requires 4.5:1 for text under 18px. Affected: StatCard labels + sub-labels, schedule metadata, announcement dates.
**Fix:** All readable metadata switched to `--text-secondary` (#71717a, ~4.95:1). `--text-muted` reserved for decorative/empty-state text only.

### Schedule day label `text-[9px]` unreadable (2026-05-19)
9px is below readable floor on any screen density.
**Fix:** `text-[10px]`.

### Schedule card `p-3.5` off 4px grid (2026-05-19)
14px padding is not on the 4/8px spacing rhythm.
**Fix:** `p-4` (16px).

## Resolved (2026-05-19 session 2)

### UserMenu avatar invisible in light mode (2026-05-19)
`bg-[--ucsi-red]` Tailwind v4 CSS-var failure on the avatar circle — same pattern as NotificationBell badge and schedule pill. No background rendered in light mode.
**Fix:** `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style.

### NotificationBell + UserMenu dropdowns had no click-outside close (2026-05-18 → fixed 2026-05-19)
Both dropdowns used local `open` state with no outside-click handler.
**Fix:** `useRef` on container div + `useEffect` with `document.addEventListener('mousedown', handler)`. Listener registered only while open, removed on close and unmount.

### Dropdown panels transparent / dark in light mode (2026-05-19)
Both dropdown panels used `bg-[--bg-surface]` Tailwind class which silently produces no background in some Tailwind v4 builds (same CSS-var failure as `bg-[--ucsi-red]`). Additionally, UCSI `--bg-surface` token did not respond to the `.dark` class toggle — only to `@media (prefers-color-scheme: dark)`. Result: OS-dark + manual-light left `--bg-surface` resolving to `#18181b` regardless of ThemeToggle state.
**Fix (two parts):**
1. Dropdown bg: `style={{ backgroundColor: 'var(--bg-surface)' }}` inline style on both panels.
2. Token system: UCSI tokens added to `.dark {}` class in globals.css; `html.light {}` added with light overrides (specificity `0,1,1` beats `@media :root` `0,1,0`). ThemeToggle now toggles `.light` class in addition to `.dark`. layout.tsx inline script applies `.light` class on initial load when `localStorage.theme === 'light'`.

## Resolved (2026-05-19 session 3)

### Student profile avatar invisible (2026-05-19)
`bg-[--ucsi-red]` on `/profile` avatar — same CSS-var failure as UserMenu / NotificationBell / lecturer profile. Caught during ui-ux-pro-max audit.
**Fix:** `style={{ backgroundColor: 'var(--ucsi-red)' }}` inline style.

### Mock data array bracket placement during Edit (2026-05-19)
When appending entries to `mockClassPosts` via `Edit`, the new items landed AFTER the closing `]` instead of inside the array. TypeScript caught with 17 `';' expected` errors.
**Fix:** Re-emit the closing `]` after the new entries; anchor the edit on the last item's trailing `,` not the closing bracket. Generalisable for any typed-array append.

### Lecturer Dashboard urgent activity items broke list alignment (2026-05-19)
`border-l-2 border-[--ucsi-red] pl-3` on urgent items shifted them right, breaking the divider line continuity in the activity feed.
**Fix:** Removed border; urgency now signalled via red icon color (inline `style={{ color: 'var(--ucsi-red, #C1272D)' }}`) + existing "urgent" Badge. Cleaner, no layout disruption.

## Resolved (2026-05-21 session 14)

### `hover:bg-[--bg-elevated]` failing on layout shell + 6 other elements (2026-05-21)
CSS-var hover class silently produces no background in v4 builds. Layout shell buttons (TopBar, ThemeToggle, NotificationBell, UserMenu) had no hover feedback on any page. Also affected table rows in `admin/resources`, `admin/programmes`, `CourseResultTable`; resource items in `ClassSectionCard`; and `FinanceDownloadButton` (which also had a `hover:text-[--ucsi-red]` failure).
**Fix:** Icon buttons on content area → `hover:bg-zinc-100 dark:hover:bg-white/10`; table rows + list item divs → `hover:bg-zinc-50 dark:hover:bg-white/5`; large clickable header → `hover:bg-zinc-100/50 dark:hover:bg-white/5`. `FinanceDownloadButton` hover text → `hover:text-[#C1272D]`.

### `--text-muted` sweep incomplete across profile/component files (2026-05-21)
Readable metadata in profile pages (student/lecturer/admin), attendance pages, `CourseResultTable` column headers, `AttendanceRosterPanel` student numbers + "Not marked", `LecturerActivityFeed` timestamps, and `SectionResourceManager` attachment info/dates were still using `--text-muted` (2.6:1 contrast, fails WCAG AA).
**Fix:** All readable metadata in those files switched to `--text-secondary` (#71717a, ~4.95:1). Decorative chrome (empty states, icons, placeholder text, supplementary row data) kept muted. Sweep is now fully complete across all pages and components.

---

## Resolved (2026-05-19 sessions 5–6)

### Sidebar active vs hover indistinguishable (2026-05-19)
Active and hover both used `bg-white/10` — only the red `border-l-2` differentiated them. At a glance (especially in collapsed mode), they looked identical.
**Fix:** Active bumped to `bg-white/20 text-white`; hover stays `bg-white/10 text-zinc-100`. The opacity jump is the primary cue; border-l is supporting evidence.

### NavGroup font size 10px illegible on high-density displays (2026-05-19)
All-caps labels at 10px with letter-spacing were borderline unreadable on Retina/high-dpi screens.
**Fix:** `text-[10px]` → `text-[11px]` on NavGroup labels.

### Lecturer Dashboard: "urgent" badge alarmed lecturer unnecessarily (2026-05-19)
`<Badge variant="danger">N urgent</Badge>` in lecturer/admin views used student-facing alarm semantics — lecturers wrote those posts themselves, so "urgent" reads as noise.
**Fix:** `variant="warning"` + "N priority" label in lecturer/admin contexts. `variant="danger"` + "urgent" reserved for student-facing views where it is a genuine alert.

## No new bugs (2026-05-19 sessions 5–6)
Graphify refresh, sidebar contrast, admin mock data, and attendance management all passed TypeScript type-check with 0 errors. No regressions observed.

## No new bugs (2026-05-20 session 7)
Admin dashboard bento grid — 5 components, full page assembly — passed TypeScript type-check 0 errors and 34/34 Playwright checks (desktop, dark mode, mobile). No regressions observed.

**Note:** Static `LECTURER_SECTION_IDS` map inside `LecturerAssignmentsCard` double-counts sec-001 students (lec-001 + lec-005 both assigned to that section). Not a visual bug — totals are intentionally approximate for Phase 3. Phase 4 fixes via `TeachingAssignment` query.

## No new bugs (2026-05-20 session 8)
Admin Users + Admin Programmes pages — passed TypeScript 0 errors; `/admin/users` 25/25 and `/admin/programmes` 20/20 Playwright checks. No regressions.

**Note:** `MOCK_USER_STATS` (`/admin/users` stat cards) is a hand-maintained constant — counts must be kept in sync if `MOCK_ADMIN_USERS` changes. Phase 4 derives them from real queries.

**Observed (not new):** dynamically toggling dark mode via JS after page load shows the `UserTable` sticky Name column with a light background — same `CourseResultTable` limitation. Renders correctly on real load via ThemeToggle (class set before first paint).

## Resolved (2026-05-20 session 10)

### Turbopack workspace root warning (2026-05-20)
Next.js 16 Turbopack scans up from the working directory for lockfiles and found `/Users/mayumi/package-lock.json` at the home directory, selecting it as the workspace root instead of the project root. Printed a warning on every dev server start.
**Fix:** Set `turbopack: { root: path.resolve(__dirname) }` in `next.config.ts`. Explicitly pins the root to the `app/` directory.

### React 19: inline script tag warning in component body (2026-05-20)
React 19 emits a console error when it encounters a `<script>` element in the component tree during client-side hydration: "Scripts inside React components are never executed when rendering on the client." The theme-init script was in `<body>` inside `RootLayout`.
**Fix:** Moved `<script dangerouslySetInnerHTML>` from `<body>` to `<head>` in `layout.tsx`. Script still runs before body parse and before React loads; behavior unchanged.

### ThemeToggle hydration mismatch (2026-05-20)
`useState` initializer read `localStorage.getItem('theme')` synchronously on first render. Server rendered `'system'` (window undefined), client immediately resolved to `'light'` from storage — React 19 detected the icon/aria-label mismatch and regenerated the tree.
**Fix:** `ThemeToggle.tsx` — initialize to `'system'` unconditionally (matches server); sync from `localStorage` in `useEffect` after mount. The inline `<head>` script handles visual theme before paint; the button icon is one frame behind on hard refresh (imperceptible).

## Resolved (2026-05-21 session 11)

### `admin/resources` flat list unnavigable (2026-05-21)
All resources from all sections rendered as one table sorted by date, making it impossible to find resources by class. No visual separation between sections.
**Fix:** Group resources server-side by `courseSectionId`. Render a shaded `<tr colSpan={6}>` section header before each group showing section label, course title, and draft count. Sort resources within each section by type then title.

### `admin/sections` Assign button looked like plain text (2026-05-21)
`border-[--ucsi-red]/30` CSS-var with opacity modifier silently produces no border in Tailwind v4. Button had no visible border — appeared as unstyled red text. Also missing `cursor-pointer`.
**Fix:** `border-[--ucsi-red]/30` → `border-[#C1272D]/30` (literal hex). Added `cursor-pointer` to View and Assign.

### `admin/programmes` + `admin/users` Add buttons no hover (2026-05-21)
Primary "Add Programme" and "Add User" buttons used inline `style={{ backgroundColor: 'var(--ucsi-red)' }}` with no hover class — no visual feedback on hover, no pointer cursor.
**Fix:** Added `cursor-pointer transition-opacity hover:opacity-90` to both. Added `cursor-pointer` to View/Edit text buttons in programmes table.

## Resolved (2026-05-21 session 13)

### `admin/users` Name column unbounded (2026-05-21)
Name column had no width constraint. Long email addresses (e.g. `ahmad.hafizi@student.ucsicollege.edu.my`) caused the column to expand to ~380px, pushing the Actions column off-screen at narrow viewports. Sticky th used `var(--bg-elevated)` while td used `var(--bg-surface)`, creating a visible color step in the sticky column.
**Fix:** `w-[200px] max-w-[200px]` on sticky th + td; `truncate` on name and email lines. Sticky th bg changed to `var(--bg-surface)`. Row hover `hover:bg-[--bg-elevated]` → `hover:bg-zinc-50 dark:hover:bg-white/5`.

### Dark mode: UCSI tokens always resolved to light values (2026-05-21)
`.dark {}` (specificity `0,1,0`) defined `--bg-surface: #18181b` but was overridden by the later `:root {}` block (same specificity, defined at line 158, after `.dark` at line 86) which defined `--bg-surface: #ffffff`. Last same-specificity rule wins → dark tokens never applied. The bug was hidden because `Card.tsx` used `bg-[--bg-surface]` (a v4 CSS-var class that silently fails), leaving cards transparent. When `Card.tsx` was fixed to use inline style, the always-light value became visible.
**Fix:** UCSI dark overrides moved from `.dark {}` to `html.dark {}` (specificity `0,1,1`). Same reasoning as the existing `html.light {}` rule. `Card.tsx` background moved to `style={{ backgroundColor: 'var(--bg-surface)' }}`.

### Teaching-assignment mock data duplicated across 3 files (2026-05-21)
Identical `LECTURER_SECTION_IDS` maps defined locally in `LecturerAssignmentsCard.tsx` and `admin/sections/page.tsx`, with a partial overlap in `mock-lecturer.ts`. Any change to assignments required editing 2–3 files.
**Fix:** `MOCK_TEACHING_ASSIGNMENTS` exported from `mock-admin.ts` as single source. Both consumer files import from there.

## No new bugs (2026-05-20 session 9)

Status review session — no code changes, no new bugs or regressions.

## No new bugs (2026-05-21 session 15)

Backend readiness review + academic/timetable features — TypeScript 0 errors. No new regressions. Two frontend stubs identified as misaligned with documented DB shape (classSectionId, /resources routes) — fixed in session 16.

## No new bugs (2026-05-21 session 16)

Type/docs alignment — TypeScript 0 errors after all cascade renames. No behavioral changes. No regressions.

## Resolved (2026-05-21 session 17 — mobile dev interactivity)

### `next dev` on mobile: all client controls dead, only links work (2026-05-21)
Accessing the dev server from a phone on the LAN, the hamburger, `ClassSectionCard` toggles, and every other `onClick`/`useState` control did nothing; plain `<a>` links worked; `next start` was unaffected. Console showed `/_next/webpack-hmr` WebSocket handshake errors. Three compounding causes:
1. **Next.js 16 cross-origin block** — `Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "192.168.1.116"`. Next.js 16 refuses cross-origin HMR by default; the WebSocket never connects and React never hydrates → no event handlers attached.
2. **Browser-extension hydration abort** — a password-manager extension injected `__gcruniqueid` into `DevRoleSwitcher`'s `<select>` before React loaded; React 19 reported "tree hydrated but some attributes… didn't match… won't be patched up" and abandoned hydration for the whole portal subtree.
3. **`ClassSectionCard` localStorage in `useState` initialiser** — server/client mismatch (secondary; classes page only).
**Fix:** (1) `allowedDevOrigins: ['192.168.1.116']` in `next.config.ts` + `--hostname 0.0.0.0` in the `dev` script; (2) `suppressHydrationWarning` on `DevRoleSwitcher`'s `<select>`; (3) `ClassSectionCard` localStorage read moved from the `useState` initialiser to a `useEffect`. Commits `f44be71`, `a1c0a5f`. Why prod was immune: `next start` has no HMR and React production silently patches minor hydration mismatches.

## Resolved (2026-05-22 session 25)

### AdminRecentPosts footer CTA linked to wrong page (2026-05-22)
"View all posts" in `AdminRecentPosts.tsx` linked to `/admin/resources` (resource moderation). No `/admin/posts` route exists. Misleading for admins — clicking sent them to the wrong destination.
**Fix:** Removed the `<CardFooter>` CTA entirely + unused `Link`/`CardFooter` imports. Smallest safe fix.
**Commit:** `d332f6a`.

## Resolved (2026-05-23 session 26)

### Schema: instant-in-time columns created as TIMESTAMP(3) instead of TIMESTAMPTZ(3) (2026-05-23)
All plain `DateTime` fields in the initial migration were created as `TIMESTAMP(3)` (no timezone). Session expiry comparisons and audit timestamps become ambiguous under non-UTC server clocks or admin tooling.
**Fix:** All 20 instant-in-time `DateTime` fields across 11 tables annotated `@db.Timestamptz(3)` in `schema.prisma`. Calendar-date (`@db.Date`) and time-of-day (`@db.Time`) fields left unchanged. Init migration squashed to create `TIMESTAMPTZ(3)` from the start.
**Commits:** `65e3145`, `d43380a`.

### Schema: redundant single-column `courseSectionId` indexes on LearningResource and ClassPost (2026-05-23)
Both tables had `@@index([courseSectionId])` alongside `@@index([courseSectionId, isPublished])`. The composite covers the prefix — the standalone index only added write overhead.
**Fix:** Removed `@@index([courseSectionId])` from both models. Init migration squashed to never create the redundant indexes.
**Commits:** `65e3145`, `d43380a`.

## No new app bugs (2026-05-22 session 25)
Prisma setup issues (Prisma 7 datasource url location, missing migrate.adapter, .env vs .env.local) encountered and resolved during migration setup. No app code changed. TypeScript 0 errors. No regressions.

## Resolved (2026-05-25 session 30)

### Timetable page: brittle join logic with O(n) scans and non-null assertions
`allNonPresent` and `sectionAttendanceSummary` used repeated `Array.find()` / `Array.filter()` across `sections`, `courses`, and `attendance` on every call (O(n²) overall). `sections.find(s => s.id === r.sectionId)!` and `courses.find(c => c.id === sec.courseId)!` used `!` non-null assertions — one inconsistent DB record would crash the page at prerender time.
**Fix:** Precomputed `sectionById: Map<string, CourseSection>`, `courseById: Map<string, Course>`, and `attendanceBySection: Map<string, TimetableAttendanceRecord[]>` once at render entry. All lookups now O(1). Non-null assertions replaced with safe guards — impossible join misses filtered out, never thrown. JSX `courses.find()` calls replaced with `courseById.get()` throughout.
**Commit:** `93e248d` (app).

## No new bugs (2026-05-25 session 31)

Finance page migrated to Prisma. 5 Codex correctness fixes applied (finance domain invariants — not structural bugs `tsc` could catch). `tsc --noEmit`: 0 errors. Page verified live against seed data. Open stubs (classes download, lecturer file upload) unchanged — Phase 6.

## No new bugs (2026-05-25 sessions 29–30)

Academic and Timetable pages migrated to Prisma. `tsc --noEmit`: 0 errors. Pages verified live against seed data. Open stubs (classes download, lecturer file upload) unchanged — Phase 6.

## No new bugs (2026-05-24 sessions 27–28)

Seed fix pass and DAC realism edits — `npx prisma db seed` clean on all runs. TypeScript 0 errors. No app code changed; no regressions.

**Seed data issues resolved (not app bugs):**
- DBM/DAC students enrolled in wrong programme sections → fixed (own sections added)
- Past-semester SSE `DROPPED` instead of `ENROLLED` → fixed (10 rows corrected)
- Attendance dates before semester start → fixed (all 70 entries within bounds)
- Student notification referencing draft resource → fixed (replaced with published `LR.r07`)
- DAC section assigned to inactive lecturer (`lec-4`) → fixed (reassigned to `lec-2`)
- Seed process hung after completion → fixed (`pool.end()` added to finally handler)

## Resolved (2026-05-26 session 35)

### Dashboard CGPA subtitle semantically wrong after Prisma migration
`sub="Current semester"` on the CGPA StatCard. The service computes an all-time weighted average over all published results — not scoped to the current semester.
**Fix:** Changed subtitle to `"All published results"`.

### Dashboard Balance Due subtitle tied to wrong scope
`sub={data.semesterName}` on the Balance Due StatCard. The service sums all invoices across all semesters; binding it to `semesterName` implied current-semester scope.
**Fix:** Changed subtitle to `"Outstanding balance"`.

### Dashboard announcement pills rendering raw UUIDs
`AnnouncementFeed` pill rendered `announcement.courseSectionId` directly — a UUID. Mock data used human-readable IDs (`sec-001`), so this regression only appeared with real DB data.
**Fix:** Q4 now selects `courseSection: { select: { sectionCode: true } }`. Service maps `sectionCode`; type carries it; pill renders `sectionCode ?? courseSectionId`.

### `teachingAssignments: { take: 1 }` nondeterministic in academic + timetable services
`academic-queries.ts` and `timetable-queries.ts` used `take: 1` without `orderBy` — Postgres returns any row, causing displayed lecturer to vary arbitrarily for co-assigned sections.
**Fix:** Added `orderBy: { assignedAt: 'asc' }` to both. All 4 services now consistent (classes + dashboard already had it).

### `addressLine2` fetched in profile service but never rendered
`profile-queries.ts` selected and returned `addressLine2`; `types/profile.ts` declared it; `profile/page.tsx` did not destructure or display it.
**Fix:** Added to destructure; renders `<Field label="Address Line 2" …>` conditionally when truthy.

### `include: true` overfetch in academic-queries
Both enrollment queries used `include: { course: true, result: true }` — pulled all DB columns into memory when only a handful are rendered. The only Phase 4b service not using narrow selects.
**Fix:** Replaced both with explicit `select` shapes scoped to fields the mapper uses.

## Resolved (2026-05-27 session 37)

### Edge Runtime crash: `node:util/types` not found
`middleware.ts` imported `auth` from `@/auth`. `@/auth` transitively imports `@/lib/prisma` (uses the `pg` driver) and `bcryptjs` — both require Node.js built-ins (`node:util/types` etc.) unavailable in Next.js Edge Runtime. Browser reported `Uncaught Error: Failed to load external module node:util/types` and the portal failed to load entirely.
**Fix:** Split config pattern. Created `src/auth.config.ts` (edge-safe: no Prisma, no bcrypt — just `pages`, `providers: []`, `session.strategy`). `middleware.ts` now calls `const { auth } = NextAuth(authConfig)` locally. `auth.ts` spreads `authConfig` then adds full CredentialsProvider + DB callbacks. Prisma/bcrypt never enter the Edge Runtime.

## Resolved (2026-05-27 session 38)

### `getToken` MissingSecret in middleware (2026-05-27)
Linter changed `middleware.ts` to use `getToken({ req })` from `next-auth/jwt`. When called outside the NextAuth handler, `getToken` requires the secret to be passed explicitly — it does not read `AUTH_SECRET` automatically. Runtime error: `Must pass 'secret' if not set to JWT getToken()`.
**Fix:** `getToken({ req, secret: process.env.AUTH_SECRET })`. Secret was already in `.env.local`.

### Login page hydration mismatch from password manager extension (2026-05-27)
A password manager extension injected `data-np-intersection-state="visible"` onto the `<input>` elements in `LoginPageClient.tsx` before React hydrated. React 19 treats unexpected attributes as unrecoverable hydration mismatches, aborting hydration for the subtree and killing all event handlers (form submit broken).
**Fix:** Added `suppressHydrationWarning` to both the `username` and `password` inputs.

## No new bugs (2026-05-27 sessions 36–37)

Phase 5 Auth.js v5 + RBAC implementation. `tsc --noEmit`: 0 errors. All 7 student pages verified to compile with real session. Login form, sign-out, and role-based middleware guards wired. Open stubs (classes download, lecturer file upload, `thecnUsername`, `sessionVersion` DB check) unchanged — Phase 6.

## No new bugs (2026-05-28 session 39)

Graphify rebuild only — no app code changed. No new bugs or regressions.

## Resolved (2026-05-28 session 40 — auth/RBAC hardening)

### [M1] `src/middleware.ts` missing — edge-layer route protection not running (2026-05-28)
**Fixed:** Created `src/middleware.ts` (`export { proxy as middleware, config } from './proxy'`).

### [M2] Portal layout did not enforce role-to-route matching (2026-05-28)
**Fixed:** `proxy.ts` now sets `x-invoke-path` on every authorised pass-through. `(portal)/layout.tsx` reads this header and redirects role mismatches. Also fixed `role ?? 'student'` fail-open to `redirect('/login')` on undefined role (N2).

### [M3] Lecturer and admin pages had no `auth()` call (2026-05-28)
**Fixed:** All 7 lecturer pages and 6 admin pages now begin with `auth()` + role + profile-ID guard before rendering any content.

### [M4/S4] Lecturer `[sectionId]` pages validated params against mock allowlist (2026-05-28)
**Fixed:** `lecturer/resources/[sectionId]` and `lecturer/attendance/[sectionId]` now query `prisma.teachingAssignment.findUnique({ where: { lecturerId_courseSectionId: { lecturerId, courseSectionId: sectionId } } })`. Real DB authorization, mock data for display (hybrid Phase 5→6 state).

### [M5] thecn Server Actions lacked explicit role assertion (2026-05-28)
**Fixed:** All three Server Actions now assert role as part of the first guard: `if (!studentId || session.user.role !== 'student') redirect('/login')` and `if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')`.

### [S1/S2] `sessionVersion` not DB-validated; `isActive` not re-checked post-login (2026-05-28)
**Fixed:** `(portal)/layout.tsx` now runs a single `prisma.user.findUnique({ select: { isActive, sessionVersion } })` on every portal request. Mismatch or inactive → `redirect('/login')`. Catches role changes and deactivations within the 24h JWT window.

### [S5] `submitFeedback` returned error object on missing session (2026-05-28)
**Fixed:** Now calls `redirect('/login')` on missing session, consistent with all other Server Actions.

### [S6] Feedback `body` had no maximum length (2026-05-28)
**Fixed:** Added `.max(5000, 'Details must be 5,000 characters or fewer')` to the Zod schema.

## Resolved (2026-05-28 Codex auth followup)

### Build break: `middleware.ts` + `proxy.ts` coexisting (2026-05-28)
Session 40 created `src/middleware.ts` (one-line re-export of proxy) alongside the existing `src/proxy.ts`. Next.js 16 Turbopack detects both and errors hard: "Both middleware file and proxy file are detected."
**Fix:** Deleted `src/middleware.ts`. `proxy.ts` is the only middleware file — function name must be `proxy`.
**Commit:** `3a6db03`.

### Server Actions could be invoked by stale JWTs (2026-05-28)
`(portal)/layout.tsx` re-validates `isActive`+`sessionVersion` per request, but Server Actions bypass the layout entirely. A deactivated user or role-changed user could still invoke mutations for up to 24h.
**Fix:** Created `src/lib/session-guard.ts` — `getValidatedSession()` wraps `auth()` with the same DB check. All three Server Actions (`feedback/actions.ts`, `profile/actions.ts`, `lecturer/profile/actions.ts`) now call `getValidatedSession()` instead of raw `auth()`.
**Commit:** `3a6db03`.

### Lecturer-route policy inconsistent across protection layers (2026-05-28)
`proxy.ts` and `(portal)/layout.tsx` both allowed admin on `/lecturer/**` routes (`role !== 'lecturer' && role !== 'admin'`). All lecturer page guards said admin denied. Not a runtime bypass but a contradiction that would confuse future contributors.
**Fix:** Both proxy and layout changed to `role !== 'lecturer'`. All three protection layers now agree.
**Commit:** `3a6db03`.

### `post.authorId` compared against wrong identifier in docs (2026-05-28)
`docs/security-notes.md` line 95 showed `post.authorId !== session.user.lecturerId`. The `ClassPost.authorId` field references `User.id` (= `session.user.id`), not `Lecturer.id` (= `session.user.lecturerId`). Only `LearningResource.uploadedBy` uses `lecturerId`. A Phase 6 developer following the doc verbatim would write a broken ownership check.
**Fix:** Corrected in `security-notes.md`. `auth-rbac-review.md` M4 code block updated with inline comments distinguishing both identifier spaces.
**Commit:** `bc71fb8`.

## Open

*No open bugs as of 2026-06-02. Phase 6 complete.*

---

## Resolved (2026-06-02)

### "Last admin" guard missing in `adminUpdateUser` (opened 2026-05-31, resolved 2026-06-02)
`adminUpdateUser` could deactivate all other ADMIN-role users with no protection.
**Fix:** Added `prisma.user.count({ where: { id: { not: target }, role: 'ADMIN', isActive: true } })` check in `adminUpdateUser` before any ADMIN demotion or deactivation; returns a safe error string if result is 0. Belt-and-suspenders: the actor (always an active admin) is always counted so the guard is not reachable through normal UI — it defends against direct API calls or future guard relaxation.
**File:** `src/app/(portal)/admin/users/actions.ts`.

---

## Resolved (Phase 6 — 2026-05-30/31)

### Classes page download button is a stub
*(was open since pre-session 14)*
**Resolved:** `GET /api/files/[sectionId]/[attachmentId]` route handler with IDOR guard (attachment.resource.courseSectionId === sectionId), role-branched authz (student requires isPublished + enrollment, lecturer requires TeachingAssignment, admin bypasses). `ClassSectionCard.ResourceItem` calls the API with `fetch → blob → createObjectURL`. Files stored at `<app-root>/uploads/` (gitignored via `lib/storage.ts`).

### Lecturer Resources upload/edit file input is UI-only
*(was open since pre-session 14)*
**Resolved:** `POST /api/upload/resource` route handler — multipart, magic-bytes MIME validation, 100 MB cap, TeachingAssignment gate, rollback on storage fail and attachment DB fail. `UploadResourceForm` replaced with `fetch('/api/upload/resource', { method: 'POST', body: FormData })` pattern.

## No new bugs (2026-05-22 sessions 23–24)

Docs-only sessions. `npx tsc --noEmit` — 0 errors. `npm run build` — clean, all 20 routes. No regressions. Open stubs (classes download, lecturer file upload) unchanged — Phase 6.

## Resolved (2026-05-22 session 22)

### `AnnouncementFeed.tsx` local `Announcement` type out of sync with `ClassPost` (2026-05-22)
`AnnouncementFeed` defined its own `Announcement` interface with `scope: 'global' | string` and `date: string` — structurally misaligned with the merged `ClassPost` DB shape.
**Fix:** Removed local interface. Added exported `DashboardAnnouncement = Pick<ClassPost, 'id'|'title'|'body'|'courseSectionId'|'createdAt'>`. Dashboard page retyped ANNOUNCEMENTS constant (`scope→courseSectionId` with `null`/`'sec-001'`, `date→ISO createdAt`). Phase 4 Prisma data (`ClassPost WHERE courseSectionId IS NULL`) drops in with no prop-shape change.
