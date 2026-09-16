-- Evaluation, LifePlan, StrategicPlan and StrategicMapScore move from
-- being keyed by CohortMembership to being keyed by User: the 7-pillar
-- diagnosis, the PPV (life plan) and the strategic plan/map belong to
-- the *person*, not to one specific pack enrollment — someone with two
-- Packs must not end up with two independent diagnoses/PPVs.
--
-- Every table below is backfilled from its current membership's own
-- userId (`cohort_memberships."userId"`) before the old membershipId
-- column is dropped, so no evaluation/plan data is lost.
--
-- Multiple-membership edge case (documented per-table below — "pouco
-- comum hoje mas possível"):
--   * Evaluation and StrategicMapScore: no uniqueness constraint keyed
--     the old membershipId, and none is added on userId either — a
--     person can have several evaluation/score rows over time by
--     design (the "latest wins" read logic in
--     src/lib/wepacker/actions/evaluation.ts and plan.ts already orders
--     by completedAt/month desc and takes the most recent). Rows
--     originating from different memberships of the same person simply
--     migrate 1:1 onto that person's userId — no ambiguity to resolve.
--   * StrategicPlan: same reasoning — no unique constraint on
--     (membershipId, quarter) existed before and none is added on
--     (userId, quarter) now. If two memberships of the same person each
--     had a plan for the same quarter, both rows survive under the same
--     userId; `upsertStrategicPlan`'s findFirst will deterministically
--     pick one of them on the next save. Pre-existing ambiguity, not
--     introduced by this migration, and not worth a data-loss fix for
--     an edge case with (per HITL) no known production instances.
--   * LifePlan: DOES gain a hard `@unique(userId)` (one mutable PPV per
--     person, matching the product decision). A user with more than one
--     CohortMembership could have more than one LifePlan row today. To
--     satisfy the new unique constraint we keep only the LifePlan row
--     with the most recent `updatedAt` per user (ties broken by id) and
--     delete the rest. LifePlan has no child tables, so this delete
--     never cascades into other data.

-- ===== EVALUATIONS =====

ALTER TABLE "evaluations" ADD COLUMN "userId" TEXT;

UPDATE "evaluations" e
SET "userId" = cm."userId"
FROM "cohort_memberships" cm
WHERE cm."id" = e."membershipId";

ALTER TABLE "evaluations" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_membershipId_fkey";

ALTER TABLE "evaluations" DROP COLUMN "membershipId";

ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "evaluations_userId_idx" ON "evaluations"("userId");

-- ===== STRATEGIC MAP SCORES =====

ALTER TABLE "strategic_map_scores" ADD COLUMN "userId" TEXT;

UPDATE "strategic_map_scores" s
SET "userId" = cm."userId"
FROM "cohort_memberships" cm
WHERE cm."id" = s."membershipId";

ALTER TABLE "strategic_map_scores" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "strategic_map_scores" DROP CONSTRAINT "strategic_map_scores_membershipId_fkey";

ALTER TABLE "strategic_map_scores" DROP COLUMN "membershipId";

ALTER TABLE "strategic_map_scores" ADD CONSTRAINT "strategic_map_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "strategic_map_scores_userId_idx" ON "strategic_map_scores"("userId");

-- ===== STRATEGIC PLANS =====

ALTER TABLE "strategic_plans" ADD COLUMN "userId" TEXT;

UPDATE "strategic_plans" sp
SET "userId" = cm."userId"
FROM "cohort_memberships" cm
WHERE cm."id" = sp."membershipId";

ALTER TABLE "strategic_plans" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "strategic_plans" DROP CONSTRAINT "strategic_plans_membershipId_fkey";

ALTER TABLE "strategic_plans" DROP COLUMN "membershipId";

ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "strategic_plans_userId_idx" ON "strategic_plans"("userId");

-- ===== LIFE PLANS =====

ALTER TABLE "life_plans" ADD COLUMN "userId" TEXT;

UPDATE "life_plans" lp
SET "userId" = cm."userId"
FROM "cohort_memberships" cm
WHERE cm."id" = lp."membershipId";

-- Dedup before the unique constraint lands (see note above): keep the
-- most recently updated LifePlan row per user only.
DELETE FROM "life_plans" lp
WHERE lp."id" NOT IN (
  SELECT DISTINCT ON ("userId") "id"
  FROM "life_plans"
  ORDER BY "userId", "updatedAt" DESC, "id" DESC
);

ALTER TABLE "life_plans" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "life_plans" DROP CONSTRAINT "life_plans_membershipId_fkey";

ALTER TABLE "life_plans" DROP COLUMN "membershipId";

ALTER TABLE "life_plans" ADD CONSTRAINT "life_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "life_plans_userId_key" ON "life_plans"("userId");
