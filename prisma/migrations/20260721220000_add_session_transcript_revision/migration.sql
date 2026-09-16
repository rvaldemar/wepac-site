-- A monotonic source version prevents an in-flight debrief from being
-- persisted after a same-content transcript replacement (including A-B-A).
ALTER TABLE "sessions"
ADD COLUMN "transcriptRevision" INTEGER NOT NULL DEFAULT 0;
