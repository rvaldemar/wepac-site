-- AlterTable
ALTER TABLE "session_attendees" ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "privateNote" TEXT,
ADD COLUMN     "sharedNote" TEXT,
ADD COLUMN     "sharedNotePublished" BOOLEAN NOT NULL DEFAULT false;
