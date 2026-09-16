-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('checkpoint', 'recon', 'basecamp', 'rescue', 'summit');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "kind" "SessionKind" NOT NULL DEFAULT 'checkpoint';
