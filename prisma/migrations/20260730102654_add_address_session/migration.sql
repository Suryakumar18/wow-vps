-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "addresses_sessionId_idx" ON "addresses"("sessionId");
