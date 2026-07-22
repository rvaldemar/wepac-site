import { beforeEach, describe, expect, it, vi } from "vitest";

const mentorshipFindFirst = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    mentorship: {
      findFirst: (...args: unknown[]) => mentorshipFindFirst(...args),
    },
  },
}));

import { resolveSessionAttendeeAuthorization } from "@/lib/wepacker/guards";

describe("resolveSessionAttendeeAuthorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mentorshipFindFirst.mockResolvedValue(null);
  });

  it("accepts only an active, bilateral, reviewed Mentorship", async () => {
    mentorshipFindFirst.mockResolvedValueOnce({ id: "mentorship-1" });

    await expect(
      resolveSessionAttendeeAuthorization("organizer-1", "attendee-1"),
    ).resolves.toEqual({
      authorized: true,
      source: "mentorship",
      mentorshipId: "mentorship-1",
    });
    expect(mentorshipFindFirst).toHaveBeenCalledWith({
      where: {
        mentorId: "organizer-1",
        menteeId: "attendee-1",
        status: "active",
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: { id: true },
    });
  });

  it("fails closed without a qualifying Mentorship", async () => {
    await expect(
      resolveSessionAttendeeAuthorization("organizer-1", "attendee-1"),
    ).resolves.toEqual({
      authorized: false,
      source: null,
      mentorshipId: null,
    });
  });

  it("rejects self-attendance without querying relationships", async () => {
    await expect(
      resolveSessionAttendeeAuthorization("person-1", "person-1"),
    ).resolves.toEqual({
      authorized: false,
      source: null,
      mentorshipId: null,
    });
    expect(mentorshipFindFirst).not.toHaveBeenCalled();
  });
});
