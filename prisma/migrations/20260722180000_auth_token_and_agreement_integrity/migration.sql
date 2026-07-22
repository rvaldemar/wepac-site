-- Release A authentication/consent integrity. All changes are additive and
-- readable by the previously running application while it is quiesced for the
-- migration. Never silently discard duplicate consent evidence: an unexpected
-- duplicate aborts for explicit review.

DO $agreements_must_be_unique$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "agreements"
        GROUP BY "userId", "version"
        HAVING count(*) > 1
    )
    THEN
        RAISE EXCEPTION
            'Duplicate Agreement evidence requires explicit review';
    END IF;
END
$agreements_must_be_unique$;

CREATE UNIQUE INDEX "agreements_userId_version_key"
    ON "agreements"("userId", "version");

ALTER TABLE "password_reset_tokens"
    ADD COLUMN "usedAt" TIMESTAMP(3),
    ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE INDEX "password_reset_tokens_userId_createdAt_idx"
    ON "password_reset_tokens"("userId", "createdAt");

ALTER TABLE "users"
    ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;
