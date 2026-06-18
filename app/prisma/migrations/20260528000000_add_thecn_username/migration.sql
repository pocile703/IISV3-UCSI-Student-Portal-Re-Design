-- Add thecnUsername to Student and Lecturer for E-Portfolio links
ALTER TABLE "Student"  ADD COLUMN "thecnUsername" VARCHAR(100);
ALTER TABLE "Lecturer" ADD COLUMN "thecnUsername" VARCHAR(100);
