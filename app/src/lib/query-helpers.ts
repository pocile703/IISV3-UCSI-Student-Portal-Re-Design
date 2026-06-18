// Server-side pure helpers shared across services/*-queries.ts files.
// Keep this file free of Prisma imports — these are stateless transforms only.

export const GRADE_POINTS: Record<string, number> = {
  'A':  4.0,
  'A-': 3.7,
  'B+': 3.5,
  'B':  3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C':  2.0,
  'C-': 1.7,
  'D':  1.0,
  'F':  0.0,
}

// @db.Time columns come back as epoch Date objects (1970-01-01T…) → "HH:MM"
export function toTime(d: Date): string {
  return d.toISOString().slice(11, 16)
}

// @db.Date columns come back as Date objects → "YYYY-MM-DD"
export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}
