-- AlterTable
ALTER TABLE "MaterialExit" ADD COLUMN     "clientId" TEXT;

-- AddForeignKey
ALTER TABLE "MaterialExit" ADD CONSTRAINT "MaterialExit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
