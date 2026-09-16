-- Cal.com replaces the booking uid on every reschedule. Preserve an immutable
-- alias chain so late at-least-once deliveries cannot create a second Session
-- and cancellation can resolve the newest uid.

CREATE TABLE "calcom_booking_references" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calcom_booking_references_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "calcom_booking_references_uid_key"
    ON "calcom_booking_references"("uid");
CREATE INDEX "calcom_booking_references_sessionId_idx"
    ON "calcom_booking_references"("sessionId");

ALTER TABLE "calcom_booking_references"
    ADD CONSTRAINT "calcom_booking_references_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Release A can already contain Sessions created by the earlier webhook path.
-- Backfill without requiring a database extension or exposing a booking uid.
INSERT INTO "calcom_booking_references" ("id", "sessionId", "uid")
SELECT
    'calref_' || md5("id" || ':' || "calcomBookingUid"),
    "id",
    "calcomBookingUid"
FROM "sessions"
WHERE "calcomBookingUid" IS NOT NULL
ON CONFLICT ("uid") DO NOTHING;
