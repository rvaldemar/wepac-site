-- Payment status enum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'expired');

-- Payment table
CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'stripe',
  "providerRef" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'eur',
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "eventId" TEXT NOT NULL,
  "tierId" TEXT NOT NULL,
  "seats" INTEGER NOT NULL DEFAULT 1,
  "buyerName" TEXT NOT NULL,
  "buyerEmail" TEXT NOT NULL,
  "buyerPhone" TEXT,
  "metadata" JSONB,
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_providerRef_key" ON "payments"("providerRef");
CREATE INDEX "payments_eventId_status_idx" ON "payments"("eventId", "status");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_eventId_fkey" FOREIGN KEY ("eventId")
    REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "payments_tierId_fkey" FOREIGN KEY ("tierId")
    REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ticket.paymentId (optional one-to-one back-ref)
ALTER TABLE "tickets" ADD COLUMN "paymentId" TEXT;
CREATE UNIQUE INDEX "tickets_paymentId_key" ON "tickets"("paymentId");
ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_paymentId_fkey" FOREIGN KEY ("paymentId")
    REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
