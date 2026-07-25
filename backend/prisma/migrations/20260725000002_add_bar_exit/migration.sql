-- AlterTable
ALTER TABLE "Bar" ADD COLUMN     "exitId" TEXT;

-- AddForeignKey
ALTER TABLE "Bar" ADD CONSTRAINT "Bar_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "MaterialExit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
