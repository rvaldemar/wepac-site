import { describe, it, expect, vi, beforeEach } from "vitest";

// Story T1/S: a mentor swapping in a manual meeting link (Zoom/Teams/etc,
// replacing the auto-generated Jitsi one) on an already-scheduled session
// must trigger a fresh calendar REQUEST — otherwise attendees keep the
// stale link in their calendar app forever. Cancel/reschedule still take
// priority over a same-call meeting-link change (no double-send).

const sessionFindUnique = vi.fn();
const sessionUpdate = vi.fn();
const txQueryRaw = vi.fn();
const persistSessionEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const sessionTransitionDedupeScope = vi.fn(
  (_before?: unknown, _after?: unknown, _transitionId?: unknown) => {
    void _before;
    void _after;
    void _transitionId;
    return "transition-scope";
  },
);
const prismaTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      $queryRaw: (...args: unknown[]) => txQueryRaw(...args),
      session: {
        update: (...args: unknown[]) => sessionUpdate(...args),
      },
    }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
      update: (...args: unknown[]) => sessionUpdate(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      prismaTransaction(callback),
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: vi.fn(async () => ({ id: "organizer-1", role: "member" })),
  resolveSessionAttendeeAuthorization: vi.fn(),
}));

vi.mock("@/lib/wepacker/notifications", () => ({
  persistSessionEvent: (...args: unknown[]) => persistSessionEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
  sessionTransitionDedupeScope: (
    before: unknown,
    after: unknown,
    transitionId?: unknown,
  ) => sessionTransitionDedupeScope(before, after, transitionId),
}));

import { updateSession } from "@/lib/wepacker/actions/session";

const scheduledAt = new Date("2026-08-10T14:30:00.000Z");

describe("updateSession — meeting link re-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistSessionEvent.mockResolvedValue([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
  });

  it("re-sends a REQUEST when only meetingUrl changes", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      cycleId: null,
      mentorshipId: null,
      organizerId: "organizer-1",
    });
    txQueryRaw.mockResolvedValueOnce([{
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: 45,
      status: "scheduled",
      meetingUrl: "https://meet.jit.si/wepac-old",
    }]);
    sessionUpdate.mockResolvedValueOnce({
      id: "session-1",
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: 45,
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
        kind: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
        meetingUrl: true,
      },
    });

    expect(persistSessionEvent).toHaveBeenCalledWith(expect.any(Object), {
      sessionId: "session-1",
      actorId: "organizer-1",
      type: "session_updated",
      dedupeScope: "transition-scope",
    });
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledOnce();
  });

  it("does not re-send when meetingUrl is passed but unchanged", async () => {
    const sameUrl = "https://meet.jit.si/wepac-same";
    sessionFindUnique.mockResolvedValueOnce({
      cycleId: null,
      mentorshipId: null,
      organizerId: "organizer-1",
    });
    txQueryRaw.mockResolvedValueOnce([{
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: 45,
      status: "scheduled",
      meetingUrl: sameUrl,
    }]);
    sessionUpdate.mockResolvedValueOnce({
      id: "session-1",
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: 45,
      status: "scheduled",
      meetingUrl: sameUrl,
    });

    await updateSession("session-1", { meetingUrl: sameUrl });

    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(persistSessionEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([]);
  });

  it("sends only CANCEL, not REQUEST, when cancelled and meetingUrl change in the same call", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      cycleId: null,
      mentorshipId: null,
      organizerId: "organizer-1",
    });
    txQueryRaw.mockResolvedValueOnce([{
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: 45,
      status: "scheduled",
      meetingUrl: "https://meet.jit.si/wepac-old",
    }]);
    sessionUpdate.mockResolvedValueOnce({
      id: "session-1",
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: 45,
      status: "cancelled",
      meetingUrl: "https://meet.jit.si/wepac-new",
    });

    await updateSession("session-1", {
      status: "cancelled",
      meetingUrl: "https://meet.jit.si/wepac-new",
    });

    expect(persistSessionEvent).toHaveBeenCalledWith(expect.any(Object), {
      sessionId: "session-1",
      actorId: "organizer-1",
      type: "session_cancelled",
      dedupeScope: "transition-scope",
    });
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledOnce();
  });

  it("rejects runtime fields outside the update allowlist before writing", async () => {
    sessionFindUnique.mockResolvedValueOnce({
      cycleId: null,
      mentorshipId: null,
      organizerId: "organizer-1",
    });

    await expect(
      updateSession("session-1", {
        meetingUrl: "https://meet.example/safe",
        transcript: "private transcript",
        transcriptUploadedById: "attacker-1",
        mentorId: "attacker-1",
      } as never),
    ).rejects.toThrow("Invalid Session fields.");

    expect(sessionUpdate).not.toHaveBeenCalled();
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://meet.example/safe-looking",
    "https://user:password@meet.example/safe-looking",
  ])("rejects an unsafe meetingUrl before writing: %s", async (meetingUrl) => {
    sessionFindUnique.mockResolvedValueOnce({
      cycleId: null,
      mentorshipId: null,
      organizerId: "organizer-1",
    });

    await expect(updateSession("session-1", { meetingUrl })).rejects.toThrow(
      "Invalid Session link",
    );
    expect(sessionUpdate).not.toHaveBeenCalled();
  });
});
