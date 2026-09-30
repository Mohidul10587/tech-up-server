-- `studentId` is intentionally nullable for non-student roles, but it must
-- always exist for a STUDENT record. Existing students were backfilled by the
-- preceding migration before this constraint is added.
ALTER TABLE "User"
ADD CONSTRAINT "User_student_requires_studentId"
CHECK ("role" <> 'STUDENT' OR "studentId" IS NOT NULL);
