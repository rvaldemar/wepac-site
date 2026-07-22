-- Domain Graph target expand/cutover (Release A).
--
-- This migration is deliberately compatible with the previous application
-- release while it is still running:
--   * physical legacy tables and columns are not dropped;
--   * `sessions.sessionType` receives a default because the target Prisma
--     client derives format from attendees and no longer writes the column;
--   * only the unused CycleEnrollment/CycleFacilitator foundation is reset and
--     repointed from legacy Cohort to the real Cycle aggregate.
--
-- The reviewed Release B contraction is staged outside prisma/migrations at
-- prisma/release-b/drop_legacy_domain.sql. It must run only after this target
-- runtime has replaced the previous release and passed its stability gate.

-- ===== TARGET ENUMS =====

CREATE TYPE "CycleStatus" AS ENUM (
    'draft',
    'published',
    'active',
    'completed',
    'archived'
);

CREATE TYPE "ActionStatus" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE "ActionOrigin" AS ENUM (
    'self',
    'plan',
    'session_proposal'
);

-- ===== PERSONAL COMMUNITY IDENTITY =====

-- A personal Pack is still a real community, but this explicit optional edge
-- lets its owner see "My Pack" while allowing the same Person to create other
-- community Packs later. The unique key enforces at most one personal Pack.
ALTER TABLE "community_packs"
    ADD COLUMN "personalOwnerId" TEXT;

CREATE UNIQUE INDEX "community_packs_personalOwnerId_key"
    ON "community_packs"("personalOwnerId");

ALTER TABLE "community_packs"
    ADD CONSTRAINT "community_packs_personalOwnerId_fkey"
    FOREIGN KEY ("personalOwnerId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== DISCIPLINES =====

CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "disciplines_slug_key" ON "disciplines"("slug");
CREATE INDEX "disciplines_active_idx" ON "disciplines"("active");

-- ===== REAL CYCLES =====

CREATE TABLE "cycles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "CycleStatus" NOT NULL DEFAULT 'draft',
    "stage" "StageKey",
    "primaryDisciplineId" TEXT,
    "createdById" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "source" "DomainRecordSource" NOT NULL DEFAULT 'explicit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cycles_date_range_check" CHECK (
        "endsAt" IS NULL OR ("startsAt" IS NOT NULL AND "endsAt" > "startsAt")
    ),
    CONSTRAINT "cycles_publish_readiness_check" CHECK (
        "status" NOT IN ('published', 'active', 'completed') OR (
            "stage" IS NOT NULL AND
            "startsAt" IS NOT NULL AND
            "endsAt" IS NOT NULL AND
            "endsAt" > "startsAt"
        )
    )
);

CREATE UNIQUE INDEX "cycles_slug_key" ON "cycles"("slug");
CREATE INDEX "cycles_status_startsAt_idx" ON "cycles"("status", "startsAt");
CREATE INDEX "cycles_stage_idx" ON "cycles"("stage");
CREATE INDEX "cycles_primaryDisciplineId_idx" ON "cycles"("primaryDisciplineId");
CREATE INDEX "cycles_createdById_idx" ON "cycles"("createdById");

ALTER TABLE "cycles"
    ADD CONSTRAINT "cycles_primaryDisciplineId_fkey"
    FOREIGN KEY ("primaryDisciplineId") REFERENCES "disciplines"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cycles"
    ADD CONSTRAINT "cycles_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== REPOINT UNUSED TARGET CYCLE EDGES =====

-- These foundation tables were deployed default-off and are expected to be
-- empty. They are target data, so an unexpected row must abort the migration
-- for explicit inventory rather than being deleted or reinterpreted.
DO $cycle_edges_must_be_empty$
BEGIN
    IF EXISTS (SELECT 1 FROM "cycle_enrollments" LIMIT 1)
        OR EXISTS (SELECT 1 FROM "cycle_facilitators" LIMIT 1)
    THEN
        RAISE EXCEPTION
            'Target Cycle foundation rows exist; refusing to repoint them implicitly';
    END IF;
END
$cycle_edges_must_be_empty$;

ALTER TABLE "cycle_enrollments"
    DROP CONSTRAINT "cycle_enrollments_cohortId_fkey";
ALTER TABLE "cycle_facilitators"
    DROP CONSTRAINT "cycle_facilitators_cohortId_fkey";

DROP INDEX "cycle_enrollments_cohortId_userId_key";
DROP INDEX "cycle_enrollments_cohortId_status_idx";
DROP INDEX "cycle_facilitators_cohortId_userId_key";
DROP INDEX "cycle_facilitators_cohortId_status_idx";

ALTER TABLE "cycle_enrollments"
    DROP COLUMN "cohortId",
    ADD COLUMN "cycleId" TEXT NOT NULL;

ALTER TABLE "cycle_facilitators"
    DROP COLUMN "cohortId",
    ADD COLUMN "cycleId" TEXT NOT NULL;

CREATE UNIQUE INDEX "cycle_enrollments_cycleId_userId_key"
    ON "cycle_enrollments"("cycleId", "userId");
CREATE INDEX "cycle_enrollments_cycleId_status_idx"
    ON "cycle_enrollments"("cycleId", "status");
CREATE UNIQUE INDEX "cycle_facilitators_cycleId_userId_key"
    ON "cycle_facilitators"("cycleId", "userId");
CREATE INDEX "cycle_facilitators_cycleId_status_idx"
    ON "cycle_facilitators"("cycleId", "status");

ALTER TABLE "cycle_enrollments"
    ADD CONSTRAINT "cycle_enrollments_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "cycles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cycle_facilitators"
    ADD CONSTRAINT "cycle_facilitators_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "cycles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== TARGET SESSION CONTEXT =====

-- The target Debrief contract is explicitly versioned. Both columns are
-- nullable during Release A because the previous runtime can still create an
-- old-contract row between migration and symlink swap. Target reads always
-- filter on the exact contract version; Release B purges old-contract rows,
-- makes the discriminator required and drops their physical payload columns.
ALTER TABLE "session_debriefs"
    ADD COLUMN "contractVersion" TEXT,
    ADD COLUMN "internalSynthesis" JSONB;

ALTER TABLE "sessions"
    ADD COLUMN "cycleId" TEXT;

-- The old release still writes sessionType explicitly. The target release does
-- not expose it in Prisma, so this default keeps the retained NOT NULL physical
-- column compatible until Release B drops it.
ALTER TABLE "sessions"
    ALTER COLUMN "sessionType" SET DEFAULT 'individual';

CREATE INDEX "sessions_cycleId_idx" ON "sessions"("cycleId");

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "cycles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- A Person deletion must never silently remove a shared Session or an
-- attendee's historical participation. The target admin flow now surfaces the
-- dependency and requires an explicit lifecycle decision instead.
ALTER TABLE "sessions"
    DROP CONSTRAINT "sessions_mentorId_fkey";
ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_mentorId_fkey"
    FOREIGN KEY ("mentorId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "session_attendees"
    DROP CONSTRAINT "session_attendees_userId_fkey";
ALTER TABLE "session_attendees"
    ADD CONSTRAINT "session_attendees_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== PERSON-OWNED ACTIONS =====

CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'pending',
    "origin" "ActionOrigin" NOT NULL DEFAULT 'self',
    "dueAt" TIMESTAMP(3),
    "strategicPlanId" TEXT,
    "goalId" TEXT,
    "trailId" TEXT,
    "sourceSessionId" TEXT,
    "cycleId" TEXT,
    "mentorshipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "actions_release_a_self_create_check" CHECK (
        "createdById" IS NULL OR "createdById" = "assigneeId"
    )
);

CREATE INDEX "actions_assigneeId_status_dueAt_idx"
    ON "actions"("assigneeId", "status", "dueAt");
CREATE INDEX "actions_createdById_idx" ON "actions"("createdById");
CREATE INDEX "actions_strategicPlanId_idx" ON "actions"("strategicPlanId");
CREATE INDEX "actions_goalId_idx" ON "actions"("goalId");
CREATE INDEX "actions_trailId_idx" ON "actions"("trailId");
CREATE INDEX "actions_sourceSessionId_idx" ON "actions"("sourceSessionId");
CREATE INDEX "actions_cycleId_idx" ON "actions"("cycleId");
CREATE INDEX "actions_mentorshipId_idx" ON "actions"("mentorshipId");

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_strategicPlanId_fkey"
    FOREIGN KEY ("strategicPlanId") REFERENCES "strategic_plans"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "goals"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_trailId_fkey"
    FOREIGN KEY ("trailId") REFERENCES "trails"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_sourceSessionId_fkey"
    FOREIGN KEY ("sourceSessionId") REFERENCES "sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_cycleId_fkey"
    FOREIGN KEY ("cycleId") REFERENCES "cycles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actions"
    ADD CONSTRAINT "actions_mentorshipId_fkey"
    FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
