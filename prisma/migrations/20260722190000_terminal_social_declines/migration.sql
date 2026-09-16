-- Keep target-controlled refusals distinct without adding an enum value that
-- the rollback Prisma client cannot decode. `removed` remains the compatible
-- physical status; this marker makes a Person's decline terminal.
ALTER TABLE "pack_memberships"
    ADD COLUMN "declinedAt" TIMESTAMP(3);
