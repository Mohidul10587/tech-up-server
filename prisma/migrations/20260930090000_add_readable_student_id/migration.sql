-- Each student receives a human-readable, stable identifier. It remains
-- nullable because administrators and other non-student users do not have one.
ALTER TABLE "User" ADD COLUMN "studentId" TEXT;

-- Backfill current students in creation order. The zero-padded sequence keeps
-- lexicographic ordering equal to numeric ordering for future allocations.
WITH numbered_students AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS sequence
  FROM "User"
  WHERE "role" = 'STUDENT'
)
UPDATE "User" AS student
SET "studentId" = 'GSM-' || LPAD(numbered_students.sequence::TEXT, 8, '0')
FROM numbered_students
WHERE student."id" = numbered_students."id";

CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");
