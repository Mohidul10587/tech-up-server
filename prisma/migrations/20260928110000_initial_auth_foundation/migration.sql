-- Initial authentication foundation. This migration only adds new objects.
CREATE TYPE "Role" AS ENUM (
  'ADMIN',
  'CUSTOMER',
  'SHOP_MANAGER',
  'WAREHOUSE_MANAGER',
  'TRAINING_CENTER_MANAGER'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
