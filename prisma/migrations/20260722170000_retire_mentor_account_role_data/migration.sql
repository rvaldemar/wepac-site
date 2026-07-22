-- Mentor is a directed relationship capability, not an account role. Keep the
-- old enum value physically available during Release A so the previously
-- running application remains migration-compatible, but remove every live row
-- before the target runtime starts. The marker is deliberately not exposed in
-- the target Prisma model: it exists only so a Release A application rollback
-- can restore the previous role contract before restarting the old runtime.
-- Release B removes both the marker and the enum value after stability proof.
ALTER TABLE "users"
ADD COLUMN "_legacyMentorAccountRole" BOOLEAN NOT NULL DEFAULT false;

UPDATE "users"
SET
    "_legacyMentorAccountRole" = true,
    "role" = 'member'
WHERE "role" = 'mentor';
