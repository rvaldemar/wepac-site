-- Domain Graph target legacy contraction (Release B).
--
-- DO NOT move this file into prisma/migrations or run it with the Release A
-- deploy. `deploy.sh` applies migrations before replacing the running app, so
-- the old runtime still needs these physical structures during that window.
--
-- Run only after the target runtime is deployed and stable. Product has
-- explicitly authorized discarding every row in the retired legacy tables.
-- Shared and target records in the canonical graph are retained.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '5min';

DO $release_b_guard$
BEGIN
    IF to_regclass('public.actions') IS NULL
        OR to_regclass('public.cycles') IS NULL
        OR to_regclass('public.disciplines') IS NULL
        OR NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'sessions'
              AND column_name = 'cycleId'
        )
        OR NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = '_legacyMentorAccountRole'
        )
    THEN
        RAISE EXCEPTION
            'Release A target schema is not present; refusing legacy contraction';
    END IF;
END
$release_b_guard$;

DO $legacy_source_guard$
BEGIN
    IF EXISTS (SELECT 1 FROM "person_connections" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "mentorships" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "community_packs" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "pack_memberships" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "cycles" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "cycle_enrollments" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "cycle_facilitators" WHERE "source" = 'legacy_inference')
        OR EXISTS (SELECT 1 FROM "stage_placements" WHERE "source" = 'legacy_inference')
    THEN
        RAISE EXCEPTION
            'legacy_inference rows require an explicit inventory decision before Release B';
    END IF;
END
$legacy_source_guard$;

DO $review_required_guard$
BEGIN
    IF EXISTS (SELECT 1 FROM "person_connections" WHERE "reviewRequired" = true)
        OR EXISTS (SELECT 1 FROM "mentorships" WHERE "reviewRequired" = true)
        OR EXISTS (SELECT 1 FROM "community_packs" WHERE "reviewRequired" = true)
        OR EXISTS (SELECT 1 FROM "pack_memberships" WHERE "reviewRequired" = true)
        OR EXISTS (SELECT 1 FROM "cycle_enrollments" WHERE "reviewRequired" = true)
        OR EXISTS (SELECT 1 FROM "cycle_facilitators" WHERE "reviewRequired" = true)
        OR EXISTS (SELECT 1 FROM "stage_placements" WHERE "reviewRequired" = true)
    THEN
        RAISE EXCEPTION
            'reviewRequired rows require an explicit inventory decision before Release B';
    END IF;
END
$review_required_guard$;

DO $mentor_account_role_guard$
BEGIN
    IF EXISTS (SELECT 1 FROM "users" WHERE "role"::text = 'mentor')
    THEN
        RAISE EXCEPTION
            'Release A must convert every mentor account role before Release B';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM "users"
        WHERE "_legacyMentorAccountRole" = true
          AND "role"::text NOT IN ('member', 'admin')
    )
    THEN
        RAISE EXCEPTION
            'Legacy mentor rollback markers must map to member or an explicit admin promotion before Release B';
    END IF;
END
$mentor_account_role_guard$;

-- Old W01 rows have no trustworthy discriminator and must never be cast to the
-- target output shape. Product has authorized deletion of old-model data.
DELETE FROM "session_debriefs"
WHERE "contractVersion" IS DISTINCT FROM 'wepac-session-debrief-v3';

ALTER TABLE "session_debriefs"
    ALTER COLUMN "contractVersion" SET NOT NULL,
    DROP COLUMN "internalEvaluation",
    DROP COLUMN "resultDocumentHtml";

-- ===== REMOVE DEAD REVIEW GATES =====

ALTER TABLE "person_connections"
    DROP CONSTRAINT "person_connections_legacy_review_check",
    DROP CONSTRAINT "person_connections_review_quarantine_check";
ALTER TABLE "mentorships"
    DROP CONSTRAINT "mentorships_legacy_review_check",
    DROP CONSTRAINT "mentorships_review_quarantine_check";
ALTER TABLE "community_packs"
    DROP CONSTRAINT "community_packs_legacy_review_check",
    DROP CONSTRAINT "community_packs_review_quarantine_check";
ALTER TABLE "pack_memberships"
    DROP CONSTRAINT "pack_memberships_legacy_review_check",
    DROP CONSTRAINT "pack_memberships_review_quarantine_check";
ALTER TABLE "cycle_enrollments"
    DROP CONSTRAINT "cycle_enrollments_legacy_review_check",
    DROP CONSTRAINT "cycle_enrollments_review_quarantine_check";
ALTER TABLE "cycle_facilitators"
    DROP CONSTRAINT "cycle_facilitators_legacy_review_check",
    DROP CONSTRAINT "cycle_facilitators_review_quarantine_check";
ALTER TABLE "stage_placements"
    DROP CONSTRAINT "stage_placements_legacy_review_check",
    DROP CONSTRAINT "stage_placements_review_quarantine_check";

-- ===== CONTRACT SOURCE PROVENANCE =====

CREATE TYPE "DomainRecordSource_new" AS ENUM (
    'explicit',
    'invitation',
    'admin',
    'system'
);

ALTER TABLE "community_packs" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "cycle_enrollments" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "cycle_facilitators" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "cycles" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "mentorships" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "pack_memberships" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "person_connections" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "stage_placements" ALTER COLUMN "source" DROP DEFAULT;

ALTER TABLE "person_connections" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "mentorships" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "community_packs" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "pack_memberships" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "cycles" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "cycle_enrollments" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "cycle_facilitators" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");
ALTER TABLE "stage_placements" ALTER COLUMN "source"
    TYPE "DomainRecordSource_new" USING ("source"::text::"DomainRecordSource_new");

ALTER TYPE "DomainRecordSource" RENAME TO "DomainRecordSource_old";
ALTER TYPE "DomainRecordSource_new" RENAME TO "DomainRecordSource";
DROP TYPE "DomainRecordSource_old";

ALTER TABLE "community_packs" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "cycle_enrollments" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "cycle_facilitators" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "cycles" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "mentorships" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "pack_memberships" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "person_connections" ALTER COLUMN "source" SET DEFAULT 'explicit';
ALTER TABLE "stage_placements" ALTER COLUMN "source" SET DEFAULT 'explicit';

-- Mentorship authority now exists only on explicit Mentorship edges. Release A
-- converted all legacy account-role rows to member while retaining the enum
-- value for old-runtime compatibility; Release B removes that physical value.
CREATE TYPE "UserRole_new" AS ENUM ('member', 'admin');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role"
    TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';

-- ===== RETIRED FOREIGN KEYS =====

ALTER TABLE "cohort_memberships"
    DROP CONSTRAINT "cohort_memberships_cohortId_fkey";
ALTER TABLE "cohort_memberships"
    DROP CONSTRAINT "cohort_memberships_userId_fkey";
ALTER TABLE "cohorts"
    DROP CONSTRAINT "cohorts_packId_fkey";
ALTER TABLE "comments"
    DROP CONSTRAINT "comments_taskId_fkey";
ALTER TABLE "comments"
    DROP CONSTRAINT "comments_userId_fkey";
ALTER TABLE "evaluation_scores"
    DROP CONSTRAINT "evaluation_scores_evaluationId_fkey";
ALTER TABLE "evaluations"
    DROP CONSTRAINT "evaluations_evaluatorId_fkey";
ALTER TABLE "evaluations"
    DROP CONSTRAINT "evaluations_userId_fkey";
ALTER TABLE "monthly_actions"
    DROP CONSTRAINT "monthly_actions_goalId_fkey";
ALTER TABLE "monthly_actions"
    DROP CONSTRAINT "monthly_actions_strategicPlanId_fkey";
ALTER TABLE "sessions"
    DROP CONSTRAINT "sessions_cohortId_fkey";
ALTER TABLE "strategic_map_scores"
    DROP CONSTRAINT "strategic_map_scores_evaluatorId_fkey";
ALTER TABLE "strategic_map_scores"
    DROP CONSTRAINT "strategic_map_scores_userId_fkey";
ALTER TABLE "tasks"
    DROP CONSTRAINT "tasks_assignedById_fkey";
ALTER TABLE "tasks"
    DROP CONSTRAINT "tasks_goalId_fkey";
ALTER TABLE "tasks"
    DROP CONSTRAINT "tasks_membershipId_fkey";
ALTER TABLE "tasks"
    DROP CONSTRAINT "tasks_sourceSessionId_fkey";

-- ===== RETIRED COLUMNS ON RETAINED TABLES =====

ALTER TABLE "beta_signups"
    DROP COLUMN "packSlug";

ALTER TABLE "users"
    DROP COLUMN "_legacyMentorAccountRole";

ALTER TABLE "community_packs" DROP COLUMN "reviewRequired";
ALTER TABLE "cycle_enrollments" DROP COLUMN "reviewRequired";
ALTER TABLE "cycle_facilitators" DROP COLUMN "reviewRequired";
ALTER TABLE "mentorships" DROP COLUMN "reviewRequired";
ALTER TABLE "pack_memberships" DROP COLUMN "reviewRequired";
ALTER TABLE "person_connections" DROP COLUMN "reviewRequired";
ALTER TABLE "stage_placements" DROP COLUMN "reviewRequired";

ALTER TABLE "sessions"
    DROP COLUMN "cohortId",
    DROP COLUMN "notes",
    DROP COLUMN "notesPublished",
    DROP COLUMN "sessionType";

-- ===== RETIRED TABLES =====

DROP TABLE "cohort_memberships";
DROP TABLE "cohorts";
DROP TABLE "comments";
DROP TABLE "evaluation_scores";
DROP TABLE "evaluations";
DROP TABLE "monthly_actions";
DROP TABLE "packs";
DROP TABLE "strategic_map_scores";
DROP TABLE "tasks";

-- ===== RETIRED ENUMS =====

DROP TYPE "CohortStatus";
DROP TYPE "EvaluationMoment";
DROP TYPE "EvaluationType";
DROP TYPE "MemberLevel";
DROP TYPE "MemberPhase";
DROP TYPE "MembershipRole";
DROP TYPE "MembershipStatus";
DROP TYPE "SessionType";
DROP TYPE "TaskOrigin";
DROP TYPE "TaskStatus";

COMMIT;
