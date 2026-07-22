-- WEPAC is launching several public application offers (Society, Summer
-- University, Clínica, ...), each identified by `packSlug`. The previous
-- global `email` unique constraint meant one person could only ever hold a
-- single application across the whole organisation: applying to a second
-- offer silently overwrote (and re-tagged) the first one.
--
-- Safety note: the constraint being dropped (`email` unique across the
-- whole table) is strictly stronger than the composite constraint being
-- added (`email` unique per `packSlug`). Every existing row is already
-- guaranteed unique on `email` alone, so it is necessarily also unique on
-- (`email`, `packSlug`) — this migration cannot fail against any data that
-- satisfied the old constraint, including current production data.
--
-- Run twice: the second run fails outright. `DROP INDEX
-- "beta_signups_email_key"` errors with "index ... does not exist" once the
-- first run has already dropped it, and the migration aborts inside its
-- transaction before the CREATE UNIQUE INDEX statement runs — no partial
-- state, nothing to clean up. In practice `prisma migrate deploy` never
-- attempts this: it tracks applied migrations in `_prisma_migrations` and
-- skips migrations already recorded there.

-- DropIndex
DROP INDEX "beta_signups_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "beta_signups_email_packSlug_key" ON "beta_signups"("email", "packSlug");
