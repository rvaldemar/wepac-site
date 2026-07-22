import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const enrollmentFindMany = vi.fn();
const facilitationFindMany = vi.fn();
const enrollmentCreate = vi.fn();
const facilitationCreate = vi.fn();

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    cycleEnrollment: {
      findMany: (...args: unknown[]) => enrollmentFindMany(...args),
      create: (...args: unknown[]) => enrollmentCreate(...args),
    },
    cycleFacilitator: {
      findMany: (...args: unknown[]) => facilitationFindMany(...args),
      create: (...args: unknown[]) => facilitationCreate(...args),
    },
  },
}));

import { getMyAcademyParticipation } from "@/lib/wepacker/actions/academy";

beforeEach(() => {
  vi.resetAllMocks();
  requireUser.mockResolvedValue({
    id: "person-1",
    role: "member",
    name: "Person",
    email: "person@example.test",
  });
  enrollmentFindMany.mockResolvedValue([]);
  facilitationFindMany.mockResolvedValue([]);
});

describe("Academy participation projection", () => {
  it("reads accepted Cycle edges only and scopes both queries to the actor", async () => {
    await expect(getMyAcademyParticipation()).resolves.toEqual({
      enrollments: [],
      facilitations: [],
    });

    expect(enrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "person-1",
          status: { in: ["active", "paused", "completed"] },
        },
      }),
    );
    expect(facilitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "person-1",
          status: { in: ["active", "paused"] },
          acceptedAt: { not: null },
        },
      }),
    );
    expect(enrollmentCreate).not.toHaveBeenCalled();
    expect(facilitationCreate).not.toHaveBeenCalled();
  });

  it("returns Stage, Discipline and dates without exposing another Person", async () => {
    const startsAt = new Date("2026-09-01T09:00:00.000Z");
    const endsAt = new Date("2026-12-01T17:00:00.000Z");
    const invitedAt = new Date("2026-07-22T10:00:00.000Z");
    const joinedAt = new Date("2026-07-23T10:00:00.000Z");
    enrollmentFindMany.mockResolvedValueOnce([
      {
        id: "enrollment-1",
        status: "active",
        invitedAt,
        joinedAt,
        completedAt: null,
        cycle: {
          id: "cycle-1",
          name: "Arts Cycle",
          description: "Practice through the Six Pillars",
          status: "published",
          stage: "step_up",
          startsAt,
          endsAt,
          primaryDiscipline: { slug: "arts", name: "Arts" },
        },
      },
    ]);

    const result = await getMyAcademyParticipation();
    expect(result.enrollments[0]).toEqual({
      id: "enrollment-1",
      status: "active",
      invitedAt: invitedAt.toISOString(),
      joinedAt: joinedAt.toISOString(),
      completedAt: null,
      cycle: {
        id: "cycle-1",
        name: "Arts Cycle",
        description: "Practice through the Six Pillars",
        status: "published",
        stage: "step_up",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        primaryDiscipline: { slug: "arts", name: "Arts" },
      },
    });

    const selection = enrollmentFindMany.mock.calls[0][0].select;
    expect(selection).not.toHaveProperty("user");
    expect(selection.cycle.select).not.toHaveProperty("enrollments");
    expect(selection.cycle.select).not.toHaveProperty("facilitators");
  });
});
