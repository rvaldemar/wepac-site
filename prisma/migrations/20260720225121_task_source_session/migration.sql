-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "sourceSessionId" TEXT;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sourceSessionId_fkey" FOREIGN KEY ("sourceSessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
