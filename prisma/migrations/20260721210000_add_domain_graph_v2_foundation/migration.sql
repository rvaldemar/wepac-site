-- Domain Graph v2 foundation.
--
-- Purely additive: existing User, Pack, Cohort, CohortMembership and Session
-- rows are left untouched. In particular, this migration does not infer Pack
-- membership, Cycle Enrollment/Facilitation, Mentorship or personal Connections from
-- CohortMembership. Legacy-derived records require explicit provenance and a
-- human review marker when a later, separately reviewed migration creates them.
-- `reviewRequired` rows are quarantined from active states. Consent/history
-- foreign keys use RESTRICT: future erasure must explicitly anonymize retained
-- records under a reviewed policy instead of deleting them by cascade.

-- CreateEnum
CREATE TYPE "DomainRecordSource" AS ENUM ('explicit', 'invitation', 'admin', 'system', 'legacy_inference');

-- CreateEnum
CREATE TYPE "PersonConnectionType" AS ENUM ('friend', 'family', 'partner', 'professional', 'collaborator', 'other');

-- CreateEnum
CREATE TYPE "PersonConnectionStatus" AS ENUM ('pending', 'active', 'declined', 'ended', 'blocked');

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('pending', 'active', 'paused', 'declined', 'ended');

-- CreateEnum
CREATE TYPE "PackMembershipRole" AS ENUM ('owner', 'moderator', 'member');

-- CreateEnum
CREATE TYPE "PackMembershipStatus" AS ENUM ('invited', 'active', 'paused', 'left', 'removed');

-- CreateEnum
CREATE TYPE "CommunityPackStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "CycleEnrollmentStatus" AS ENUM ('invited', 'active', 'paused', 'completed', 'withdrawn', 'removed');

-- CreateEnum
CREATE TYPE "CycleFacilitatorRole" AS ENUM ('lead', 'facilitator');

-- CreateEnum
CREATE TYPE "CycleFacilitatorStatus" AS ENUM ('invited', 'active', 'paused', 'declined', 'ended', 'removed');

-- CreateEnum
CREATE TYPE "StageKey" AS ENUM ('easy_peasy', 'step_up', 'yup');

-- CreateEnum
CREATE TYPE "StagePlacementStatus" AS ENUM ('pending_review', 'active', 'completed', 'superseded', 'voided');

-- CreateTable
CREATE TABLE "person_connections" (
    "id" TEXT NOT NULL,
    "firstUserId" TEXT NOT NULL,
    "secondUserId" TEXT NOT NULL,
    "requestedById" TEXT,
    "type" "PersonConnectionType" NOT NULL,
    "status" "PersonConnectionStatus" NOT NULL DEFAULT 'pending',
    "labelForFirstUser" TEXT,
    "labelForSecondUser" TEXT,
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_connections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "person_connections_no_self_check" CHECK ("firstUserId" <> "secondUserId"),
    CONSTRAINT "person_connections_canonical_pair_check" CHECK ("firstUserId" < "secondUserId"),
    CONSTRAINT "person_connections_requester_is_participant_check" CHECK (
        "requestedById" IS NULL OR "requestedById" = "firstUserId" OR "requestedById" = "secondUserId"
    ),
    CONSTRAINT "person_connections_accepted_after_request_check" CHECK (
        "acceptedAt" IS NULL OR "acceptedAt" >= "requestedAt"
    ),
    CONSTRAINT "person_connections_active_requires_acceptance_check" CHECK (
        "status" <> 'active' OR "acceptedAt" IS NOT NULL
    ),
    CONSTRAINT "person_connections_ended_after_request_check" CHECK (
        "endedAt" IS NULL OR "endedAt" >= "requestedAt"
    ),
    CONSTRAINT "person_connections_ended_status_timestamp_check" CHECK (
        "status" <> 'ended' OR "endedAt" IS NOT NULL
    ),
    CONSTRAINT "person_connections_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "person_connections_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'pending',
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mentorAcceptedAt" TIMESTAMP(3),
    "menteeAcceptedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mentorships_no_self_check" CHECK ("mentorId" <> "menteeId"),
    CONSTRAINT "mentorships_inviter_is_endpoint_check" CHECK (
        "invitedById" = "mentorId" OR "invitedById" = "menteeId"
    ),
    CONSTRAINT "mentorships_mentor_acceptance_after_invite_check" CHECK (
        "mentorAcceptedAt" IS NULL OR "mentorAcceptedAt" >= "invitedAt"
    ),
    CONSTRAINT "mentorships_mentee_acceptance_after_invite_check" CHECK (
        "menteeAcceptedAt" IS NULL OR "menteeAcceptedAt" >= "invitedAt"
    ),
    CONSTRAINT "mentorships_activation_after_acceptance_check" CHECK (
        "activatedAt" IS NULL OR (
            "mentorAcceptedAt" IS NOT NULL AND
            "menteeAcceptedAt" IS NOT NULL AND
            "activatedAt" >= "mentorAcceptedAt" AND
            "activatedAt" >= "menteeAcceptedAt"
        )
    ),
    CONSTRAINT "mentorships_live_requires_bilateral_consent_check" CHECK (
        "status" NOT IN ('active', 'paused') OR (
            "mentorAcceptedAt" IS NOT NULL AND
            "menteeAcceptedAt" IS NOT NULL AND
            "activatedAt" IS NOT NULL
        )
    ),
    CONSTRAINT "mentorships_paused_after_acceptance_check" CHECK (
        "pausedAt" IS NULL OR ("activatedAt" IS NOT NULL AND "pausedAt" >= "activatedAt")
    ),
    CONSTRAINT "mentorships_paused_status_timestamp_check" CHECK (
        "status" <> 'paused' OR "pausedAt" IS NOT NULL
    ),
    CONSTRAINT "mentorships_ended_after_invite_check" CHECK (
        "endedAt" IS NULL OR "endedAt" >= "invitedAt"
    ),
    CONSTRAINT "mentorships_ended_status_timestamp_check" CHECK (
        "status" <> 'ended' OR "endedAt" IS NOT NULL
    ),
    CONSTRAINT "mentorships_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "mentorships_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- CreateTable: target community aggregate, intentionally separate from the
-- legacy `packs` table (whose current rows describe profile/practice concepts).
CREATE TABLE "community_packs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "CommunityPackStatus" NOT NULL DEFAULT 'draft',
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_packs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "community_packs_activation_after_creation_check" CHECK (
        "activatedAt" IS NULL OR "activatedAt" >= "createdAt"
    ),
    CONSTRAINT "community_packs_archive_after_creation_check" CHECK (
        "archivedAt" IS NULL OR "archivedAt" >= "createdAt"
    ),
    CONSTRAINT "community_packs_active_status_timestamp_check" CHECK (
        "status" <> 'active' OR "activatedAt" IS NOT NULL
    ),
    CONSTRAINT "community_packs_archived_status_timestamp_check" CHECK (
        "status" <> 'archived' OR "archivedAt" IS NOT NULL
    ),
    CONSTRAINT "community_packs_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "community_packs_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- CreateTable
CREATE TABLE "pack_memberships" (
    "id" TEXT NOT NULL,
    "communityPackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "role" "PackMembershipRole" NOT NULL DEFAULT 'member',
    "status" "PackMembershipStatus" NOT NULL DEFAULT 'invited',
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pack_memberships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pack_memberships_joined_after_invite_check" CHECK (
        "joinedAt" IS NULL OR "joinedAt" >= "invitedAt"
    ),
    CONSTRAINT "pack_memberships_active_requires_acceptance_check" CHECK (
        "status" NOT IN ('active', 'paused') OR "joinedAt" IS NOT NULL
    ),
    CONSTRAINT "pack_memberships_ended_after_invite_check" CHECK (
        "endedAt" IS NULL OR "endedAt" >= "invitedAt"
    ),
    CONSTRAINT "pack_memberships_ended_status_timestamp_check" CHECK (
        "status" NOT IN ('left', 'removed') OR "endedAt" IS NOT NULL
    ),
    CONSTRAINT "pack_memberships_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "pack_memberships_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- CreateTable: participant consent edge only.
CREATE TABLE "cycle_enrollments" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CycleEnrollmentStatus" NOT NULL DEFAULT 'invited',
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_enrollments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cycle_enrollments_joined_after_invite_check" CHECK (
        "joinedAt" IS NULL OR "joinedAt" >= "invitedAt"
    ),
    CONSTRAINT "cycle_enrollments_active_requires_acceptance_check" CHECK (
        "status" NOT IN ('active', 'paused', 'completed') OR "joinedAt" IS NOT NULL
    ),
    CONSTRAINT "cycle_enrollments_completed_after_join_check" CHECK (
        "completedAt" IS NULL OR ("joinedAt" IS NOT NULL AND "completedAt" >= "joinedAt")
    ),
    CONSTRAINT "cycle_enrollments_completed_status_timestamp_check" CHECK (
        "status" <> 'completed' OR "completedAt" IS NOT NULL
    ),
    CONSTRAINT "cycle_enrollments_ended_after_invite_check" CHECK (
        "endedAt" IS NULL OR "endedAt" >= "invitedAt"
    ),
    CONSTRAINT "cycle_enrollments_ended_status_timestamp_check" CHECK (
        "status" NOT IN ('withdrawn', 'removed') OR "endedAt" IS NOT NULL
    ),
    CONSTRAINT "cycle_enrollments_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "cycle_enrollments_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- CreateTable: operational Cycle assignment, independent from enrollment.
CREATE TABLE "cycle_facilitators" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CycleFacilitatorRole" NOT NULL DEFAULT 'facilitator',
    "status" "CycleFacilitatorStatus" NOT NULL DEFAULT 'invited',
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_facilitators_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cycle_facilitators_accepted_after_invite_check" CHECK (
        "acceptedAt" IS NULL OR "acceptedAt" >= "invitedAt"
    ),
    CONSTRAINT "cycle_facilitators_active_requires_acceptance_check" CHECK (
        "status" NOT IN ('active', 'paused') OR "acceptedAt" IS NOT NULL
    ),
    CONSTRAINT "cycle_facilitators_ended_after_invite_check" CHECK (
        "endedAt" IS NULL OR "endedAt" >= "invitedAt"
    ),
    CONSTRAINT "cycle_facilitators_ended_status_timestamp_check" CHECK (
        "status" NOT IN ('ended', 'removed') OR "endedAt" IS NOT NULL
    ),
    CONSTRAINT "cycle_facilitators_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "cycle_facilitators_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- CreateTable
CREATE TABLE "stage_placements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" "StageKey" NOT NULL,
    "status" "StagePlacementStatus" NOT NULL DEFAULT 'active',
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "placedById" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_placements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "stage_placements_effective_range_check" CHECK (
        "effectiveUntil" IS NULL OR "effectiveUntil" >= "effectiveFrom"
    ),
    CONSTRAINT "stage_placements_closed_status_timestamp_check" CHECK (
        "status" NOT IN ('completed', 'superseded') OR "effectiveUntil" IS NOT NULL
    ),
    CONSTRAINT "stage_placements_legacy_review_check" CHECK (
        "source" <> 'legacy_inference' OR "reviewRequired" = true
    ),
    CONSTRAINT "stage_placements_review_quarantine_check" CHECK (
        "reviewRequired" = false OR "status" <> 'active'
    )
);

-- AlterTable: optional context only; existing Session rows remain valid.
ALTER TABLE "sessions" ADD COLUMN "mentorshipId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "person_connections_firstUserId_secondUserId_key" ON "person_connections"("firstUserId", "secondUserId");

-- CreateIndex
CREATE INDEX "person_connections_firstUserId_status_idx" ON "person_connections"("firstUserId", "status");

-- CreateIndex
CREATE INDEX "person_connections_secondUserId_status_idx" ON "person_connections"("secondUserId", "status");

-- CreateIndex
CREATE INDEX "person_connections_requestedById_idx" ON "person_connections"("requestedById");

-- CreateIndex
CREATE INDEX "mentorships_mentorId_menteeId_idx" ON "mentorships"("mentorId", "menteeId");

-- CreateIndex: retain ended/declined history while preventing concurrent live
-- relationships for the same directed Mentor -> Mentee pair.
CREATE UNIQUE INDEX "mentorships_one_live_pair_key"
ON "mentorships"("mentorId", "menteeId")
WHERE "status" IN ('pending', 'active', 'paused');

-- CreateIndex
CREATE INDEX "mentorships_mentorId_status_idx" ON "mentorships"("mentorId", "status");

-- CreateIndex
CREATE INDEX "mentorships_menteeId_status_idx" ON "mentorships"("menteeId", "status");

-- CreateIndex
CREATE INDEX "mentorships_invitedById_idx" ON "mentorships"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "community_packs_slug_key" ON "community_packs"("slug");

-- CreateIndex
CREATE INDEX "community_packs_status_idx" ON "community_packs"("status");

-- CreateIndex
CREATE INDEX "community_packs_createdById_idx" ON "community_packs"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "pack_memberships_communityPackId_userId_key" ON "pack_memberships"("communityPackId", "userId");

-- CreateIndex
CREATE INDEX "pack_memberships_communityPackId_status_idx" ON "pack_memberships"("communityPackId", "status");

-- CreateIndex
CREATE INDEX "pack_memberships_userId_status_idx" ON "pack_memberships"("userId", "status");

-- CreateIndex
CREATE INDEX "pack_memberships_invitedById_idx" ON "pack_memberships"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_enrollments_cohortId_userId_key" ON "cycle_enrollments"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "cycle_enrollments_cohortId_status_idx" ON "cycle_enrollments"("cohortId", "status");

-- CreateIndex
CREATE INDEX "cycle_enrollments_userId_status_idx" ON "cycle_enrollments"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_facilitators_cohortId_userId_key" ON "cycle_facilitators"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "cycle_facilitators_cohortId_status_idx" ON "cycle_facilitators"("cohortId", "status");

-- CreateIndex
CREATE INDEX "cycle_facilitators_userId_status_idx" ON "cycle_facilitators"("userId", "status");

-- CreateIndex: PostgreSQL-only invariant not currently expressible in Prisma.
CREATE UNIQUE INDEX "stage_placements_one_active_per_user_key"
ON "stage_placements"("userId")
WHERE "status" = 'active';

-- CreateIndex
CREATE INDEX "stage_placements_userId_status_idx" ON "stage_placements"("userId", "status");

-- CreateIndex
CREATE INDEX "stage_placements_placedById_idx" ON "stage_placements"("placedById");

-- CreateIndex
CREATE INDEX "sessions_mentorshipId_idx" ON "sessions"("mentorshipId");

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_firstUserId_fkey" FOREIGN KEY ("firstUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_secondUserId_fkey" FOREIGN KEY ("secondUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_packs" ADD CONSTRAINT "community_packs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_memberships" ADD CONSTRAINT "pack_memberships_communityPackId_fkey" FOREIGN KEY ("communityPackId") REFERENCES "community_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_memberships" ADD CONSTRAINT "pack_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_memberships" ADD CONSTRAINT "pack_memberships_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_enrollments" ADD CONSTRAINT "cycle_enrollments_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_enrollments" ADD CONSTRAINT "cycle_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_facilitators" ADD CONSTRAINT "cycle_facilitators_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_facilitators" ADD CONSTRAINT "cycle_facilitators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_placements" ADD CONSTRAINT "stage_placements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_placements" ADD CONSTRAINT "stage_placements_placedById_fkey" FOREIGN KEY ("placedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
