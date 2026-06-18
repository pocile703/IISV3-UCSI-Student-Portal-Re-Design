# User Flows — Mermaid Diagrams

> Graphify detected 11 dedicated user-flow communities (Student Dashboard Flow, Student Academic Flow, Student Timetable Flow, Student Financial Flow, Lecturer Login Flow, Lecturer Resource Upload Flow, etc.), confirming that each role's flows are distinct and non-overlapping. Admin flows form their own community cluster separate from student and lecturer.

---

## Student Flow

```mermaid
flowchart TD
    A([Visit Portal]) --> B{Session?}
    B -- No --> C[/Login Page/]
    B -- Yes --> D[/Student Dashboard/]

    C --> E[Enter username + password]
    E --> F{Valid?}
    F -- No --> G[Show error message]
    G --> E
    F -- Yes --> D

    D --> H[View Announcements]
    D --> I[View Stat Widgets\nGPA · Attendance · Balance · Next Class]
    D --> J[Click Quick Action]

    J --> K[/Academic Page/]
    J --> L[/Timetable Page/]
    J --> M[/Financial Page/]
    J --> N[/Resources Page/]
    J --> O[/Feedback Page/]

    K --> K1[Select Semester Tab]
    K1 --> K2[View Course Results]
    K2 --> K3[View Grade · Attendance · Standing]
    K --> K4[View Programme Structure]
    K --> K5[Download Transcript PDF]

    L --> L1{View Mode}
    L1 -- Calendar --> L2[Weekly Calendar View]
    L1 -- List --> L3[List View with Date Filter]
    L2 --> L4[Export to iCal]

    M --> M1[View Balance Summary Cards]
    M1 --> M2[Browse Invoice Table]
    M2 --> M3[Click Invoice → Detail Modal]
    M3 --> M4[Download PDF]

    N --> N1[Select Enrolled Course Section]
    N1 --> N2{Enrolled?}
    N2 -- No --> N3[403 Forbidden]
    N2 -- Yes --> N4[View Resources by Category]
    N4 --> N5[Click Download]
    N5 --> N6[Server issues Signed URL]
    N6 --> N7[File Downloaded]

    O --> O1[View Feedback History]
    O1 --> O2[Click Create New]
    O2 --> O3[Fill Subject + Body]
    O3 --> O4[Submit]
    O4 --> O5[Status: Submitted]
```

---

## Lecturer Flow

```mermaid
flowchart TD
    A([Lecturer Login]) --> B[/Lecturer Dashboard/]
    B --> C[View Assigned Sections]
    C --> D[Select Course Section]
    D --> E{Assigned to Section?}
    E -- No --> F[403 Forbidden]
    E -- Yes --> G[/Section Resource Manager/]

    G --> H[View Existing Resources]
    G --> I[Click Upload Resource]

    I --> J[Fill Title · Type · Description]
    J --> K[Attach File]
    K --> L[Server: Validate MIME + Size]
    L --> M{Valid?}
    M -- No --> N[Show validation error]
    M -- Yes --> O[Upload to R2/S3]
    O --> P[Save LearningResource record]
    P --> Q{Publish now?}
    Q -- Yes --> R[Set is_published = true]
    Q -- No --> S[Save as draft]
    R --> T[Resource visible to enrolled students]

    H --> U[Toggle Publish / Unpublish]
    H --> V[Edit Resource Metadata]
    H --> W[Delete Resource]
    W --> X[Confirm Modal]
    X --> Y[Resource + Attachments deleted]

    G --> Z[Post Course Announcement]
    Z --> AA[Fill title + body]
    AA --> AB[Submit → appears in student Resources page]
```

---

## Admin Flow

```mermaid
flowchart TD
    A([Admin Login]) --> B[/Admin Dashboard/]

    B --> C[/User Management/]
    C --> C1[Create User]
    C1 --> C2[Assign Role: student / lecturer / admin]
    C2 --> C3[Create linked Student or Lecturer profile]
    C --> C4[Edit User: change role, reset password, deactivate]

    B --> D[/Programme & Course Setup/]
    D --> D1[Create Programme]
    D1 --> D2[Create Semesters for Programme]
    D2 --> D3[Create Courses]
    D3 --> D4[Create CourseSections\n link Course + Semester + Schedule]

    B --> E[/Assignment Management/]
    E --> E1[Select CourseSection]
    E1 --> E2[Select Lecturer]
    E2 --> E3[Create TeachingAssignment]
    E3 --> E4[Lecturer can now upload to this section]

    B --> F[/Enrollment Management/]
    F --> F1[Select Student]
    F1 --> F2[Select CourseSection]
    F2 --> F3[Create StudentSectionEnrollment]
    F3 --> F4[Student can now access resources for this section]

    B --> G[/Request Moderation/]
    G --> G1[Review Add/Drop Requests]
    G1 --> G2{Decision}
    G2 -- Approve --> G3[Update enrollment status]
    G2 -- Reject --> G4[Notify student of rejection]

    G --> G5[Review Progression Requests]
    G5 --> G6{Decision}
    G6 -- Approve --> G7[Update programme enrollment]
    G6 -- Reject --> G8[Notify student]

    B --> H[/Resource Moderation/]
    H --> H1[View all resources across all sections]
    H1 --> H2[Unpublish or Delete inappropriate content]

    B --> I[/Announcements/]
    I --> I1[Create global announcement]
    I1 --> I2[Visible on all student dashboards]
```
