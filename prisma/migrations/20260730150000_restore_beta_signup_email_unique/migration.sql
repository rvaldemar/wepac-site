-- The public intake is one Life Plan entry point per person. The temporary
-- multi-offer funnel allowed one BetaSignup row per (email, packSlug), while
-- the target runtime and Prisma schema deliberately restore email as the
-- single identity key.
--
-- Keep the physical packSlug column until the separately approved Release B;
-- this migration only restores the target uniqueness contract. Creating the
-- stronger index first makes the migration fail closed if duplicate emails
-- have appeared, without removing the existing composite protection.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "beta_signups"
        GROUP BY "email"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot restore beta_signups email uniqueness: duplicate emails exist';
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "beta_signups_email_key"
    ON "beta_signups"("email");

DROP INDEX IF EXISTS "beta_signups_email_packSlug_key";

COMMIT;
