-- Add a globally unique, system-generated user ID for every role.
-- The migration only adds/backfills this new identifier; no existing user row
-- is removed and existing user data remains unchanged.

CREATE SEQUENCE "User_customUserId_seq" AS BIGINT START WITH 1 INCREMENT BY 1;

CREATE FUNCTION "next_custom_user_id"()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT CASE
    WHEN sequence_value < 1000 THEN LPAD(sequence_value::TEXT, 3, '0')
    ELSE sequence_value::TEXT
  END
  FROM (
    SELECT nextval('"User_customUserId_seq"') AS sequence_value
  ) AS next_id;
$$;

-- Nullable during the backfill only. It becomes NOT NULL below.
ALTER TABLE "User" ADD COLUMN "customUserId" TEXT;

-- Deterministic backfill for every current user, irrespective of role. Sorting
-- by creation time (then primary key) makes the initial global sequence stable.
--
-- Users that already carry a valid identifier keep it untouched; the numbers
-- below are issued AFTER the highest identifier already in use, so the
-- backfill can never reissue an existing ID and collide with the unique index.
WITH existing_max AS (
  -- Digits only, so a legacy ID such as 'GSM-00000001' still yields 1.
  SELECT COALESCE(
    MAX(NULLIF(regexp_replace("customUserId", '\D', '', 'g'), '')::BIGINT),
    0
  ) AS max_existing
  FROM "User"
  WHERE "customUserId" IS NOT NULL
),
numbered_users AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") + (SELECT max_existing FROM existing_max)
      AS sequence_value
  FROM "User"
  WHERE "customUserId" IS NULL
)
UPDATE "User" AS user_record
SET "customUserId" = CASE
    WHEN numbered_users.sequence_value < 1000
      THEN LPAD(numbered_users.sequence_value::TEXT, 3, '0')
    ELSE numbered_users.sequence_value::TEXT
  END
FROM numbered_users
WHERE user_record."id" = numbered_users."id";

-- Advance the same sequence past every value now stored, so the next insert
-- continues from there instead of reusing a backfilled ID. No fixed maximum is
-- imposed: BIGINT and the formatting function expand naturally beyond 999.
SELECT setval(
  '"User_customUserId_seq"',
  GREATEST(
    (SELECT COALESCE(
      MAX(NULLIF(regexp_replace("customUserId", '\D', '', 'g'), '')::BIGINT),
      0
    ) FROM "User"),
    1
  ),
  EXISTS (SELECT 1 FROM "User")
);

ALTER TABLE "User"
ALTER COLUMN "customUserId" SET DEFAULT "next_custom_user_id"(),
ALTER COLUMN "customUserId" SET NOT NULL;

CREATE UNIQUE INDEX "User_customUserId_key" ON "User"("customUserId");
