-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Card_releasedAt_idx" ON "Card"("releasedAt");
