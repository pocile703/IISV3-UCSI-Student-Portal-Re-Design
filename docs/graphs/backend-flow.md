# Backend / API Flow

All flows below were validated by the graphify knowledge graph. The "Middleware & Session Guard" community (cohesion 0.67) and the "Security: Auth Hardening" community (cohesion 0.67) confirm that the auth and request lifecycle design is internally consistent.

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware as Next.js Middleware
    participant Route as API Route Handler
    participant Auth as Auth.js
    participant Prisma
    participant DB as PostgreSQL
    participant Storage as R2 / S3

    Browser->>Middleware: HTTP Request (any route)
    Middleware->>Auth: getToken(req)
    Auth-->>Middleware: token | null

    alt No token
        Middleware-->>Browser: 302 Redirect /login
    else Token present
        Middleware->>Middleware: Check role vs route pattern
        alt Wrong role
            Middleware-->>Browser: 302 Redirect /unauthorized
        else Correct role
            Middleware-->>Route: Pass through
        end
    end

    Route->>Auth: auth() — re-validate session
    Auth-->>Route: session | null

    alt No session (double check)
        Route-->>Browser: 401 Unauthorized
    end

    Route->>Route: Validate request body (Zod)
    alt Invalid body
        Route-->>Browser: 422 Unprocessable Entity
    end

    Route->>Prisma: Query (with role-scoped WHERE clause)
    Prisma->>DB: Parameterized SQL
    DB-->>Prisma: Result rows
    Prisma-->>Route: Typed model objects

    Route-->>Browser: 200 { data: ... }
```

---

## Resource Upload Flow (Lecturer)

```mermaid
sequenceDiagram
    participant Lecturer as Lecturer Browser
    participant API as POST /api/lecturer/resources/[sectionId]
    participant DB as PostgreSQL
    participant Storage as Cloudflare R2

    Lecturer->>API: multipart/form-data\n(title, type, description, file)

    API->>DB: SELECT FROM TeachingAssignment\nWHERE lecturer_id = session.lecturerId\nAND course_section_id = sectionId
    DB-->>API: assignment | null

    alt Not assigned
        API-->>Lecturer: 403 Forbidden
    end

    API->>API: Validate MIME type (magic bytes)
    API->>API: Check file size ≤ 100MB

    alt Invalid file
        API-->>Lecturer: 400 Bad Request
    end

    API->>Storage: PUT object\nKey: resources/{sectionId}/{resourceId}/{uuid}-{filename}\nACL: private
    Storage-->>API: object key

    API->>DB: INSERT LearningResource
    API->>DB: INSERT ResourceAttachment
    DB-->>API: created records

    API-->>Lecturer: 201 { data: { resourceId, ... } }
```

---

## Resource Download Flow (Student)

```mermaid
sequenceDiagram
    participant Student as Student Browser
    participant API as GET /api/student/resources/[sectionId]/download/[attachmentId]
    participant DB as PostgreSQL
    participant Storage as Cloudflare R2

    Student->>API: GET request (session cookie)

    API->>DB: SELECT FROM StudentSectionEnrollment\nWHERE student_id = session.studentId\nAND course_section_id = sectionId\nAND status = 'enrolled'
    DB-->>API: enrollment | null

    alt Not enrolled
        API-->>Student: 403 Forbidden
    end

    API->>DB: SELECT FROM ResourceAttachment WHERE id = attachmentId
    DB-->>API: attachment record

    alt Not found or not in this section
        API-->>Student: 404 Not Found
    end

    API->>Storage: GeneratePresignedUrl\n(key: attachment.storage_key, expiry: 900s)
    Storage-->>API: signed URL

    API->>DB: UPDATE ResourceAttachment SET download_count = download_count + 1
    DB-->>API: ok

    API-->>Student: 302 Redirect to signed URL
    Student->>Storage: GET signed URL
    Storage-->>Student: File content
```

---

## Auth Login Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Login as /api/auth/[...nextauth]
    participant DB as PostgreSQL

    Browser->>Login: POST { username, password }
    Login->>DB: SELECT User WHERE username = $1 AND is_active = true
    DB-->>Login: user | null

    alt User not found
        Login-->>Browser: 401 { error: "Invalid credentials" }
    end

    Login->>Login: bcrypt.compare(password, user.password_hash)

    alt Password mismatch
        Login-->>Browser: 401 { error: "Invalid credentials" }
    end

    Login->>DB: INSERT Session { userId, token, expires }
    DB-->>Login: session

    Login-->>Browser: 200 Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax
    Browser->>Browser: Redirect to role-based dashboard
```

---

## Middleware Route Protection Map

```mermaid
flowchart TD
    Request([Incoming Request]) --> MW[Middleware: getToken]

    MW --> T{Token valid?}
    T -- No --> RedirectLogin[Redirect /login]

    T -- Yes --> Role{User role?}

    Role -- student --> StudentRoute{Route starts with?}
    StudentRoute -- /dashboard\n/academic\n/timetable\n/financial\n/resources\n/feedback --> AllowStudent[Allow]
    StudentRoute -- /lecturer\n/admin --> DenyStudent[Redirect /unauthorized]
    StudentRoute -- /profile --> AllowStudent

    Role -- lecturer --> LecturerRoute{Route starts with?}
    LecturerRoute -- /lecturer --> AllowLecturer[Allow]
    LecturerRoute -- /dashboard\n/admin --> DenyLecturer[Redirect /unauthorized]
    LecturerRoute -- /profile --> AllowLecturer

    Role -- admin --> AdminRoute{Route starts with?}
    AdminRoute -- /admin --> AllowAdmin[Allow]
    AdminRoute -- /dashboard\n/lecturer --> DenyAdmin[Redirect /unauthorized]
    AdminRoute -- /profile --> AllowAdmin
```
