# Database Relationships

Access control for Learning Resources is enforced through two authorization tables:
- **`TeachingAssignment`** — grants a Lecturer the right to upload to a specific `CourseSection`
- **`StudentSectionEnrollment`** — grants a Student the right to view/download resources in a specific `CourseSection`

Both are confirmed as a unified access-control hyperedge by graphify (confidence 1.00). Never bypass them.

```mermaid
erDiagram
    User {
        uuid id PK
        string username
        string email_institutional
        string email_personal
        string password_hash
        enum role
        boolean is_active
    }

    Session {
        uuid id PK
        uuid user_id FK
        string session_token
        timestamp expires
    }

    Student {
        uuid id PK
        uuid user_id FK
        string student_number
        string full_name
        date date_of_birth
        string gender
        string nationality
        string mobile
        string guardian_name
        string address_line1
    }

    Lecturer {
        uuid id PK
        uuid user_id FK
        string full_name
        string staff_number
        string department
    }

    Programme {
        uuid id PK
        string code
        string name
        int total_credits
        int duration_years
    }

    ProgrammeEnrollment {
        uuid id PK
        uuid student_id FK
        uuid programme_id FK
        string file_number
        date intake_date
        date expected_grad_date
        enum status
    }

    Semester {
        uuid id PK
        uuid programme_id FK
        string name
        int academic_year
        int semester_number
        date start_date
        date end_date
        boolean is_current
    }

    Course {
        uuid id PK
        string code
        string title
        decimal credits
        enum type
        string mpw_category
    }

    CourseSection {
        uuid id PK
        uuid course_id FK
        uuid semester_id FK
        string section_code
        string room
        int day_of_week
        time time_start
        time time_end
    }

    TeachingAssignment {
        uuid id PK
        uuid lecturer_id FK
        uuid course_section_id FK
        timestamp assigned_at
    }

    StudentSectionEnrollment {
        uuid id PK
        uuid student_id FK
        uuid course_section_id FK
        enum status
        timestamp enrolled_at
    }

    Result {
        uuid id PK
        uuid student_section_enrollment_id FK
        string grade
        string standing
        decimal attendance_percentage
        boolean is_published
    }

    Attendance {
        uuid id PK
        uuid student_id FK
        uuid course_section_id FK
        date date
        enum status
        uuid recorded_by FK
    }

    LearningResource {
        uuid id PK
        uuid course_section_id FK
        uuid uploaded_by FK
        string title
        text description
        enum type
        boolean is_published
        timestamp created_at
    }

    ResourceAttachment {
        uuid id PK
        uuid resource_id FK
        string original_filename
        string mime_type
        bigint file_size_bytes
        string storage_key
        int download_count
    }

    Invoice {
        uuid id PK
        uuid student_id FK
        uuid programme_enrollment_id FK
        string invoice_number
        decimal tuition_fee
        decimal less_amount
        decimal amount_outstanding
        enum status
        date due_date
    }

    Payment {
        uuid id PK
        uuid invoice_id FK
        string transaction_number
        decimal amount
        date payment_date
        enum mode
        string reference_no
        enum status
    }

    Announcement {
        uuid id PK
        uuid created_by FK
        string title
        text content
        uuid course_section_id FK
        boolean is_pinned
        timestamp published_at
    }

    Notification {
        uuid id PK
        uuid user_id FK
        string title
        text body
        enum type
        boolean is_read
    }

    Feedback {
        uuid id PK
        uuid student_id FK
        string subject
        text body
        enum status
        timestamp created_at
    }

    AddDropRequest {
        uuid id PK
        uuid student_id FK
        uuid course_section_id FK
        enum action
        enum status
        timestamp created_at
    }

    ProgressionRequest {
        uuid id PK
        uuid student_id FK
        uuid from_semester_id FK
        uuid to_semester_id FK
        text reason
        enum status
    }

    User ||--o| Student : "has profile"
    User ||--o| Lecturer : "has profile"
    User ||--o{ Session : "has sessions"

    Student ||--o{ ProgrammeEnrollment : "enrolled in"
    Programme ||--o{ ProgrammeEnrollment : "has students"
    Programme ||--o{ Semester : "has semesters"

    Course ||--o{ CourseSection : "offered as"
    Semester ||--o{ CourseSection : "contains"

    Lecturer ||--o{ TeachingAssignment : "assigned to"
    CourseSection ||--o{ TeachingAssignment : "taught by"

    Student ||--o{ StudentSectionEnrollment : "enrolls in"
    CourseSection ||--o{ StudentSectionEnrollment : "has students"

    StudentSectionEnrollment ||--o| Result : "has result"

    Student ||--o{ Attendance : "has records"
    CourseSection ||--o{ Attendance : "tracks attendance"

    CourseSection ||--o{ LearningResource : "has resources"
    Lecturer ||--o{ LearningResource : "uploads"
    LearningResource ||--o{ ResourceAttachment : "has files"

    Student ||--o{ Invoice : "receives"
    ProgrammeEnrollment ||--o{ Invoice : "generates"
    Invoice ||--o{ Payment : "settled by"

    Student ||--o{ Feedback : "submits"
    Student ||--o{ AddDropRequest : "requests"
    CourseSection ||--o{ AddDropRequest : "target of"
    Student ||--o{ ProgressionRequest : "requests"
    Semester ||--o{ ProgressionRequest : "from"
    Semester ||--o{ ProgressionRequest : "to"

    User ||--o{ Notification : "receives"
    User ||--o{ Announcement : "creates"
    CourseSection ||--o{ Announcement : "scoped to"
```
