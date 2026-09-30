-- Add the student name and contact fields to "User".
-- Non-destructive: only ADD COLUMN (all nullable) + ADD INDEX.
-- Existing rows get NULL for the new columns and keep working unchanged.
--
-- Rationale: registration collects, in order, batch no, the student's own name,
-- father's name, mother's name, present address, permanent address, the
-- student's phone number, occupation, NID / birth registration number, the
-- guardian's phone number and the student's email. `fullName`,
-- `guardianPhone` and `email` did not exist before this migration; the
-- student's own phone number is the existing `phone` column.

-- Student Information
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;

-- Contact Details
ALTER TABLE "User" ADD COLUMN "guardianPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- Lookup indexes
CREATE INDEX "User_fullName_idx" ON "User"("fullName");
CREATE INDEX "User_guardianPhone_idx" ON "User"("guardianPhone");
CREATE INDEX "User_email_idx" ON "User"("email");
