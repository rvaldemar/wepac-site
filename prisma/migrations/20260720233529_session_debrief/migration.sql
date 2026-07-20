-- CreateEnum
CREATE TYPE "DebriefStatus" AS ENUM ('ready', 'failed');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "transcriptUploadedAt" TIMESTAMP(3),
ADD COLUMN     "transcriptUploadedById" TEXT;

-- CreateTable
CREATE TABLE "session_debriefs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "DebriefStatus" NOT NULL,
    "engineImpl" TEXT,
    "model" TEXT,
    "perAttendeeSuggestions" JSONB,
    "internalEvaluation" JSONB,
    "resultDocumentHtml" TEXT,
    "error" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "session_debriefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_debriefs_sessionId_key" ON "session_debriefs"("sessionId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_transcriptUploadedById_fkey" FOREIGN KEY ("transcriptUploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_debriefs" ADD CONSTRAINT "session_debriefs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_debriefs" ADD CONSTRAINT "session_debriefs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
