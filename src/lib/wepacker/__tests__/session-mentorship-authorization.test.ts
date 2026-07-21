import { beforeEach, describe, expect, it, vi } from "vitest";

const mentorshipFindFirst = vi.fn();
const membershipFindMany = vi.fn();
const membershipFindFirst = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    mentorship: {
      findFirst: (...args: unknown[]) => mentorshipFindFirst(...args),
    },
    cohortMembership: {
      findMany: (...args: unknown[]) => membershipFindMany(...args),
      findFirst: (...args: unknown[]) => membershipFindFirst(...args),
    },
  },
}));

import {
  isMentoredUser,
  resolveSessionAttendeeAuthorization,
} from "@/lib/wepacker/guards";

describe("resolveSessionAttendeeAuthorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mentorshipFindFirst.mockResolvedValue(null);
    membershipFindMany.mockResolvedValue([]);
    membershipFindFirst.mockResolvedValue(null);
  });

  it("accepts only an active, reviewed, bilateral and non-ended Mentorship", async () => {
    mentorshipFindFirst.mockResolvedValueOnce({ id: "mentorship-1" });

    await expect(
      resolveSessionAttendeeAuthorization("mentor-1", "mentee-1")
    ).resolves.toEqual({
      authorized: true,
      source: "mentorship",
      mentorshipId: "mentorship-1",
    });

    expect(mentorshipFindFirst).toHaveBeenCalledWith({
      where: {
        mentorId: "mentor-1",
        menteeId: "mentee-1",
        status: "active",
        reviewRequired: false,
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: { id: true },
    });
    expect(membershipFindMany).not.toHaveBeenCalled();
    expect(membershipFindFirst).not.toHaveBeenCalled();
  });

  it("uses only active member + active mentor rows for the legacy fallback", async () => {
    membershipFindMany.mockResolvedValueOnce([{ cohortId: "cycle-1" }]);
    membershipFindFirst.mockResolvedValueOnce({ id: "legacy-member-1" });

    await expect(
      resolveSessionAttendeeAuthorization("mentor-1", "person-1")
    ).resolves.toEqual({
      authorized: true,
      source: "legacy_cohort",
      mentorshipId: null,
    });

    expect(membershipFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "person-1",
        role: "member",
        status: "active",
        cohortId: { in: ["cycle-1"] },
        cohort: {
          memberships: {
            some: {
              userId: "mentor-1",
              role: "mentor",
              status: "active",
            },
          },
        },
      },
      select: { id: true },
    });
  });

  it("fails closed for self-attendance without touching relationship data", async () => {
    await expect(
      resolveSessionAttendeeAuthorization("person-1", "person-1")
    ).resolves.toEqual({
      authorized: false,
      source: null,
      mentorshipId: null,
    });

    expect(mentorshipFindFirst).not.toHaveBeenCalled();
    expect(membershipFindMany).not.toHaveBeenCalled();
    expect(membershipFindFirst).not.toHaveBeenCalled();
  });

  it("does not broaden the generic person-data guard when only a Mentorship exists", async () => {
    mentorshipFindFirst.mockResolvedValueOnce({ id: "mentorship-1" });

    await expect(isMentoredUser("mentor-1", "mentee-1")).resolves.toBe(false);

    // isMentoredUser remains Cohort-only and never consults Mentorship; the
    // new edge therefore cannot unlock Life Map/Trails/Assessment access.
    expect(mentorshipFindFirst).not.toHaveBeenCalled();
    expect(membershipFindMany).toHaveBeenCalledWith({
      where: { userId: "mentor-1", role: "mentor", status: "active" },
      select: { cohortId: true },
    });
  });
});
