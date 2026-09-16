-- WEPACKER platform rebuild: Artista Alpha (user-centric) → multi-pack
-- (Pack/Cohort/CohortMembership). Platform tables hold test data only and
-- are emptied first; `leads` and `beta_signups` (real data) are preserved —
-- beta_signups only gains the additive `packSlug` column.

DELETE FROM "messages";
DELETE FROM "conversation_participants";
DELETE FROM "conversations";
DELETE FROM "comments";
DELETE FROM "session_attendees";
DELETE FROM "sessions";
DELETE FROM "tasks";
DELETE FROM "monthly_actions";
DELETE FROM "goals";
DELETE FROM "strategic_plans";
DELETE FROM "life_plans";
DELETE FROM "strategic_map_scores";
DELETE FROM "evaluation_scores";
DELETE FROM "evaluations";
DELETE FROM "agreements";
DELETE FROM "password_reset_tokens";
DELETE FROM "users";

-- CreateEnum
CREATE TYPE "MemberLevel" AS ENUM ('seed', 'growth', 'signature', 'partner');

-- CreateEnum
CREATE TYPE "MemberPhase" AS ENUM ('diagnosis', 'structuring', 'development', 'activation', 'consolidation');

-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('member', 'mentor');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'paused', 'exited');

-- AlterEnum
BEGIN;
CREATE TYPE "AreaKey_new" AS ENUM ('physical', 'emotional', 'character', 'spiritual', 'intellectual', 'social', 'domain');
ALTER TABLE "evaluation_scores" ALTER COLUMN "area" TYPE "AreaKey_new" USING ("area"::text::"AreaKey_new");
ALTER TABLE "strategic_plans" ALTER COLUMN "focusAreas" TYPE "AreaKey_new"[] USING ("focusAreas"::text::"AreaKey_new"[]);
ALTER TYPE "AreaKey" RENAME TO "AreaKey_old";
ALTER TYPE "AreaKey_new" RENAME TO "AreaKey";
DROP TYPE "public"."AreaKey_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('member', 'mentor', 'admin');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';
COMMIT;

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_userId_fkey";

-- DropForeignKey
ALTER TABLE "life_plans" DROP CONSTRAINT "life_plans_userId_fkey";

-- DropForeignKey
ALTER TABLE "session_attendees" DROP CONSTRAINT "session_attendees_userId_fkey";

-- DropForeignKey
ALTER TABLE "strategic_map_scores" DROP CONSTRAINT "strategic_map_scores_userId_fkey";

-- DropForeignKey
ALTER TABLE "strategic_plans" DROP CONSTRAINT "strategic_plans_userId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_userId_fkey";

-- DropIndex
DROP INDEX "session_attendees_sessionId_userId_key";

-- AlterTable
ALTER TABLE "beta_signups" ADD COLUMN     "packSlug" TEXT NOT NULL DEFAULT 'artist';

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "userId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "life_plans" DROP COLUMN "userId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "session_attendees" DROP COLUMN "userId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "cohortId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "strategic_map_scores" DROP COLUMN "userId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "strategic_plans" DROP COLUMN "userId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "userId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "currentPhase",
DROP COLUMN "level",
DROP COLUMN "track",
ALTER COLUMN "role" SET DEFAULT 'member';

-- DropEnum
DROP TYPE "ArtistLevel";

-- DropEnum
DROP TYPE "ArtistPhase";

-- DropEnum
DROP TYPE "Track";

-- CreateTable
CREATE TABLE "packs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "domainLabel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CohortStatus" NOT NULL DEFAULT 'draft',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_memberships" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "level" "MemberLevel" NOT NULL DEFAULT 'seed',
    "currentPhase" "MemberPhase" NOT NULL DEFAULT 'diagnosis',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packs_slug_key" ON "packs"("slug");

-- CreateIndex
CREATE INDEX "cohort_memberships_userId_idx" ON "cohort_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_memberships_cohortId_userId_key" ON "cohort_memberships"("cohortId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendees_sessionId_membershipId_key" ON "session_attendees"("sessionId", "membershipId");

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_packId_fkey" FOREIGN KEY ("packId") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "cohort_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_map_scores" ADD CONSTRAINT "strategic_map_scores_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "cohort_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_plans" ADD CONSTRAINT "life_plans_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "cohort_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "cohort_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "cohort_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendees" ADD CONSTRAINT "session_attendees_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "cohort_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

