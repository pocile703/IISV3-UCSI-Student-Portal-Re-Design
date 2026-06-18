# UCSI College Student Portal — Redesign

**HCI Assignment 2** · UCSI College

A full-stack redesign of the legacy IISV2 student portal. Built as a role-aware web application with a built-in Learning Resources module to replace the external thecn.com platform.

---

## Features

### Student
- Dashboard with CGPA, schedule, announcements, balance summary
- Academic records — semester results, attendance, class schedule
- Timetable — weekly grid and agenda view
- Classes — learning resources grouped by subject and type (slides, tutorials, assignments, recordings)
- File downloads — gated to enrolled sections
- Finance — invoice history, payment records, downloadable receipts
- Feedback — submit and track support requests
- Profile — personal info, programme enrolment, e-portfolio (thecn.com) link

### Lecturer
- Dashboard with pending tasks, activity feed, section summary
- Resource management — upload, publish, edit, and delete files per section
- Post management — create announcements, pin and moderate posts per section
- Attendance — mark P/A/L/E per session with auto-derived date list
- Timetable — teaching schedule view
- Profile — employment info and e-portfolio link

### Admin
- User management — create, edit, deactivate accounts; role changes (Lecturer ↔ Admin)
- Programme management — create, edit, archive programmes
- Sections management — create, edit, deactivate sections; assign lecturers
- Post moderation — system-wide post search, filter, publish, pin, and remove
- Resource moderation — publish and remove resources across all sections
- Dashboard — system stats, lecturer assignments, activity feed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (base-nova / @base-ui/react) |
| Auth | Auth.js v5 (next-auth@beta) — JWT, CredentialsProvider |
| ORM | Prisma 7 (PrismaPg adapter) |
| Database | PostgreSQL 16 (Docker) |
| Language | TypeScript |
| Storage | Local filesystem (`app/uploads/`) |

---

## Project Structure

```
.
├── app/                  # Next.js application
│   ├── src/
│   │   ├── app/          # Routes (App Router)
│   │   │   ├── (portal)/ # Authenticated pages — dashboard, classes, admin, lecturer, etc.
│   │   │   ├── login/    # Public login page
│   │   │   └── api/      # Route handlers (auth, file upload, file download)
│   │   ├── components/   # UI components by domain
│   │   ├── services/     # Prisma query modules (one per page)
│   │   ├── lib/          # Shared utilities (auth, storage, session guard, schemas)
│   │   └── types/        # TypeScript view-model types
│   ├── prisma/
│   │   ├── schema.prisma # Database schema (20 models)
│   │   ├── seed.ts       # Seed data
│   │   └── migrations/   # Applied migrations
│   └── docker-compose.yml
├── docs/                 # Architecture documentation
└── Notes/                # Dev log, roadmap, bug tracker
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)

### 1. Start the database

```bash
cd app
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

Create `app/.env.local`:

```env
DATABASE_URL="postgresql://ucsi:ucsi_dev@localhost:5432/ucsi_portal"
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"
```

### 4. Apply migrations and seed

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/scripts/updateStudentEmails.ts
npx tsx prisma/scripts/seedPasswords.ts
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Test Accounts

All accounts use the password: **`ucsi2024`**

| Role | Login field | Example |
|---|---|---|
| Student | Institutional email | `2002400001@ucsicollege.edu.my` |
| Lecturer | Username | `amirul.hassan` |
| Admin | Username | `admin.farouk` |

---

## Documentation

Architecture and design decisions are in `docs/`:

| File | Contents |
|---|---|
| `plan.md` | Full project plan and phase breakdown |
| `database-schema.md` | Table definitions and schema decisions |
| `auth-flow.md` | Auth.js session flow and RBAC design |
| `api-routes.md` | API route reference |
| `security-notes.md` | Security invariants and authorization patterns |
| `design-system.md` | Design tokens, component conventions |

Development history: `Notes/dev-log.md` · `Notes/roadmap.md` · `Notes/bugs.md`


**Made by pocile703.**
**FOR EDUCATIONAL PURPOSES ONLY**
CREATED USING REFERENCES FROM THE UCSI STUDENT PORTAN (IISV2) AND WITH **AI ASSISTANCE**
