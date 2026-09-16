import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const sessionFindMany = vi.fn();
const requireUser = vi.fn();

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
  resolveSessionAttendeeAuthorization: vi.fn(),
}));
vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: vi.fn(),
  sendSessionCancelEmail: vi.fn(),
  sendSharedNotePublishedEmail: vi.fn(),
}));
vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: vi.fn(),
  buildSessionCancelIcs: vi.fn(),
  nextIcsSequence: vi.fn(() => 1),
}));

import {
  assertSessionOrganizer,
  getMentoredSessions,
} from "@/lib/wepacker/actions/session";

const sessionGrant = {
  cycleId: "cycle-1",
  mentorshipId: "mentorship-1",
  organizerId: "organizer-1",
};

describe("Session organizer privacy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionFindMany.mockResolvedValue([]);
  });

  it("allows only the exact organizer to access private artifacts", async () => {
    requireUser.mockResolvedValueOnce({ id: "organizer-1", role: "member" });
    sessionFindUnique.mockResolvedValueOnce(sessionGrant);

    await expect(assertSessionOrganizer("session-1")).resolves.toEqual({
      ...sessionGrant,
      actorId: "organizer-1",
    });
    expect(sessionFindUnique).toHaveBeenCalledWith({
      where: { id: "session-1" },
      select: { cycleId: true, mentorshipId: true, organizerId: true },
    });
  });

  it.each([
    ["another organizer", { id: "organizer-2", role: "member" }],
    ["Admin", { id: "admin-1", role: "admin" }],
  ] as const)("denies private artifacts to %s", async (_label, actor) => {
    requireUser.mockResolvedValueOnce(actor);
    sessionFindUnique.mockResolvedValueOnce(sessionGrant);
    await expect(assertSessionOrganizer("session-1")).rejects.toThrow(
      "Permission denied.",
    );
  });
  it("lists only Sessions organized by the actor", async () => {
    requireUser.mockResolvedValueOnce({ id: "organizer-1", role: "member" });
    await getMentoredSessions();
    expect(sessionFindMany).toHaveBeenCalledWith({
      where: { organizerId: "organizer-1" },
      select: expect.objectContaining({
        cycleId: true,
        mentorshipId: true,
        transcriptUploadedAt: true,
        organizer: { select: { id: true, name: true } },
      }),
      orderBy: { scheduledAt: "desc" },
    });
  });
});
