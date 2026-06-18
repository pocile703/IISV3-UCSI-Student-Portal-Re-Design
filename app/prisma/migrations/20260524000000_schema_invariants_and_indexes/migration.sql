-- AlterEnum: remove PENDING_ADD and PENDING_DROP — pending state belongs only in AddDropRequest
-- SAFETY ASSUMPTION: no existing rows carry PENDING_ADD or PENDING_DROP. The USING cast below
-- will fail with a "invalid input value" error if any such rows exist. Safe to apply on clean
-- dev data (DB has been seeded from mock data only); on a live DB, run a pre-migration UPDATE
-- or verify with: SELECT COUNT(*) FROM "StudentSectionEnrollment" WHERE status IN ('PENDING_ADD','PENDING_DROP');
BEGIN;
CREATE TYPE "SectionEnrollmentStatus_new" AS ENUM ('ENROLLED', 'DROPPED');
ALTER TABLE "public"."StudentSectionEnrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StudentSectionEnrollment" ALTER COLUMN "status" TYPE "SectionEnrollmentStatus_new" USING ("status"::text::"SectionEnrollmentStatus_new");
ALTER TYPE "SectionEnrollmentStatus" RENAME TO "SectionEnrollmentStatus_old";
ALTER TYPE "SectionEnrollmentStatus_new" RENAME TO "SectionEnrollmentStatus";
DROP TYPE "public"."SectionEnrollmentStatus_old";
ALTER TABLE "StudentSectionEnrollment" ALTER COLUMN "status" SET DEFAULT 'ENROLLED';
COMMIT;

-- CreateIndex: supporting unique for the composite FK below
CREATE UNIQUE INDEX "ProgrammeEnrollment_id_studentId_key" ON "ProgrammeEnrollment"("id", "studentId");

-- AddForeignKey (composite): enforces Invoice cannot reference an enrollment belonging to a
-- different student. Prisma cannot express this via @relation (studentId is already a FK to
-- Student on Invoice, and Prisma forbids a scalar in two relation field lists). Both FKs
-- coexist in PostgreSQL: the existing Invoice_programmeEnrollmentId_fkey (single-column) and
-- this composite FK are independent constraints.
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_programmeEnrollmentId_studentId_fkey"
  FOREIGN KEY ("programmeEnrollmentId", "studentId")
  REFERENCES "ProgrammeEnrollment"("id", "studentId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: "who teaches this section?" — student timetable + enrollment queries
CREATE INDEX "TeachingAssignment_courseSectionId_idx" ON "TeachingAssignment"("courseSectionId");

-- CreateIndex: lecturer mark-attendance path — roster for a section on a given date
CREATE INDEX "Attendance_courseSectionId_date_idx" ON "Attendance"("courseSectionId", "date");
