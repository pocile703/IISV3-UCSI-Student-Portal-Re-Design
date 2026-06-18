# Feature Dependencies

Shows which features depend on other features or data being set up first. Use this to determine build order.

> The graphify "Implementation Phases" community (cohesion 0.40) and "Feature Dependency Map" community (cohesion 0.20) confirm that the phase sequencing is logically consistent. The build order below is the authoritative delivery sequence.

```mermaid
graph TD
    subgraph Foundation
        A[User + Auth]
        B[Role System]
        C[Session Management]
    end

    subgraph Academic_Setup["Academic Setup (Admin)"]
        D[Programme]
        E[Semester]
        F[Course]
        G[CourseSection]
    end

    subgraph People_Setup["People Setup (Admin)"]
        H[Student Profile]
        I[Lecturer Profile]
    end

    subgraph Assignments["Assignments (Admin)"]
        J[ProgrammeEnrollment\nStudent → Programme]
        K[TeachingAssignment\nLecturer → Section]
        L[StudentSectionEnrollment\nStudent → Section]
    end

    subgraph Student_Features["Student Features"]
        M[Dashboard Widgets]
        N[Academic Records]
        O[Timetable]
        P[Financial Statement]
        Q[Profile]
        R[Feedback]
        S[Add/Drop Requests]
        T[Learning Resources - Student]
    end

    subgraph Lecturer_Features["Lecturer Features"]
        U[Lecturer Dashboard]
        V[Upload Resources]
        W[Post Announcements]
    end

    subgraph Admin_Features["Admin Features"]
        X[User Management]
        Y[Programme Management]
        Z[Request Moderation]
        AA[Resource Moderation]
    end

    subgraph Financial["Financial System"]
        BB[Invoice]
        CC[Payment]
    end

    %% Foundation dependencies
    A --> B
    A --> C
    B --> H
    B --> I

    %% Academic setup chain
    D --> E
    E --> F
    F --> G

    %% People setup needs auth
    A --> H
    A --> I

    %% Assignments need both setup chains
    H --> J
    D --> J
    I --> K
    G --> K
    H --> L
    G --> L

    %% Student features need enrollment
    J --> M
    J --> N
    L --> O
    J --> P
    H --> Q
    H --> R
    L --> S
    L --> T

    %% T (Resources student) needs K (Teaching) because resources exist only when lecturers upload
    K --> T

    %% Lecturer features
    K --> U
    K --> V
    K --> W

    %% Financial
    J --> BB
    BB --> CC

    %% Financial widget on dashboard
    BB --> M

    %% Admin manages everything
    A --> X
    D --> Y
    S --> Z
    V --> AA

    %% Dashboard also needs timetable + results
    N --> M
    O --> M

    style Foundation fill:#fef3c7,stroke:#d97706
    style Academic_Setup fill:#dbeafe,stroke:#2563eb
    style People_Setup fill:#dcfce7,stroke:#16a34a
    style Assignments fill:#f3e8ff,stroke:#9333ea
    style Student_Features fill:#fce7f3,stroke:#db2777
    style Lecturer_Features fill:#fff7ed,stroke:#ea580c
    style Admin_Features fill:#f0fdf4,stroke:#15803d
    style Financial fill:#fef2f2,stroke:#dc2626
```

---

## Build Order (Phase Sequence)

```mermaid
graph LR
    P1[Phase 1\nAuth + DB + Layout] --> P2[Phase 2\nStudent Portal\nPages]
    P2 --> P3[Phase 3\nLearning Resources\nModule]
    P3 --> P4[Phase 4\nAdmin Panel]
    P4 --> P5[Phase 5\nPolish + Mobile\n+ Accessibility]

    P1:::phase
    P2:::phase
    P3:::phase
    P4:::phase
    P5:::phase

    classDef phase fill:#1e293b,color:#f8fafc,stroke:none
```

---

## Module Interdependencies

```mermaid
graph TD
    Auth["🔐 Auth Module\n(User, Session, Role)"]
    Academic["🎓 Academic Module\n(Programme, Semester, Course, Result)"]
    Timetable["📅 Timetable Module\n(CourseSection schedule)"]
    Financial["💳 Financial Module\n(Invoice, Payment)"]
    Resources["📚 Resources Module\n(LearningResource, Attachment)"]
    Feedback["💬 Feedback Module"]
    Notifications["🔔 Notifications Module"]
    Workflow["⚙️ Workflow Module\n(AddDrop, Progression)"]
    Admin["🛠️ Admin Module"]

    Auth --> Academic
    Auth --> Financial
    Auth --> Resources
    Auth --> Feedback
    Auth --> Notifications
    Auth --> Workflow
    Auth --> Admin

    Academic --> Timetable
    Academic --> Resources
    Academic --> Financial
    Academic --> Workflow

    Timetable --> Resources
    Workflow --> Notifications
    Financial --> Notifications
    Resources --> Notifications
    Admin --> Notifications
```
