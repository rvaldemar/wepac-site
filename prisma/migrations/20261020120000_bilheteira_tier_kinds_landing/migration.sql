-- CreateEnum
CREATE TYPE "TicketTierKind" AS ENUM ('single', 'bundle', 'group', 'phase', 'request');

-- CreateEnum
CREATE TYPE "TierStateOverride" AS ENUM ('auto', 'sold_out', 'closed');

-- CreateEnum
CREATE TYPE "TierRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "directions" TEXT,
ADD COLUMN     "emailNote" TEXT,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "program" JSONB,
ADD COLUMN     "seoDescription" TEXT;

-- AlterTable
ALTER TABLE "ticket_tiers" ADD COLUMN     "ctaLabel" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "emailCtaLabel" TEXT,
ADD COLUMN     "emailCtaUrl" TEXT,
ADD COLUMN     "emailNote" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideUnitPrice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kind" "TicketTierKind" NOT NULL DEFAULT 'single',
ADD COLUMN     "lockedNote" TEXT,
ADD COLUMN     "maxPerOrder" INTEGER,
ADD COLUMN     "minSeats" INTEGER,
ADD COLUMN     "phaseGroup" TEXT,
ADD COLUMN     "phaseOrder" INTEGER,
ADD COLUMN     "referencePriceCents" INTEGER,
ADD COLUMN     "salesEndAt" TIMESTAMP(3),
ADD COLUMN     "salesStartAt" TIMESTAMP(3),
ADD COLUMN     "seatsPerUnit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "stateOverride" "TierStateOverride" NOT NULL DEFAULT 'auto',
ADD COLUMN     "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "event_guests" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "photo" TEXT,
    "revealAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_requests" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "website" TEXT,
    "message" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "TierRequestStatus" NOT NULL DEFAULT 'pending',
    "ticketId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_waitlist_entries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_guests_eventId_sortOrder_idx" ON "event_guests"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "tier_requests_ticketId_key" ON "tier_requests"("ticketId");

-- CreateIndex
CREATE INDEX "tier_requests_eventId_status_idx" ON "tier_requests"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tier_waitlist_entries_tierId_email_key" ON "tier_waitlist_entries"("tierId", "email");

-- CreateIndex
CREATE INDEX "ticket_tiers_eventId_phaseGroup_idx" ON "ticket_tiers"("eventId", "phaseGroup");

-- AddForeignKey
ALTER TABLE "event_guests" ADD CONSTRAINT "event_guests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_requests" ADD CONSTRAINT "tier_requests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_requests" ADD CONSTRAINT "tier_requests_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_requests" ADD CONSTRAINT "tier_requests_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_requests" ADD CONSTRAINT "tier_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ticketing_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_waitlist_entries" ADD CONSTRAINT "tier_waitlist_entries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_waitlist_entries" ADD CONSTRAINT "tier_waitlist_entries_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "ticket_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

