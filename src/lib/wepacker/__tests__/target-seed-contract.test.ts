import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seed = readFileSync(join(process.cwd(), "prisma/seed.ts"), "utf8");

describe("target-only WEPACKER seed", () => {
  it("never creates legacy delivery, Task or Assessment records", () => {
    expect(seed).not.toMatch(
      /prisma\.(?:cohort|cohortMembership|task|monthlyAction|evaluation|evaluationScore|strategicMapScore)\.(?:create|createMany|upsert)/,
    );
    expect(seed).not.toContain("prisma.comment.");
    expect(seed).not.toContain("membershipId:");
    expect(seed).not.toContain("cohortId:");
    expect(seed).not.toContain("packSlug:");
    expect(seed).not.toContain("sessionType:");
  });

  it("creates canonical graph fixtures and explicit relationships", () => {
    expect(seed).toContain("prisma.discipline.create");
    expect(seed).toContain("prisma.cycle.create");
    expect(seed).toContain("prisma.cycleEnrollment.createMany");
    expect(seed).toContain("prisma.cycleFacilitator.create");
    expect(seed).toContain("prisma.pack.create");
    expect(seed).toContain("prisma.packMembership.createMany");
    expect(seed).toContain("prisma.mentorship.create");
    expect(seed).toContain('status: "active"');
    expect(seed).toContain("mentorAcceptedAt:");
    expect(seed).toContain("menteeAcceptedAt:");
    expect(seed).toContain("activatedAt:");
  });

  it("creates Sessions with explicit attendees and self-owned Actions", () => {
    expect(seed).toContain("organizerId: rui.id");
    expect(seed).toContain("attendees:");
    expect(seed).toContain("prisma.action.createMany");
    expect(seed).toContain("prisma.action.create");
    expect(seed).toContain("assigneeId: ana.id");
    expect(seed).toContain("createdById: ana.id");
    expect(seed).toContain('origin: "session_proposal"');
    expect(seed).toContain("sourceSessionId: individualSession.id");
  });

  it("maps Life Map and Six Pillar fixtures through target names", () => {
    expect(seed).toContain("prisma.lifeMap.create");
    expect(seed).toContain("prisma.trail.create");
    expect(seed).toContain("focusAreas:");
    expect(seed).not.toContain("prisma.lifePlan.create");
  });
});
