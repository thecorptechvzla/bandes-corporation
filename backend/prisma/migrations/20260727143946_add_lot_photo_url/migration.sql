/*
  Warnings:

  - A unique constraint covering the columns `[clientId,barNumber]` on the table `Bar` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PackingStatus" AS ENUM ('PENDING', 'VALIDATED');

-- DropIndex
DROP INDEX "Bar_barNumber_key";

-- AlterTable
ALTER TABLE "Bar" ADD COLUMN     "packingId" TEXT,
ADD COLUMN     "photo_url" TEXT,
ALTER COLUMN "status" SET DEFAULT 'POR_VALIDAR';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "contactInfo" TEXT;

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "photo_url" TEXT;

-- CreateTable
CREATE TABLE "Packing" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "packing_number" INTEGER,
    "totalRows" INTEGER NOT NULL,
    "created" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "errors" JSONB,
    "status" "PackingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Packing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bar_clientId_barNumber_key" ON "Bar"("clientId", "barNumber");

-- AddForeignKey
ALTER TABLE "Bar" ADD CONSTRAINT "Bar_packingId_fkey" FOREIGN KEY ("packingId") REFERENCES "Packing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
