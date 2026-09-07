-- Additive only: soft-delete marker for ticket tiers. Physical deletion of a
-- tier referenced by payments/tickets violates payments_tierId_fkey (RESTRICT)
-- by design; archiving preserves the sales history the constraint protects.
ALTER TABLE "ticket_tiers" ADD COLUMN "archivedAt" TIMESTAMP(3);
