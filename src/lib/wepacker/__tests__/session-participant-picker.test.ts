import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindMany = vi.fn();
const membershipFindMany = vi.fn();
const requireRole = vi.fn();
const getMentoredCohortIds = vi.fn();
const assertMentorOfCohort = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => userFindMany(...args),
    },
    cohortMembership: {
      findMany: (...args: unknown[]) => membershipFindMany(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
  getMentoredCohortIds: (...args: unknown[]) => getMentoredCohortIds(...args),
  assertMentorOfCohort: (...args: unknown[]) => assertMentorOfCohort(...args),
}));

import {
  createSession,
  getMentoredMembers,
} from "@/lib/wepacker/actions/session";

describe("getMentoredMembers — personal-session participant picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows every other user to an admin, even without a Journey membership", async () => {
    requireRole.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    userFindMany.mockResolvedValueOnce([
      {
        id: "member-without-membership",
        name: "Alexandre Florindo",
        email: "alexandre@example.com",
      },
      {
        id: "staff-with-member-membership",
        name: "Rui Valdemar Santos",
        email: "rui@example.com",
      },
    ]);

    await expect(getMentoredMembers()).resolves.toEqual([
      {
        id: "member-without-membership",
        name: "Alexandre Florindo",
        email: "alexandre@example.com",
      },
      {
        id: "staff-with-member-membership",
        name: "Rui Valdemar Santos",
        email: "rui@example.com",
      },
    ]);

    expect(userFindMany).toHaveBeenCalledWith({
      where: { id: { not: "admin-1" } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    expect(membershipFindMany).not.toHaveBeenCalled();
    expect(getMentoredCohortIds).not.toHaveBeenCalled();
  });

  it("keeps a mentor limited to member users in Journeys they mentor", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    getMentoredCohortIds.mockResolvedValueOnce(["journey-1", "journey-2"]);
    membershipFindMany.mockResolvedValueOnce([
      {
        userId: "member-1",
        user: { id: "member-1", name: "Pessoa Um", email: "um@example.com" },
      },
      {
        userId: "member-1",
        user: { id: "member-1", name: "Pessoa Um", email: "um@example.com" },
      },
      {
        userId: "member-2",
        user: {
          id: "member-2",
          name: "Pessoa Dois",
          email: "dois@example.com",
        },
      },
    ]);

    await expect(getMentoredMembers()).resolves.toEqual([
      { id: "member-1", name: "Pessoa Um", email: "um@example.com" },
      { id: "member-2", name: "Pessoa Dois", email: "dois@example.com" },
    ]);

    expect(getMentoredCohortIds).toHaveBeenCalledWith("mentor-1");
    expect(membershipFindMany).toHaveBeenCalledWith({
      where: {
        role: "member",
        status: "active",
        userId: { not: "mentor-1" },
        cohortId: { in: ["journey-1", "journey-2"] },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    });
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("rejects an admin adding themselves to a personal session", async () => {
    requireRole.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    userFindMany.mockResolvedValueOnce([]);

    await expect(
      createSession({
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["admin-1"],
      })
    ).rejects.toThrow("Participantes inválidos para esta sessão.");

    expect(userFindMany).toHaveBeenCalledWith({
      where: { id: { in: ["admin-1"], not: "admin-1" } },
      select: { id: true },
    });
  });

  it("only accepts active member memberships for a mentor's personal session", async () => {
    requireRole.mockResolvedValueOnce({ id: "mentor-1", role: "mentor" });
    getMentoredCohortIds.mockResolvedValueOnce(["journey-1"]);
    membershipFindMany.mockResolvedValueOnce([]);

    await expect(
      createSession({
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["inactive-member"],
      })
    ).rejects.toThrow("Participantes inválidos para esta sessão.");

    expect(membershipFindMany).toHaveBeenCalledWith({
      where: {
        userId: { in: ["inactive-member"], not: "mentor-1" },
        cohortId: { in: ["journey-1"] },
        role: "member",
        status: "active",
      },
      select: { userId: true },
    });
  });

  it("only accepts active member memberships for a Journey session", async () => {
    assertMentorOfCohort.mockResolvedValueOnce({
      id: "admin-1",
      role: "admin",
    });
    membershipFindMany.mockResolvedValueOnce([]);

    await expect(
      createSession({
        cohortId: "journey-1",
        sessionType: "individual",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["paused-member"],
      })
    ).rejects.toThrow("Participantes inválidos para esta Journey.");

    expect(membershipFindMany).toHaveBeenCalledWith({
      where: {
        userId: { in: ["paused-member"], not: "admin-1" },
        cohortId: "journey-1",
        role: "member",
        status: "active",
      },
      select: { userId: true },
    });
  });
});
