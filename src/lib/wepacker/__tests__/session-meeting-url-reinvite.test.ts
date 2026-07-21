import { describe, it, expect, vi, beforeEach } from "vitest";

// Story T1/S: a mentor swapping in a manual meeting link (Zoom/Teams/etc,
// replacing the auto-generated Jitsi one) on an already-scheduled session
// must trigger a fresh calendar REQUEST — otherwise attendees keep the
// stale link in their calendar app forever. Cancel/reschedule still take
// priority over a same-call meeting-link change (no double-send).

const sessionFindUnique = vi.fn();
const sessionUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
      update: (...args: unknown[]) => sessionUpdate(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  assertMentorOfCohort: vi.fn(),
  assertMentorOfUsers: vi.fn(),
  getMentoredCohortIds: vi.fn(async () => []),
  requireMembership: vi.fn(),
  requireRole: vi.fn(),
  requireUser: vi.fn(async () => ({ id: "mentor-1", role: "mentor" })),
}));

const sendSessionInviteEmail = vi.fn(async (...args: unknown[]) => {
  void args;
});
const sendSessionCancelEmail = vi.fn(async (...args: unknown[]) => {
  void args;
});
vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: (...args: unknown[]) =>
    sendSessionInviteEmail(...args),
  sendSessionCancelEmail: (...args: unknown[]) =>
    sendSessionCancelEmail(...args),
}));

vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: vi.fn(() => "ICS-REQUEST"),
  buildSessionCancelIcs: vi.fn(() => "ICS-CANCEL"),
  nextIcsSequence: vi.fn(() => 42),
}));

import { updateSession } from "@/lib/wepacker/actions/session";

const scheduledAt = new Date("2026-08-10T14:30:00.000Z");

const calendarContextRow = {
  kind: "checkpoint",
  scheduledAt,
  durationMinutes: 45,
  meetingUrl: "https://meet.jit.si/wepac-new",
  mentor: { id: "mentor-1", name: "Ana Mentor", email: "mentor@wepac.pt" },
  attendees: [
    { user: { id: "member-1", name: "Member One", email: "member1@wepac.pt" } },
  ],
};

describe("updateSession — meeting link re-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("re-sends a REQUEST when only meetingUrl changes", async () => {
    sessionFindUnique
      // assertMentorOfSession
      .mockResolvedValueOnce({ cohortId: null, mentorId: "mentor-1" })
      // before-snapshot
      .mockResolvedValueOnce({
        scheduledAt,
        status: "scheduled",
        meetingUrl: "https://meet.jit.si/wepac-old",
      })
      // getSessionCalendarContext (fire-and-forget email fan-out)
      .mockResolvedValueOnce(calendarContextRow);
    sessionUpdate.mockResolvedValueOnce({
      id: "session-1",
      scheduledAt,
      status: "scheduled",
      meetingUrl: "https://meet.jit.si/wepac-new",
    });

    const result = await updateSession("session-1", {
      meetingUrl: "https://meet.jit.si/wepac-new",
    });

    expect(result).toEqual({ id: "session-1" });
    expect(sessionUpdate).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: { meetingUrl: "https://meet.jit.si/wepac-new" },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        meetingUrl: true,
      },
    });

    await vi.waitFor(() => {
      expect(sendSessionInviteEmail).toHaveBeenCalledTimes(2); // mentor + attendee
    });
    expect(sendSessionCancelEmail).not.toHaveBeenCalled();
  });

  it("does not re-send when meetingUrl is passed but unchanged", async () => {
    const sameUrl = "https://meet.jit.si/wepac-same";
    sessionFindUnique
      .mockResolvedValueOnce({ cohortId: null, mentorId: "mentor-1" })
      .mockResolvedValueOnce({
        scheduledAt,
        status: "scheduled",
        meetingUrl: sameUrl,
      });
    sessionUpdate.mockResolvedValueOnce({
      id: "session-1",
      scheduledAt,
      status: "scheduled",
      meetingUrl: sameUrl,
    });

    await updateSession("session-1", { meetingUrl: sameUrl });

    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSessionInviteEmail).not.toHaveBeenCalled();
    expect(sendSessionCancelEmail).not.toHaveBeenCalled();
  });

  it("sends only CANCEL, not REQUEST, when cancelled and meetingUrl change in the same call", async () => {
    sessionFindUnique
      .mockResolvedValueOnce({ cohortId: null, mentorId: "mentor-1" })
      .mockResolvedValueOnce({
        scheduledAt,
        status: "scheduled",
        meetingUrl: "https://meet.jit.si/wepac-old",
      })
      .mockResolvedValueOnce(calendarContextRow);
    sessionUpdate.mockResolvedValueOnce({
      id: "session-1",
      scheduledAt,
      status: "cancelled",
      meetingUrl: "https://meet.jit.si/wepac-new",
    });

    await updateSession("session-1", {
      status: "cancelled",
      meetingUrl: "https://meet.jit.si/wepac-new",
    });

    await vi.waitFor(() => {
      expect(sendSessionCancelEmail).toHaveBeenCalledTimes(2);
    });
    expect(sendSessionInviteEmail).not.toHaveBeenCalled();
  });

  it("rejects runtime fields outside the update allowlist before writing", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      cohortId: null,
      mentorshipId: null,
      mentorId: "mentor-1",
    });

    await expect(
      updateSession("session-1", {
        meetingUrl: "https://meet.example/safe",
        transcript: "private transcript",
        transcriptUploadedById: "attacker-1",
        mentorId: "attacker-1",
      } as never),
    ).rejects.toThrow("Campos de Session inválidos");

    expect(sessionUpdate).not.toHaveBeenCalled();
  });
});
