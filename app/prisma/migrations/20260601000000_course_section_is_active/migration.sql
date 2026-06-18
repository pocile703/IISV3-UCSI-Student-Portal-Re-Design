-- Add isActive column to CourseSection for soft-deactivation support.
-- All existing rows receive the default value true (no data loss).
ALTER TABLE "CourseSection" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
