# Design System

Modern redesign for UCSI College Student Portal. Built on Tailwind CSS v4 + shadcn/ui.

---

## Brand

### Colors

UCSI College's existing brand color is deep red. The redesign retains this as the primary brand color but adds a modern neutral palette and semantic colors.

```
Brand
  --ucsi-red:       #C1272D    (primary, UCSI red)
  --ucsi-red-dark:  #9B1B20    (hover states)
  --ucsi-red-light: #F9E5E6    (tinted backgrounds, alerts)

Neutrals (Tailwind zinc scale)
  --bg-base:        zinc-50    (page background)
  --bg-surface:     white      (cards, panels)
  --bg-elevated:    zinc-100   (hover rows, input bg)
  --border:         zinc-200
  --text-primary:   zinc-900
  --text-secondary: zinc-600
  --text-muted:     zinc-400

Semantic
  --success:   emerald-600  / emerald-50 bg
  --warning:   amber-600    / amber-50 bg
  --danger:    red-600      / red-50 bg
  --info:      sky-600      / sky-50 bg
```

### Dark Mode

All semantic colors have dark mode counterparts via Tailwind `dark:` variants. Cards use `dark:bg-zinc-900`, surface uses `dark:bg-zinc-950`.

---

## Typography

```
Font Family
  Sans:  Geist Sans (already installed via layout.tsx)
  Mono:  Geist Mono (for student/invoice numbers, codes)

Scale
  text-xs   12px   line-height 16px   muted labels, metadata
  text-sm   14px   line-height 20px   body, table cells
  text-base 16px   line-height 24px   default body
  text-lg   18px   line-height 28px   section headings
  text-xl   20px   line-height 28px   page sub-headings
  text-2xl  24px   line-height 32px   page headings
  text-3xl  30px   line-height 36px   dashboard stat numbers

Weight
  font-normal   400   body text
  font-medium   500   labels, nav items
  font-semibold 600   headings, card titles
  font-bold     700   stat values, critical numbers
```

---

## Spacing

8-point grid. All spacing uses multiples of 4px (Tailwind default).

```
Micro    4px   gap-1, p-1    icon padding
Small    8px   gap-2, p-2    inline spacing
Base    12px   gap-3, p-3    compact card padding
Medium  16px   gap-4, p-4    default card padding
Large   24px   gap-6, p-6    section padding
XL      32px   gap-8, p-8    page section gaps
2XL     48px   gap-12        hero/dashboard top spacing
```

---

## Layout

```
Sidebar + Content layout (replaces legacy flat top nav)

Sidebar width: 240px (collapsed: 64px on mobile)
Content max-width: 1200px (centered)
Page padding: px-6 py-6 (desktop), px-4 py-4 (mobile)

Breakpoints (Tailwind defaults)
  sm:  640px
  md:  768px
  lg:  1024px
  xl:  1280px
```

---

## Component Tokens

### Cards
```
border-radius: rounded-xl   (12px)
padding:       p-6
shadow:        shadow-sm
border:        border border-zinc-200
```

### Buttons
```
Primary:   bg-ucsi-red text-white hover:bg-ucsi-red-dark  rounded-lg h-10 px-4
Secondary: border border-zinc-300 bg-white hover:bg-zinc-50  rounded-lg h-10 px-4
Ghost:     hover:bg-zinc-100  rounded-lg h-10 px-4
Danger:    bg-red-600 text-white hover:bg-red-700  rounded-lg h-10 px-4
Size sm:   h-8 px-3 text-sm
Size lg:   h-12 px-6 text-base
```

### Badges
```
Active/Enrolled:  bg-emerald-100 text-emerald-700  rounded-full px-2 py-0.5 text-xs
Pending:          bg-amber-100 text-amber-700
Overdue/Danger:   bg-red-100 text-red-700
Inactive/Dropped: bg-zinc-100 text-zinc-600
Info:             bg-sky-100 text-sky-700
```

### Form Inputs
```
border: border-zinc-300
focus:  focus:ring-2 focus:ring-ucsi-red/20 focus:border-ucsi-red
height: h-10
radius: rounded-lg
error:  border-red-500 + red helper text below
```

### Tables
```
Header:  bg-zinc-50 text-zinc-600 text-xs font-medium uppercase tracking-wide
Row:     border-b border-zinc-100 hover:bg-zinc-50
Cell:    py-3 px-4 text-sm
Mobile:  card-style list instead of table (cards stack vertically)
```

---

## Navigation (Sidebar)

Replaces the legacy flat horizontal navbar. Sidebar groups:

**Student Sidebar**
- Dashboard (home icon)
- Academic (graduation cap)
- Timetable (calendar)
- Resources (book open)
- Financial (credit card)
- Feedback (message square)
- Profile (user circle) — bottom pinned

**Lecturer Sidebar**
- Dashboard
- My Classes
- Resources (grouped by section)
- Profile — bottom pinned

**Admin Sidebar**
- Dashboard
- Users
- Programmes
- Courses & Sections
- Assignments
- Enrollments
- Resources (moderation)
- Profile — bottom pinned

---

## Icons

Use `lucide-react` (standard for shadcn/ui ecosystem). Consistent size: 16px (`size-4`) for inline, 20px (`size-5`) for nav items.

---

## Motion & Animation

```
Transitions: all  150ms  ease-in-out   (default hover/focus)
Modals:      fade + scale  200ms ease-out
Sidebar:     slide  200ms ease-in-out  (mobile open/close)
Skeletons:   pulse animation (Tailwind animate-pulse)
Toast:       slide-in from bottom-right
```

Avoid motion for users who prefer `prefers-reduced-motion`.

---

## UI/UX Problems in Legacy System (Addressed by This Design System)

Problems sourced from screenshot reverse-engineering and confirmed by graphify image analysis.

| Legacy Problem | Screenshot Source | Design System Solution |
|---|---|---|
| Flat horizontal nav overflows at 6+ items | All pages | Sidebar with grouped sections, infinitely scalable |
| Identical visual weight on all elements | All pages | Semantic badge colors, typographic hierarchy |
| No mobile layout | All pages | Sidebar collapses, tables become card lists on mobile |
| Dated red diagonal background on login | Login page | Clean centered card, brand red used as accent only |
| Version number `v1.202106` exposed in footer | Timetable, Feedback | Removed — no version disclosure |
| Blurred/empty input fields across profile | Profile page | Read mode: plain text. Edit mode: shadcn Input |
| "Hand:" label on mobile number field | Profile page | Field labeled "Mobile Number" with phone icon |
| No save button visible on profile | Profile page | Inline edit per field with explicit Save / Cancel |
| No loading states | All pages | Skeleton components on all async data |
| No empty states | Feedback, Timetable | `EmptyState` component with icon + guidance text |
| Dual email confusion in profile | Profile page | Single "Institutional Email" field + "Personal Email" field clearly labeled |
| No GPA/attendance visualization | Academic page | `GPATrendChart`, `AttendanceSummaryBar` in Academic |
| Academic page redundant Year 1/2/3 tabs | Academic page | Accordion by semester; year is implied by semester sequence |
| Financial table overwhelming | Financial page | Summary cards first, detail table below the fold |
| Invoice status "DPY" unexplained | Financial page | Human-readable `Badge`: Paid, Partial, Overdue, Cancelled |
| Timetable date filter applies to "By Listing" only but warning is ambiguous | Timetable page | Date filter appears only in List view tab — Calendar view has no filter |
| Timetable empty state typo "NOT RELEASE YET" | Timetable page | Correct copy: "No timetable has been published for this semester yet." |
| No help text on form fields | Login, Timetable | Accessible `aria-describedby` helper text on inputs |
| Search + Actions placed before content | Feedback, Dashboard | Content-first layout; actions appear contextually |
