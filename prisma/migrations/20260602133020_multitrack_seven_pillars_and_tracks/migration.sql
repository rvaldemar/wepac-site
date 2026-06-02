-- CreateEnum
CREATE TYPE "Track" AS ENUM ('artist', 'adult', 'clinic');

-- AlterEnum
ALTER TYPE "AreaKey" ADD VALUE 'artistic';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "track" "Track" NOT NULL DEFAULT 'artist';
