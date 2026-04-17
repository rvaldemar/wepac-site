-- Add email verification fields to ticketing_admins
ALTER TABLE "ticketing_admins"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "verificationToken" TEXT,
  ADD COLUMN "verificationExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ticketing_admins_verificationToken_key"
  ON "ticketing_admins"("verificationToken");

-- Make events.createdById nullable + SetNull on admin delete
ALTER TABLE "events" DROP CONSTRAINT "events_createdById_fkey";
ALTER TABLE "events" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "events"
  ADD CONSTRAINT "events_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "ticketing_admins"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: mark existing admin(s) as already verified so they can still log in
UPDATE "ticketing_admins" SET "emailVerifiedAt" = NOW() WHERE "emailVerifiedAt" IS NULL;
