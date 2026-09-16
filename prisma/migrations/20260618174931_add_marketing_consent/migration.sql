-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
