-- A Pack/Journey (Cohort) is just a community/context — not every
-- mentoring session belongs to one. `sessions.cohortId` becomes optional,
-- and `session_attendees` moves from being keyed by CohortMembership to
-- being keyed by User (same reasoning already applied to Evaluation /
-- LifePlan / StrategicPlan / StrategicMapScore in migration
-- 20260720220000): attendees are people, not pack enrollments.
--
-- Backfilled from each attendee's current membership's own userId
-- (`cohort_memberships."userId"`) before the old membershipId column is
-- dropped, so no attendance data is lost.

-- ===== SESSIONS: cohortId becomes optional =====

ALTER TABLE "sessions" ALTER COLUMN "cohortId" DROP NOT NULL;

-- ===== SESSION ATTENDEES: membershipId -> userId =====

ALTER TABLE "session_attendees" ADD COLUMN "userId" TEXT;

UPDATE "session_attendees" sa
SET "userId" = cm."userId"
FROM "cohort_memberships" cm
WHERE cm."id" = sa."membershipId";

ALTER TABLE "session_attendees" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "session_attendees" DROP CONSTRAINT "session_attendees_membershipId_fkey";

DROP INDEX "session_attendees_sessionId_membershipId_key";

ALTER TABLE "session_attendees" DROP COLUMN "membershipId";

ALTER TABLE "session_attendees" ADD CONSTRAINT "session_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "session_attendees_sessionId_userId_key" ON "session_attendees"("sessionId", "userId");
