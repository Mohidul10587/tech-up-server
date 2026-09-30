-- Add student profile fields to "User".
-- Non-destructive: only ADD COLUMN (all nullable) + ADD INDEX.
-- No existing data is modified or removed, so every current row gets NULL
-- for the new columns and continues to work as before.

-- Student Information
ALTER TABLE "User" ADD COLUMN "batchNo" TEXT;
ALTER TABLE "User" ADD COLUMN "fatherName" TEXT;
ALTER TABLE "User" ADD COLUMN "motherName" TEXT;
ALTER TABLE "User" ADD COLUMN "presentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "permanentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "occupation" TEXT;

-- Student Identification
-- "nidNumber" and "birthRegistrationNumber" are both optional at the DB level.
-- The "at least one required" rule is enforced in the application layer
-- (student DTO/service validation) because it only applies to STUDENT rows.
ALTER TABLE "User" ADD COLUMN "nidNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "birthRegistrationNumber" TEXT;

-- Student Photo & Documents
ALTER TABLE "User" ADD COLUMN "studentPhoto" TEXT;
ALTER TABLE "User" ADD COLUMN "studentNidFrontImage" TEXT;
ALTER TABLE "User" ADD COLUMN "studentNidBackImage" TEXT;

-- Guardian NID Documents
ALTER TABLE "User" ADD COLUMN "guardianNidFrontImage" TEXT;
ALTER TABLE "User" ADD COLUMN "guardianNidBackImage" TEXT;

-- Lookup indexes
CREATE INDEX "User_nidNumber_idx" ON "User"("nidNumber");
CREATE INDEX "User_birthRegistrationNumber_idx" ON "User"("birthRegistrationNumber");
CREATE INDEX "User_batchNo_idx" ON "User"("batchNo");
CREATE INDEX "User_role_idx" ON "User"("role");
