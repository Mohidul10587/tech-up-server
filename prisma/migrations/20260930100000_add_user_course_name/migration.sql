-- Add the optional course to every user row without changing existing data.
-- Existing records receive NULL; only student flows may set a listed course.
ALTER TABLE "User" ADD COLUMN "courseName" TEXT;

-- Keep the database nullable for customers and other roles, while restricting
-- non-NULL values to courses currently offered by the training centre.
ALTER TABLE "User"
ADD CONSTRAINT "User_courseName_valid"
CHECK (
  "courseName" IS NULL
  OR "courseName" IN ('Mobile Repairing', 'English Speaking')
);
