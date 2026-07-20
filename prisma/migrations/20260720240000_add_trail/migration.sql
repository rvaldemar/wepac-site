-- New standalone entity: a Trail is a personal transformation journey a
-- WEPACker defines for themselves (title, purpose, why it matters now,
-- destination, which development areas it touches, a status). It hangs
-- on the person (User), not on a Cohort/Journey — someone can run
-- several Trails across their life, each optionally overlapping a
-- Pack's Journey, but that link isn't modeled yet. Purely additive: new
-- enum, new table, no existing data touched.

-- CreateEnum
CREATE TYPE "TrailStatus" AS ENUM ('active', 'paused', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "trails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "whyItMatters" TEXT NOT NULL DEFAULT '',
    "destination" TEXT NOT NULL DEFAULT '',
    "areas" "AreaKey"[],
    "status" "TrailStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trails_userId_idx" ON "trails"("userId");

-- AddForeignKey
ALTER TABLE "trails" ADD CONSTRAINT "trails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
