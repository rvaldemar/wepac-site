import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(
    root,
    "prisma/migrations/20260722130000_domain_graph_target_expand/migration.sql",
  ),
  "utf8",
);
const releaseBContraction = readFileSync(
  join(root, "prisma/release-b/drop_legacy_domain.sql"),
  "utf8",
);
const accountRoleMigration = readFileSync(
  join(
    root,
    "prisma/migrations/20260722170000_retire_mentor_account_role_data/migration.sql",
  ),
  "utf8",
);
const terminalSocialDeclinesMigration = readFileSync(
  join(
    root,
    "prisma/migrations/20260722190000_terminal_social_declines/migration.sql",
  ),
  "utf8",
);

function model(name: string) {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  expect(match, `${name} must exist in the Prisma schema`).not.toBeNull();
  return match?.[1] ?? "";
}

function enumBody(name: string) {
  const match = schema.match(new RegExp(`enum ${name} \\{([\\s\\S]*?)\\n\\}`));
  expect(match, `${name} must exist in the Prisma schema`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("Domain Graph target schema", () => {
  it("removes legacy delivery and assessment models from the Prisma client", () => {
    for (const retired of [
      "Cohort",
      "CohortMembership",
      "Task",
      "MonthlyAction",
      "Evaluation",
      "EvaluationScore",
      "StrategicMapScore",
      "Comment",
    ]) {
      expect(schema).not.toMatch(new RegExp(`model ${retired} \\{`));
    }

    for (const retired of [
      "MemberLevel",
      "MemberPhase",
      "CohortStatus",
      "MembershipRole",
      "MembershipStatus",
      "TaskStatus",
      "TaskOrigin",
      "EvaluationType",
      "EvaluationMoment",
      "SessionType",
    ]) {
      expect(schema).not.toMatch(new RegExp(`enum ${retired} \\{`));
    }

    expect(schema).not.toContain('@@map("packs")');
    expect(schema).not.toContain('@@map("cohorts")');
    expect(schema).not.toContain('@@map("cohort_memberships")');
    expect(schema).not.toContain("legacy_inference");
    expect(schema).not.toContain("reviewRequired");
  });

  it("uses canonical names while retaining safe physical mappings", () => {
    expect(model("Pack")).toContain('@@map("community_packs")');
    expect(model("Pack")).toContain("personalOwnerId String?");
    expect(model("Pack")).toContain('@relation("PackPersonalOwner"');
    expect(model("LifeMap")).toContain('@@map("life_plans")');
    expect(model("LifeMapVersion")).toContain(
      '@@map("life_plan_versions")',
    );
    expect(enumBody("PackStatus")).toContain(
      '@@map("CommunityPackStatus")',
    );
    expect(enumBody("PillarKey")).toContain('@@map("AreaKey")');
  });

  it("keeps target-controlled social declines distinct and durable", () => {
    expect(enumBody("PersonConnectionStatus")).toMatch(/\bblocked\b/);
    expect(enumBody("PackMembershipStatus")).not.toMatch(/\bdeclined\b/);
    expect(model("PackMembership")).toContain("declinedAt  DateTime?");
    expect(terminalSocialDeclinesMigration).toContain(
      'ADD COLUMN "declinedAt" TIMESTAMP(3)',
    );
  });

  it("keeps account access separate from explicit Mentorship", () => {
    const accountRoles = enumBody("UserRole");

    expect(accountRoles).toMatch(/\bmember\b/);
    expect(accountRoles).toMatch(/\badmin\b/);
    expect(accountRoles).not.toMatch(/\bmentor\b/);
    expect(accountRoleMigration).toContain(
      'WHERE "role" = \'mentor\'',
    );
    expect(accountRoleMigration).toContain(
      'ADD COLUMN "_legacyMentorAccountRole"',
    );
    expect(accountRoleMigration).not.toContain('ALTER TYPE "UserRole"');
  });

  it("models Discipline and a real Cycle instead of relabelling Cohort", () => {
    const discipline = model("Discipline");
    const cycle = model("Cycle");
    const enrollment = model("CycleEnrollment");
    const facilitator = model("CycleFacilitator");

    expect(discipline).toContain("slug");
    expect(discipline).toContain("cycles Cycle[]");
    expect(cycle).toContain("status");
    expect(cycle).toContain("stage");
    expect(cycle).toContain("primaryDisciplineId");
    expect(cycle).toContain("createdById");
    expect(cycle).not.toContain("packId");

    for (const edge of [enrollment, facilitator]) {
      expect(edge).toContain("cycleId");
      expect(edge).toContain("cycle Cycle");
      expect(edge).not.toContain("cohortId");
      expect(edge).not.toContain("Cohort");
    }

    expect(migration).toContain('CREATE TABLE "disciplines"');
    expect(migration).toContain('CREATE TABLE "cycles"');
    expect(migration).toContain("cycles_publish_readiness_check");
    expect(migration).not.toContain("cycles_review_quarantine_check");
    expect(migration).not.toContain("cycles_legacy_review_check");
  });

  it("has one Person-owned Action contract and no parallel Task concept", () => {
    const action = model("Action");
    const statuses = enumBody("ActionStatus");
    const origins = enumBody("ActionOrigin");

    expect(action).toContain("assigneeId");
    expect(action).toContain("createdById");
    expect(action).toContain("dueAt");
    expect(action).toContain("strategicPlanId");
    expect(action).toContain("goalId");
    expect(action).toContain("trailId");
    expect(action).toContain("sourceSessionId");
    expect(action).toContain("cycleId");
    expect(action).toContain("mentorshipId");
    expect(action).toContain('@@map("actions")');

    for (const value of [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
    ]) {
      expect(statuses).toMatch(new RegExp(`\\b${value}\\b`));
    }
    for (const value of ["self", "plan", "session_proposal"]) {
      expect(origins).toMatch(new RegExp(`\\b${value}\\b`));
    }

    expect(migration).toContain("actions_release_a_self_create_check");
  });

  it("makes Session canonical and derives format from attendees", () => {
    const session = model("Session");

    expect(session).toContain("cycleId");
    expect(session).toContain("mentorshipId");
    expect(session).toMatch(/organizerId\s+String\s+@map\("mentorId"\)/);
    expect(session).toContain('relation("SessionOrganizer"');
    expect(session).toMatch(
      /organizer\s+User\s+@relation\("SessionOrganizer"[^\n]+onDelete: Restrict/,
    );
    expect(session).toContain("sourcedActions");
    expect(session).not.toMatch(/^\s+cohortId\s/m);
    expect(session).not.toMatch(/^\s+sessionType\s/m);
    expect(session).not.toMatch(/^\s+notes\s/m);
    expect(session).not.toMatch(/^\s+notesPublished\s/m);
    expect(session).not.toMatch(/^\s+mentorId\s/m);

    expect(migration).toContain('ADD COLUMN "cycleId" TEXT');
    expect(migration).toContain(
      'ALTER COLUMN "sessionType" SET DEFAULT \'individual\'',
    );
    expect(migration).toContain('DROP CONSTRAINT "sessions_mentorId_fkey"');
    expect(migration).toContain(
      'DROP CONSTRAINT "session_attendees_userId_fkey"',
    );
  });

  it("exposes only W01 v3 debrief semantics", () => {
    const debrief = model("SessionDebrief");

    expect(debrief).toContain("contractVersion");
    expect(debrief).toMatch(/^\s+internalSynthesis\s+Json\?/m);
    expect(debrief).not.toMatch(/^\s+internalEvaluation\s/m);
    expect(debrief).not.toMatch(/^\s+resultDocumentHtml\s/m);
    expect(migration).toContain('ADD COLUMN "contractVersion" TEXT');
    expect(migration).toContain('ADD COLUMN "internalSynthesis" JSONB');
    expect(debrief).not.toContain("anthropic-direct");
    expect(debrief).not.toContain("v1");
  });

  it("keeps Release A migration compatible with old physical tables", () => {
    const sessionMigration = migration
      .split("-- ===== TARGET SESSION CONTEXT =====")[1]
      ?.split("-- ===== PERSON-OWNED ACTIONS =====")[0];

    for (const table of [
      "packs",
      "cohorts",
      "cohort_memberships",
      "tasks",
      "monthly_actions",
      "evaluations",
      "evaluation_scores",
      "strategic_map_scores",
      "comments",
    ]) {
      expect(migration).not.toMatch(
        new RegExp(`DROP TABLE(?: IF EXISTS)? "${table}"`, "i"),
      );
    }

    expect(sessionMigration).not.toContain('DROP COLUMN "sessionType"');
    expect(sessionMigration).not.toContain('DROP COLUMN "cohortId"');
    expect(migration).toContain("Target Cycle foundation rows exist");
    expect(migration).not.toContain('DELETE FROM "cycle_enrollments"');
    expect(migration).not.toContain('DELETE FROM "cycle_facilitators"');
    expect(migration).not.toContain('DELETE FROM "cohort_memberships"');
    expect(migration).not.toContain('DELETE FROM "packs"');
  });

  it("stages complete physical legacy removal outside Release A", () => {
    expect(migration).toContain(
      "prisma/release-b/drop_legacy_domain.sql",
    );

    for (const table of [
      "packs",
      "cohorts",
      "cohort_memberships",
      "tasks",
      "monthly_actions",
      "evaluations",
      "evaluation_scores",
      "strategic_map_scores",
      "comments",
    ]) {
      expect(releaseBContraction).toContain(`DROP TABLE "${table}"`);
    }

    for (const column of [
      "packSlug",
      "cohortId",
      "notes",
      "notesPublished",
      "sessionType",
    ]) {
      expect(releaseBContraction).toContain(`DROP COLUMN "${column}"`);
    }

    for (const retiredEnum of [
      "CohortStatus",
      "EvaluationMoment",
      "EvaluationType",
      "MemberLevel",
      "MemberPhase",
      "MembershipRole",
      "MembershipStatus",
      "SessionType",
      "TaskOrigin",
      "TaskStatus",
    ]) {
      expect(releaseBContraction).toContain(`DROP TYPE "${retiredEnum}"`);
    }

    expect(releaseBContraction).not.toContain('DROP TABLE "users"');
    expect(releaseBContraction).not.toContain('DROP TABLE "life_plans"');
    expect(releaseBContraction).not.toContain(
      'DROP TABLE "strategic_plans"',
    );
    expect(releaseBContraction).not.toContain('DROP TABLE "sessions"');
    expect(releaseBContraction).not.toContain('DROP TABLE "actions"');
    expect(releaseBContraction).toContain('DROP COLUMN "reviewRequired"');
    expect(releaseBContraction).toContain("$review_required_guard$");
    expect(releaseBContraction).toContain(
      "reviewRequired rows require an explicit inventory decision",
    );
    expect(releaseBContraction).toContain(
      "WHERE \"contractVersion\" IS DISTINCT FROM 'wepac-session-debrief-v3'",
    );
    expect(releaseBContraction).toContain(
      'ALTER COLUMN "contractVersion" SET NOT NULL',
    );
    expect(releaseBContraction).toContain('DROP COLUMN "internalEvaluation"');
    expect(releaseBContraction).toContain('DROP COLUMN "resultDocumentHtml"');
    expect(releaseBContraction).toContain(
      'CREATE TYPE "DomainRecordSource_new"',
    );
    expect(releaseBContraction).toContain(
      'CREATE TYPE "UserRole_new" AS ENUM (\'member\', \'admin\')',
    );
    expect(releaseBContraction).toContain("$mentor_account_role_guard$");
    expect(releaseBContraction).toContain(
      'DROP COLUMN "_legacyMentorAccountRole"',
    );
    const contractedSourceEnum = releaseBContraction.match(
      /CREATE TYPE "DomainRecordSource_new" AS ENUM \(([\s\S]*?)\);/,
    )?.[1];
    expect(contractedSourceEnum).toContain("'explicit'");
    expect(contractedSourceEnum).toContain("'invitation'");
    expect(contractedSourceEnum).toContain("'admin'");
    expect(contractedSourceEnum).toContain("'system'");
    expect(contractedSourceEnum).not.toContain("'legacy_inference'");
    expect(releaseBContraction).toContain("$legacy_source_guard$");
    expect(releaseBContraction).toContain(
      "legacy_inference rows require an explicit inventory decision",
    );
    expect(releaseBContraction).not.toMatch(
      /SET\s+"source"\s*=\s*'explicit'\s+WHERE\s+"source"\s*=\s*'legacy_inference'/,
    );
  });

  it("keeps generic intake independent from a Pack", () => {
    expect(model("BetaSignup")).not.toContain("packSlug");
  });
});
