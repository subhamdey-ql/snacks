-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "email" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMenu" (
    "date" TIMESTAMP(3) NOT NULL,
    "snackId" INTEGER NOT NULL,

    CONSTRAINT "DailyMenu_pkey" PRIMARY KEY ("date","snackId")
);

-- CreateIndex
CREATE INDEX "OtpCode_email_createdAt_idx" ON "OtpCode"("email", "createdAt");

-- CreateIndex
CREATE INDEX "DailyMenu_date_idx" ON "DailyMenu"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- AddForeignKey
ALTER TABLE "DailyMenu" ADD CONSTRAINT "DailyMenu_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "Snack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

