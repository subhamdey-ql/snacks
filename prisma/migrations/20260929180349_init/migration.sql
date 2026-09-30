-- CreateEnum
CREATE TYPE "EmpType" AS ENUM ('HYBRID', 'WFO');

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EmpType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snack" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Snack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allowance" (
    "id" SERIAL NOT NULL,
    "type" "EmpType" NOT NULL,
    "credits" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumption" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "snackId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "creditsCharged" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),

    CONSTRAINT "Consumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE INDEX "Employee_active_name_idx" ON "Employee"("active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Snack_name_key" ON "Snack"("name");

-- CreateIndex
CREATE INDEX "Snack_active_name_idx" ON "Snack"("active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Allowance_type_effectiveFrom_key" ON "Allowance"("type", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Consumption_employeeId_voidedAt_createdAt_idx" ON "Consumption"("employeeId", "voidedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Consumption_createdAt_voidedAt_idx" ON "Consumption"("createdAt", "voidedAt");

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "Snack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
