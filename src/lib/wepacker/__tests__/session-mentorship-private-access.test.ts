import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const sessionFindMany = vi.fn();
const requireUser = vi.fn();
const assertMentorOfCohort = vi.fn();
const getMentoredCohortIds = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
      findMany: (...args: unknown[]) => sessionFindMany(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  assertMentorOfCohort: (...args: unknown[]) => assertMentorOfCohort(...args),
  getMentoredCohortIds: (...args: unknown[]) => getMentoredCohortIds(...args),
}));

import {
  assertMentorOfSession,
  getMentoredSessions,
} from "@/lib/wepacker/actions/session";

describe("Mentorship-linked Session privacy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getMentoredCohortIds.mockResolvedValue(["cycle-1"]);
    sessionFindMany.mockResolvedValue([]);
  });

  it("does not expose a direct Mentorship Session to an unrelated co-mentor of its Cycle", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      cohortId: "cycle-1",
      mentorshipId: "mentorship-1",
      mentorId: "organizer-1",
    });
    requireUser.mockResolvedValueOnce({ id: "co-mentor-1", role: "mentor" });

    await expect(assertMentorOfSession("session-1")).rejects.toThrow(
      "Sem permissão."
    );

    expect(assertMentorOfCohort).not.toHaveBeenCalled();
  });

  it.each([
    ["organizer", { id: "organizer-1", role: "mentor" }],
    ["admin", { id: "admin-1", role: "admin" }],
  ] as const)("allows the %s to access the direct Session", async (_label, actor) => {
    const row = {
      cohortId: "cycle-1",
      mentorshipId: "mentorship-1",
      mentorId: "organizer-1",
    };
    sessionFindUnique.mockResolvedValueOnce(row);
    requireUser.mockResolvedValueOnce(actor);

    await expect(assertMentorOfSession("session-1")).resolves.toEqual(row);
    expect(assertMentorOfCohort).not.toHaveBeenCalled();
  });

  it("keeps transitional Cycle-wide access only for Sessions without a Mentorship link", async () => {
    const row = {
      cohortId: "cycle-1",
      mentorshipId: null,
      mentorId: "organizer-1",
    };
    sessionFindUnique.mockResolvedValueOnce(row);
    assertMentorOfCohort.mockResolvedValueOnce({ id: "co-mentor-1", role: "mentor" });

    await expect(assertMentorOfSession("session-1")).resolves.toEqual(row);
    expect(assertMentorOfCohort).toHaveBeenCalledWith("cycle-1");
    expect(requireUser).not.toHaveBeenCalled();
  });

  it("excludes other organizers' Mentorship-linked Sessions from the Cycle-wide list", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });

    await getMentoredSessions();

    expect(sessionFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { cohortId: { in: ["cycle-1"] }, mentorshipId: null },
          { mentorId: "mentor-1" },
        ],
      },
      include: expect.any(Object),
      orderBy: { scheduledAt: "desc" },
    });
  });
});
