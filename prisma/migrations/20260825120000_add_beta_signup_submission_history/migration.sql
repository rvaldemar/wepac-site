-- Add an intake event ledger without changing BetaSignup's canonical email
-- identity or backfilling historic records from inferred data.

-- CreateEnum
CREATE TYPE "BetaSignupSubmissionSource" AS ENUM (
    'generic_intake',
    'society',
    'life_plan',
    'familias',
    'academy',
    'upgraded_backpack',
    'organizations',
    'artist_page'
);

-- CreateEnum
CREATE TYPE "BetaSignupSubmissionState" AS ENUM ('canonical', 'unverified');

-- CreateTable
CREATE TABLE "beta_signup_submissions" (
    "id" TEXT NOT NULL,
    "betaSignupId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "BetaSignupSubmissionSource" NOT NULL,
    "state" "BetaSignupSubmissionState" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "artisticArea" TEXT,
    "socialLinks" TEXT,
    "motivation" TEXT,

    CONSTRAINT "beta_signup_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beta_signup_submissions_betaSignupId_submittedAt_idx"
    ON "beta_signup_submissions"("betaSignupId", "submittedAt");

-- AddForeignKey
ALTER TABLE "beta_signup_submissions"
    ADD CONSTRAINT "beta_signup_submissions_betaSignupId_fkey"
    FOREIGN KEY ("betaSignupId") REFERENCES "beta_signups"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce append-only history while still allowing the required parent-driven
-- GDPR cascade. The parent row is already absent when its FK cascade runs.
CREATE FUNCTION "protect_beta_signup_submission_history"()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR EXISTS (
        SELECT 1 FROM "beta_signups" WHERE "id" = OLD."betaSignupId"
    ) THEN
        RAISE EXCEPTION 'beta signup submission history is append-only';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "beta_signup_submissions_append_only"
    BEFORE UPDATE OR DELETE ON "beta_signup_submissions"
    FOR EACH ROW EXECUTE FUNCTION "protect_beta_signup_submission_history"();
