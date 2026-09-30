-- Consolidate identifiers: `customUserId` becomes the single, prefixed ID for
-- every user and the redundant, student-only `studentId` column is removed.
--
-- Non-destructive with respect to user accounts: no user row is deleted, and
-- only the identifier columns change.

-- 1. Reformat the generator so newly issued IDs carry the `GSM-` prefix.
--    The numeric part stays zero-padded to 3 digits and expands on its own past
--    999 (`GSM-1000`, `GSM-10001`, ...), so no fixed width or maximum applies.
CREATE OR REPLACE FUNCTION "next_custom_user_id"()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT 'GSM-' || CASE
    WHEN sequence_value < 1000 THEN LPAD(sequence_value::TEXT, 3, '0')
    ELSE sequence_value::TEXT
  END
  FROM (
    SELECT nextval('"User_customUserId_seq"') AS sequence_value
  ) AS next_id;
$$;

-- 2. Reformat identifiers already stored, so no row keeps a bare `001` value.
--    The column is NOT NULL and UNIQUE and the rewrite is a single statement
--    per row, so uniqueness still holds (stripping the same prefix back off
--    yields the original unique numeric value).
UPDATE "User"
SET "customUserId" = 'GSM-' || regexp_replace("customUserId", '\D', '', 'g');

-- 3. Drop the student-only identifier. The CHECK constraint is removed first
--    because it references the column being dropped.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_student_requires_studentId";

DROP INDEX IF EXISTS "User_studentId_key";

ALTER TABLE "User" DROP COLUMN IF EXISTS "studentId";