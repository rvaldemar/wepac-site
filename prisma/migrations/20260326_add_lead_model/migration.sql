-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('chat', 'form');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "eventType" TEXT,
    "eventDate" TEXT,
    "location" TEXT,
    "guestCount" INTEGER,
    "musicalPreferences" TEXT,
    "ensemble" TEXT,
    "estimatedBudget" TEXT,
    "notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "conversationHistory" JSONB,
    "source" "LeadSource" NOT NULL DEFAULT 'chat',
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);
