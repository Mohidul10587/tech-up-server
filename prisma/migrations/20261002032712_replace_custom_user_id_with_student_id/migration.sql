/*
  Warnings:

  - You are about to drop the column `customUserId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_customUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "customUserId",
ADD COLUMN     "studentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE INDEX "User_studentId_idx" ON "User"("studentId");
