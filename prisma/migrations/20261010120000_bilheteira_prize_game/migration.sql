-- CreateEnum
CREATE TYPE "PrizeKind" AS ENUM ('two_for_one_single_2026', 'two_for_one_all_2026', 'free_ticket_single_2026', 'free_all_q4_2026');

-- CreateEnum
CREATE TYPE "PrizeVoucherStatus" AS ENUM ('issued', 'redeemed', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "game_participants" (
    "id" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "ticketId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-PT',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "marketingConsentAt" TIMESTAMP(3),
    "consentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_vouchers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "kind" "PrizeKind" NOT NULL,
    "status" "PrizeVoucherStatus" NOT NULL DEFAULT 'issued',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedByAdminId" TEXT,
    "redemptionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prize_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_participants_campaign_marketingConsentAt_idx" ON "game_participants"("campaign", "marketingConsentAt");

-- CreateIndex
CREATE INDEX "game_participants_ticketId_idx" ON "game_participants"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_campaign_email_key" ON "game_participants"("campaign", "email");

-- CreateIndex
CREATE UNIQUE INDEX "prize_vouchers_code_key" ON "prize_vouchers"("code");

-- CreateIndex
CREATE INDEX "prize_vouchers_campaign_status_idx" ON "prize_vouchers"("campaign", "status");

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_vouchers" ADD CONSTRAINT "prize_vouchers_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "game_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_vouchers" ADD CONSTRAINT "prize_vouchers_redeemedByAdminId_fkey" FOREIGN KEY ("redeemedByAdminId") REFERENCES "ticketing_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

