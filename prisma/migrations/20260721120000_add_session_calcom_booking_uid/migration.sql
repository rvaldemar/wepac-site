-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "calcomBookingUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_calcomBookingUid_key" ON "sessions"("calcomBookingUid");
