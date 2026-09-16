-- Persist ordering for calendar notifications and support an atomic,
-- database-clock Message burst lookup. Both changes are additive so the
-- previous Release A runtime can continue writing during cutover.

ALTER TABLE "sessions"
    ADD COLUMN "calendarRevision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_calendarRevision_nonnegative_check"
    CHECK ("calendarRevision" >= 0);

CREATE INDEX "messages_conversationId_userId_createdAt_idx"
    ON "messages"("conversationId", "userId", "createdAt");
