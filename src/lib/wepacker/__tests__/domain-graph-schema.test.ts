import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(
    root,
    "prisma/migrations/20260721210000_add_domain_graph_v2_foundation/migration.sql"
  ),
  "utf8"
);

function model(name: string) {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  expect(match, `${name} must exist in the Prisma schema`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("Domain Graph v2 schema foundation", () => {
  it("keeps community, mentoring, cycle, connection and stage records separate", () => {
    const connection = model("PersonConnection");
    const mentorship = model("Mentorship");
    const communityPack = model("CommunityPack");
    const packMembership = model("PackMembership");
    const cycleEnrollment = model("CycleEnrollment");
    const cycleFacilitator = model("CycleFacilitator");
    const stagePlacement = model("StagePlacement");

    for (const domainModel of [
      connection,
      mentorship,
      communityPack,
      packMembership,
      cycleEnrollment,
      cycleFacilitator,
      stagePlacement,
    ]) {
      expect(domainModel).toContain("source");
      expect(domainModel).toContain("reviewRequired");
      expect(domainModel).toContain("createdAt");
      expect(domainModel).toContain("updatedAt");
    }

    expect(mentorship).toContain("mentorId");
    expect(mentorship).toContain("menteeId");
    expect(communityPack).not.toMatch(/\bPack\b.*@relation/);
    expect(packMembership).toContain("communityPackId");
    expect(packMembership).not.toMatch(/\bpackId\b/);
    expect(packMembership).not.toContain("CohortMembership");
    expect(cycleEnrollment).toContain("cohortId");
    expect(cycleEnrollment).not.toContain("role");
    expect(cycleFacilitator).toContain("cohortId");
    expect(schema).not.toContain("model CycleParticipation");
    expect(stagePlacement).toContain("StagePlacementStatus");
  });

  it("keeps Guardian authority out of generic personal Connections", () => {
    const connectionType = schema.match(
      /enum PersonConnectionType \{([\s\S]*?)\n\}/
    )?.[1];

    expect(connectionType).toBeDefined();
    expect(connectionType).not.toContain("guardian");
  });

  it("requires accepted, reviewed edges before they can become active", () => {
    expect(migration).toContain(
      "person_connections_active_requires_acceptance_check"
    );
    expect(migration.match(/review_quarantine_check/g)).toHaveLength(7);
    expect(schema).toMatch(
      /enum StagePlacementStatus \{[\s\S]*?pending_review[\s\S]*?active/
    );
  });

  it("records bilateral Mentorship consent and permits only one live pair", () => {
    const mentorship = model("Mentorship");

    expect(mentorship).toContain("invitedById");
    expect(mentorship).toContain("mentorAcceptedAt");
    expect(mentorship).toContain("menteeAcceptedAt");
    expect(mentorship).toContain("activatedAt");
    expect(mentorship).not.toContain("@@unique([mentorId, menteeId])");
    expect(migration).toContain("mentorships_inviter_is_endpoint_check");
    expect(migration).toContain(
      "mentorships_live_requires_bilateral_consent_check"
    );
    expect(migration).toContain("mentorships_one_live_pair_key");
    expect(migration).toMatch(
      /WHERE\s+"status"\s+IN\s+\('pending', 'active', 'paused'\)/
    );
  });

  it("makes Mentorship optional Session context without backfilling sessions", () => {
    const session = model("Session");

    expect(session).toMatch(/mentorshipId\s+String\?/);
    expect(session).toContain("onDelete: SetNull");
    expect(migration).toContain(
      'ALTER TABLE "sessions" ADD COLUMN "mentorshipId" TEXT;'
    );
    expect(migration).not.toMatch(/UPDATE\s+"sessions"/i);
  });

  it("enforces relationship and stage invariants in PostgreSQL", () => {
    expect(migration).toContain("person_connections_no_self_check");
    expect(migration).toContain("person_connections_canonical_pair_check");
    expect(migration).toContain("mentorships_no_self_check");
    expect(migration).toContain("stage_placements_one_active_per_user_key");
    expect(migration).toMatch(
      /WHERE\s+"status"\s*=\s*'active'/
    );
    expect(migration.match(/legacy_review_check/g)).toHaveLength(7);
    expect(migration).toContain("ON DELETE RESTRICT");
    expect(migration).not.toMatch(
      /pack_memberships[^;]+REFERENCES\s+"packs"/i
    );
  });

  it("does not infer new domain records from legacy memberships", () => {
    expect(migration).not.toMatch(
      /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"(?:person_connections|mentorships|community_packs|pack_memberships|cycle_enrollments|cycle_facilitators|stage_placements|cohort_memberships|packs)"/i
    );
  });
});
