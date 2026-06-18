# Database Schema

Inferred from the IISV2 legacy portal screenshots and extended to support the new Lecturer and Learning Resources modules.

---

## Core Auth

### User
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| username | varchar(50) UNIQUE | Student/staff ID used to login |
| email_institutional | varchar(100) UNIQUE | @ucsicollege.edu.my |
| email_personal | varchar(150) | pocile703@gmail.com visible in profile |
| password_hash | varchar(255) | bcrypt |
| role | enum(student, lecturer, admin) | Single role per user |
| is_active | boolean | Deactivate without deletion |
| session_version | int | default 1 — increment on role change to force re-login (checked in middleware against JWT) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Session
Managed by Auth.js. Stored in DB adapter.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| session_token | varchar(255) UNIQUE | |
| expires | timestamptz | |

---

## Student System

### Student
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User UNIQUE | 1:1 |
| student_number | varchar(20) UNIQUE | Display ID (e.g. IISV-something) |
| full_name | varchar(150) | |
| date_of_birth | date | |
| gender | enum(male, female, other) | |
| nationality | varchar(80) | Malaysia visible in screenshot |
| marital_status | enum(single, married, other) | |
| mobile | varchar(20) | |
| guardian_name | varchar(150) | |
| guardian_relation | varchar(80) | |
| address_line1 | varchar(200) | |
| address_line2 | varchar(200) | |
| city | varchar(100) | |
| state | varchar(100) | |
| postcode | varchar(20) | |
| country | varchar(80) | |
| avatar_url | varchar(500) | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Programme
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | varchar(30) UNIQUE | e.g. DIIT, seen in financial screenshot |
| name | varchar(200) | e.g. Diploma in Information Technology |
| total_credits | int | |
| duration_years | int | 3 visible in academic page (Year 1–3) |
| is_active | boolean | |

### ProgrammeEnrollment
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| programme_id | uuid FK → Programme | |
| file_number | varchar(50) | Seen in academic page "File Number" column |
| intake_date | date | "Created" date in academic programme listing |
| expected_grad_date | date | "Expected Date" column |
| status | enum(active, completed, withdrawn, deferred) | |
| admit_date | date | "Admit" column |
| programme_attachment_url | varchar(500) | nullable |

### Semester
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| programme_id | uuid FK → Programme | |
| name | varchar(80) | e.g. "Semester 1 2024" |
| academic_year | int | |
| semester_number | int | 1, 2, 3 |
| start_date | date | |
| end_date | date | |
| is_current | boolean | |

### Course
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | varchar(20) UNIQUE | e.g. DIT7044, visible in academic records |
| title | varchar(200) | |
| credits | decimal(4,1) | |
| type | enum(core, elective, mpw, bridging) | Columns seen in programme structure |
| mpw_category | varchar(50) | nullable |
| mqa_requirement | boolean | Column in programme structure |
| is_active | boolean | |

### CourseSection
Represents a specific offering of a course in a semester (a class the lecturer teaches).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| course_id | uuid FK → Course | |
| semester_id | uuid FK → Semester | |
| section_code | varchar(20) | e.g. "A", "B" |
| room | varchar(50) | nullable |
| day_of_week | int | 0=Mon, 6=Sun |
| time_start | time | |
| time_end | time | |
| max_capacity | int | |

### StudentSectionEnrollment
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| course_section_id | uuid FK → CourseSection | |
| status | enum(enrolled, dropped, pending_drop, pending_add) | |
| enrolled_at | timestamptz | |

### Result
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_section_enrollment_id | uuid FK → StudentSectionEnrollment | |
| grade | varchar(5) | e.g. A, B+, C, F |
| standing | varchar(20) | Normal, Dean's List, Probation etc |
| attendance_percentage | decimal(5,2) | |
| is_published | boolean | Controls student visibility |

### Attendance
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| course_section_id | uuid FK → CourseSection | |
| date | date | |
| status | enum(present, absent, late, excused) | |
| recorded_by | uuid FK → User | lecturer who recorded |

---

## Lecturer System

### Lecturer
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User UNIQUE | 1:1 |
| full_name | varchar(150) | |
| staff_number | varchar(30) UNIQUE | |
| department | varchar(100) | |

### TeachingAssignment
Links a lecturer to a specific CourseSection. This is the authorization source for resource uploads.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| lecturer_id | uuid FK → Lecturer | |
| course_section_id | uuid FK → CourseSection | |
| assigned_at | timestamptz | |

---

## Learning Resources System

### LearningResource
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| course_section_id | uuid FK → CourseSection | |
| uploaded_by | uuid FK → Lecturer | |
| title | varchar(255) | |
| description | text | nullable |
| type | enum(slide, tutorial, exercise, assignment, recording, other) | |
| is_published | boolean | draft vs live |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### ResourceAttachment
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| resource_id | uuid FK → LearningResource | |
| original_filename | varchar(255) | |
| mime_type | varchar(100) | |
| file_size_bytes | bigint | |
| storage_key | varchar(500) | S3/R2 object key — **UNIQUE constraint required** |
| download_count | int | default 0 |

### ClassPost

Section-scoped posts authored by lecturers (announcements, urgent notices, reminders, updates). Also serves as the global announcement channel — `course_section_id = null` means the post is system-wide (admin-authored only). This table replaces the separate `Announcement` table; the `type` enum covers both use cases.

> **Decision (2026-05-21):** `ClassPost` and `Announcement` merged into one table. Global announcements use `course_section_id = null` (admin only). Section-scoped posts use a non-null `course_section_id` (lecturer only). The frontend `AnnouncementFeed` component will query `ClassPost WHERE course_section_id IS NULL` in Phase 4.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| course_section_id | uuid FK → CourseSection | nullable — null = global/admin announcement |
| author_id | uuid FK → User | admin for global; lecturer for section-scoped |
| type | enum(announcement, urgent, reminder, update) | |
| title | varchar(255) | |
| body | text | |
| is_pinned | boolean | default false |
| is_published | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## Financial System

### Invoice
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| programme_enrollment_id | uuid FK → ProgrammeEnrollment | |
| invoice_number | varchar(50) UNIQUE | Clickable in financial screenshot |
| tuition_fee | decimal(10,2) | "Tuition Fee To Pay" |
| less_amount | decimal(10,2) | Discount/scholarship applied |
| status | enum(unpaid, partial, paid, overdue, cancelled) | Legacy system showed unexplained "DPY" status — replaced with explicit enum |
| due_date | date | |
| programme_semester | varchar(50) | e.g. "Sem 1 2024" |
| issued_at | date | "Transaction Date" in screenshot |

> **Invoice immutability rule:** Invoice and Payment records must never be hard-deleted. Use `status = 'cancelled'` instead. Financial audit trails require permanent records.

### Payment
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| invoice_id | uuid FK → Invoice | |
| transaction_number | varchar(100) UNIQUE | |
| amount | decimal(10,2) | |
| payment_date | date | |
| mode | enum(transfer, online, cash, card, other) | |
| reference_no | varchar(100) | nullable |
| status | enum(pending, completed, failed, refunded) | |
| recorded_at | timestamptz | |

---

## Communication System

> **`Announcement` table removed (2026-05-21).** Global and section-scoped announcements are handled by the `ClassPost` table (Learning Resources section above). `courseSectionId = null` = global/admin post. `courseSectionId = non-null` = section-scoped/lecturer post. Do not create an `Announcement` Prisma model. The `AnnouncementFeed` component queries `ClassPost WHERE courseSectionId IS NULL`.

### Notification
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| title | varchar(255) | |
| body | text | |
| type | enum(attendance_alert, fee_alert, grade_published, resource_uploaded, system) | |
| is_read | boolean | default false |
| created_at | timestamptz | |

### Feedback
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| subject | varchar(255) | |
| body | text | |
| status | enum(submitted, under_review, resolved, closed) | |
| created_at | timestamptz | |
| resolved_at | timestamptz | nullable |

---

## Workflow Tables

### AddDropRequest
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| course_section_id | uuid FK → CourseSection | |
| action | enum(add, drop) | |
| status | enum(pending, approved, rejected) | |
| reason | text | nullable |
| reviewed_by | uuid FK → User | nullable, admin |
| created_at | timestamptz | |
| reviewed_at | timestamptz | nullable |

### ProgressionRequest
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid FK → Student | |
| from_semester_id | uuid FK → Semester | |
| to_semester_id | uuid FK → Semester | |
| reason | text | |
| status | enum(pending, approved, rejected) | |
| reviewed_by | uuid FK → User | nullable |
| created_at | timestamptz | |
| reviewed_at | timestamptz | nullable |

---

## Admin Audit Log (Optional, Compliance)

Graphify surfaced this as a knowledge gap — admin actions are not currently logged. Add if compliance requires it.

### AdminAuditLog
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid FK → User | admin who performed the action |
| action | varchar(100) | e.g. `user.create`, `enrollment.create`, `role.change` |
| target_type | varchar(50) | e.g. `User`, `StudentSectionEnrollment` |
| target_id | uuid | ID of the affected record |
| before_value | jsonb | nullable — snapshot before change |
| after_value | jsonb | nullable — snapshot after change |
| ip_address | inet | |
| created_at | timestamptz | |

---

## Key Constraints & Indexes

```sql
-- Prevent duplicate teaching assignments
UNIQUE (lecturer_id, course_section_id) ON TeachingAssignment

-- Prevent duplicate student enrollments per section
UNIQUE (student_id, course_section_id) ON StudentSectionEnrollment

-- Prevent duplicate results
UNIQUE (student_section_enrollment_id) ON Result

-- Prevent duplicate attendance per day per class (REQUIRED — concurrent saves from same lecturer will produce duplicates without this)
UNIQUE (student_id, course_section_id, date) ON Attendance

-- Prevent duplicate storage objects (REQUIRED — R2/S3 key namespace collision)
UNIQUE (storage_key) ON ResourceAttachment

-- Performance indexes — base set
INDEX ON StudentSectionEnrollment (student_id)
INDEX ON StudentSectionEnrollment (course_section_id)
INDEX ON LearningResource (course_section_id)
INDEX ON TeachingAssignment (lecturer_id)
INDEX ON Invoice (student_id)
INDEX ON ClassPost (course_section_id)

-- TeachingAssignment: checked on every lecturer API call — composite required
INDEX ON TeachingAssignment (lecturer_id, course_section_id)

-- StudentSectionEnrollment: checked on every student API call — composite required
INDEX ON StudentSectionEnrollment (student_id, course_section_id)

-- Notification polling: "recent unread for user" — needs covering index
INDEX ON Notification (user_id, is_read, created_at DESC)

-- Attendance: timetable missed-sessions query
INDEX ON Attendance (student_id, date)

-- Results: published filter at scale
INDEX ON Result (student_section_enrollment_id, is_published)

-- Semester: "current semester for programme" — common timetable join
INDEX ON Semester (programme_id, is_current)

-- AdminAuditLog: "all actions on a given entity"
INDEX ON AdminAuditLog (target_type, target_id)
```

---

## Schema Notes (2026-05-21)

### `Invoice.amount_outstanding` — decision: drop the column

**Decision (2026-05-21):** Remove `amount_outstanding` from the `Invoice` table. Compute at query time via Prisma `_sum` aggregate:

```typescript
const totals = await prisma.payment.aggregate({
  where: { invoiceId, status: 'completed' },
  _sum: { amount: true },
})
const outstanding = invoice.tuitionFee - invoice.lessAmount - (totals._sum.amount ?? 0)
```

Rationale: a stored computed field drifts any time a payment is updated without also recalculating the field. The aggregate approach is simpler, always correct, and eliminates the need for a `$transaction` update contract.

**Do not include `amount_outstanding` in the Prisma `Invoice` model.**

### `Attendance` — FK design is intentional

`Attendance` links directly to `student_id + course_section_id`, not through `StudentSectionEnrollment`. This is intentional — attendance is a historical observation of physical presence, not an enrollment state. A dropped student's prior attendance records persist correctly. The composite unique constraint `UNIQUE (student_id, course_section_id, date)` must be confirmed in the Prisma schema to prevent duplicate records from concurrent saves.

### `Semester.programme_id` — join chain

`CourseSection → Semester → Programme` means a section is implicitly scoped to a programme. The common query "current semester for this student's programme" traverses this chain on every timetable and academic page load. The `INDEX ON Semester (programme_id, is_current)` above is required from the start.
