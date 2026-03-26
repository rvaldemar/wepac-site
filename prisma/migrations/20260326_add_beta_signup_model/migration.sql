-- CreateEnum
CREATE TYPE "BetaSignupStatus" AS ENUM ('pending', 'contacted', 'invited', 'rejected');

-- CreateTable
CREATE TABLE "beta_signups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "artisticArea" TEXT,
    "socialLinks" TEXT,
    "motivation" TEXT,
    "status" "BetaSignupStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beta_signups_email_key" ON "beta_signups"("email");
