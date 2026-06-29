import { z } from 'zod'

// Shared Zod validators for Phase 6 Server Actions and API route handlers.
// Rule: validate input at the action boundary; never trust raw formData strings.

// Lenient UUID format: 8-4-4-4-12 hex digits, any version/variant.
// z.string().uuid() is Zod v4 strict (requires version-4 + variant bits) and
// rejects the seed's deterministic IDs like 20000000-0000-0000-0000-000000000001.
// Postgres @db.Uuid accepts any compliant hex format — we match that contract.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ─── Enum schemas ────────────────────────────────────────────────────────────
// Accept lowercase values (matching frontend ResourceType / PostType unions).
// Actions must .toUpperCase() before passing to Prisma (DB stores uppercase enums).
export const resourceTypeSchema = z.enum(
  ['slide', 'tutorial', 'exercise', 'assignment', 'recording', 'other'],
  { message: 'Invalid resource type' },
)

export const postTypeSchema = z.enum(
  ['announcement', 'urgent', 'reminder', 'update'],
  { message: 'Invalid post type' },
)

// Accept lowercase to match the frontend AttendanceStatus type ('present' | 'absent' | ...).
// Actions must .toUpperCase() before passing to Prisma.
export const attendanceStatusSchema = z.enum(
  ['present', 'absent', 'late', 'excused'],
  { message: 'Invalid attendance status' },
)

export const sectionIdSchema = z.string().regex(UUID_RE, 'Invalid section ID')

export const postIdSchema = z.string().regex(UUID_RE, 'Invalid post ID')

export const resourceIdSchema = z.string().regex(UUID_RE, 'Invalid resource ID')

// Lenient student ID — seed deterministic IDs fail z.string().uuid() in Zod v4.
export const studentIdSchema = z.string().regex(UUID_RE, 'Invalid student ID')

export const taskIdSchema = z.string().regex(UUID_RE, 'Invalid task ID')

export const attachmentIdSchema = z.string().regex(UUID_RE, 'Invalid attachment ID')

export const userIdSchema = z.string().regex(UUID_RE, 'Invalid user ID')

// ─── Text field schemas ──────────────────────────────────────────────────────
export const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(255, 'Title must be 255 characters or fewer')

export const bodySchema = z
  .string()
  .trim()
  .min(1, 'Body is required')
  .max(5000, 'Body must be 5,000 characters or fewer')

export const descriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Description must be 2,000 characters or fewer')
  .optional()

// ─── Programme field schemas ─────────────────────────────────────────────────
export const programmeIdSchema = z.string().regex(UUID_RE, 'Invalid programme ID')

export const programmeCodeSchema = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(30, 'Code must be 30 characters or fewer')
  .regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only')

export const programmeNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(200, 'Name must be 200 characters or fewer')

export const totalCreditsSchema = z.coerce
  .number()
  .int('Total credits must be a whole number')
  .min(1, 'Total credits must be at least 1')
  .max(999, 'Total credits must be 999 or fewer')

export const durationYearsSchema = z.coerce
  .number()
  .int('Duration must be a whole number')
  .min(1, 'Duration must be at least 1 year')
  .max(10, 'Duration must be 10 years or fewer')

// ─── Section form field schemas ───────────────────────────────────────────────

export const courseIdSchema = z.string().regex(UUID_RE, 'Invalid course ID')

export const semesterIdSchema = z.string().regex(UUID_RE, 'Invalid semester ID')

// lecturerOptSchema: accepts a valid UUID string or '' / null / undefined (→ null).
// Used for the "Assigned Lecturer" select which has a "None" empty-string option.
export const lecturerOptSchema = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.string().regex(UUID_RE, 'Invalid lecturer ID').nullable(),
)

export const sectionCodeSchema = z
  .string()
  .min(1, 'Section code is required')
  .max(20, 'Section code must be 20 characters or fewer')
  .regex(/^[A-Za-z0-9_-]+$/, 'Section code may only contain letters, numbers, hyphens, underscores')

// roomSchema: '' / null / undefined → null; non-empty string validated for length.
export const roomSchema = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.string().max(50, 'Room must be 50 characters or fewer').nullable(),
)

export const dayOfWeekSchema = z
  .string()
  .transform(Number)
  .pipe(z.number().int().min(0, 'Invalid day').max(6, 'Invalid day'))

// timeFieldSchema: validates "HH:MM" format submitted by <input type="time">
export const timeFieldSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time format — expected HH:MM')

export const maxCapacitySchema = z
  .string()
  .transform(Number)
  .pipe(z.number().int().min(1, 'Capacity must be at least 1').max(500, 'Capacity cannot exceed 500'))

// ─── Add/Drop + Progression request schemas ───────────────────────────────────

export const requestIdSchema = z.string().regex(UUID_RE, 'Invalid request ID')

// Lowercase to match the form; actions .toUpperCase() before Prisma (enum ADD | DROP).
export const addDropActionSchema = z.enum(['add', 'drop'], { message: 'Invalid action' })

// Optional reason (AddDropRequest.reason is nullable): '' → undefined.
export const requestReasonOptionalSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().max(2000, 'Reason must be 2,000 characters or fewer').optional(),
)

// Required reason (ProgressionRequest.reason is non-null).
export const requestReasonRequiredSchema = z
  .string()
  .trim()
  .min(1, 'A reason is required')
  .max(2000, 'Reason must be 2,000 characters or fewer')
