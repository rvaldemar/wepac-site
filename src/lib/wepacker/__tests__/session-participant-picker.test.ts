import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const userFindMany = vi.fn();
const userFindUnique = vi.fn();
const mentorshipFindMany = vi.fn();
const mentorshipFindFirst = vi.fn();
const cycleFindFirst = vi.fn();
const cycleFacilitatorFindFirst = vi.fn();
const cycleFacilitatorFindMany = vi.fn();
const sessionCreate = vi.fn();
const sessionFindFirst = vi.fn();
const sessionFindUnique = vi.fn();
const requireUser = vi.fn();
const resolveSessionAttendeeAuthorization = vi.fn();
const txQueryRaw = vi.fn();
const persistSessionEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const prismaTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      user: {
        findMany: (...args: unknown[]) => userFindMany(...args),
      },
      session: {
        create: (...args: unknown[]) => sessionCreate(...args),
      },
      $queryRaw: (...args: unknown[]) => txQueryRaw(...args),
    }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => userFindMany(...args),
      findUnique: (...args: unknown[]) => userFindUnique(...args),
    },
    mentorship: {
      findMany: (...args: unknown[]) => mentorshipFindMany(...args),
      findFirst: (...args: unknown[]) => mentorshipFindFirst(...args),
    },
    cycle: { findFirst: (...args: unknown[]) => cycleFindFirst(...args) },
    cycleFacilitator: {
      findFirst: (...args: unknown[]) => cycleFacilitatorFindFirst(...args),
      findMany: (...args: unknown[]) => cycleFacilitatorFindMany(...args),
    },
    session: {
      create: (...args: unknown[]) => sessionCreate(...args),
      findFirst: (...args: unknown[]) => sessionFindFirst(...args),
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      prismaTransaction(callback),
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  resolveSessionAttendeeAuthorization: (...args: unknown[]) =>
    resolveSessionAttendeeAuthorization(...args),
}));

vi.mock("@/lib/wepacker/notifications", () => ({
  persistSessionEvent: (...args: unknown[]) => persistSessionEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
  sessionTransitionDedupeScope: vi.fn(() => "transition-scope"),
}));

import {
  canAccessMentorWorkspace,
  createSession,
  createSessionFromResolvedActors,
  getCycleSessionAttendeeCandidate,
  getFacilitatedCycles,
  getMentoredMembers,
} from "@/lib/wepacker/actions/session";

const unauthorized = {
  authorized: false,
  source: null,
  mentorshipId: null,
} as const;
const directMentorship = {
  authorized: true,
  source: "mentorship",
  mentorshipId: "mentorship-1",
} as const;

function createdSession(attendeeIds: string[]) {
  return {
    id: "session-1",
    attendees: attendeeIds.map((userId) => ({ userId })),
  };
}

describe("Session participant discovery and scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mentorshipFindMany.mockResolvedValue([]);
    mentorshipFindFirst.mockResolvedValue(null);
    userFindMany.mockResolvedValue([]);
    resolveSessionAttendeeAuthorization.mockResolvedValue(unauthorized);
    sessionFindFirst.mockResolvedValue(null);
    sessionFindUnique.mockResolvedValue(null);
    cycleFindFirst.mockResolvedValue(null);
    cycleFacilitatorFindFirst.mockResolvedValue(null);
    cycleFacilitatorFindMany.mockResolvedValue([]);
    txQueryRaw.mockResolvedValue([]);
    persistSessionEvent.mockResolvedValue([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rejects direct calls to the webhook-only writer", async () => {
    vi.stubEnv("CALCOM_WEBHOOK_SECRET", "expected-test-secret");
    await expect(
      createSessionFromResolvedActors({
        webhookSecret: "wrong-test-secret",
        organizerId: "organizer-1",
        scheduledAt: new Date("2026-07-22T10:00:00.000Z"),
        attendeeUserIds: ["person-1"],
        calcomBookingUid: "booking-1",
      }),
    ).rejects.toThrow("Unauthorized webhook operation.");
    expect(userFindMany).not.toHaveBeenCalled();
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("does not let Admin enumerate People without a Mentorship edge", async () => {
    requireUser.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    mentorshipFindMany.mockResolvedValueOnce([]);

    await expect(getMentoredMembers()).resolves.toEqual([]);
    expect(userFindMany).not.toHaveBeenCalled();
    expect(mentorshipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mentorId: "admin-1", status: "active" }),
      }),
    );
  });

  it("lets a Mentor discover only fully accepted active Mentees", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "member" });
    mentorshipFindMany.mockResolvedValueOnce([
      {
        mentee: { id: "person-1", name: "Alex", email: "alex@example.test" },
      },
    ]);

    await expect(getMentoredMembers()).resolves.toEqual([
      { id: "person-1", name: "Alex", email: "alex@example.test" },
    ]);
    expect(mentorshipFindMany).toHaveBeenCalledWith({
      where: {
        mentorId: "mentor-1",
        menteeId: { not: "mentor-1" },
        status: "active",
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: {
        mentee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { activatedAt: "asc" },
    });
  });

  it("creates an individual Session from one explicit accepted Mentorship", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "member" });
    userFindMany.mockResolvedValue([{ id: "person-1" }]);
    resolveSessionAttendeeAuthorization.mockResolvedValueOnce(directMentorship);
    txQueryRaw.mockResolvedValueOnce([
      { id: "mentorship-1", menteeId: "person-1" },
    ]);
    sessionCreate.mockResolvedValueOnce(createdSession(["person-1"]));

    const result = await createSession({
      scheduledAt: "2026-07-22T10:00:00.000Z",
      attendeeUserIds: [" person-1 ", "person-1"],
    });

    expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledWith(
      "mentor-1",
      "person-1",
    );
    const input = sessionCreate.mock.calls[0][0];
    expect(input.data).toEqual(
      expect.objectContaining({
        cycleId: null,
        mentorshipId: "mentorship-1",
        organizerId: "mentor-1",
        kind: "checkpoint",
        attendees: { create: [{ userId: "person-1" }] },
      }),
    );
    expect(result).toMatchObject({ attendeeCount: 1, format: "individual" });
    expect(persistSessionEvent).toHaveBeenCalledWith(expect.any(Object), {
      sessionId: "session-1",
      actorId: "mentor-1",
      type: "session_scheduled",
    });
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledOnce();
  });

  it("rejects self, missing People, and unrelated attendees", async () => {
    requireUser.mockResolvedValue({ id: "mentor-1", role: "member" });

    await expect(
      createSession({
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["mentor-1"],
      }),
    ).rejects.toThrow("Invalid attendees for this Session.");

    await expect(
      createSession({
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["missing"],
      }),
    ).rejects.toThrow("Invalid attendees for this Session.");

    userFindMany.mockResolvedValue([{ id: "unrelated" }]);
    await expect(
      createSession({
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["unrelated"],
      }),
    ).rejects.toThrow("Invalid attendees for this Session.");
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("derives group format and leaves mentorshipId empty", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "member" });
    userFindMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
    resolveSessionAttendeeAuthorization
      .mockResolvedValueOnce(directMentorship)
      .mockResolvedValueOnce({ ...directMentorship, mentorshipId: "m-2" });
    sessionCreate.mockResolvedValueOnce(createdSession(["p1", "p2"]));
    txQueryRaw.mockResolvedValueOnce([
      { id: "mentorship-1", menteeId: "p1" },
      { id: "m-2", menteeId: "p2" },
    ]);

    const result = await createSession({
      scheduledAt: "2026-07-22T10:00:00.000Z",
      attendeeUserIds: ["p1", "p2", "p1"],
    });

    expect(sessionCreate.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        mentorshipId: null,
        attendees: { create: [{ userId: "p1" }, { userId: "p2" }] },
      }),
    );
    expect(result).toMatchObject({ attendeeCount: 2, format: "group" });
  });

  it("authorizes Cycle context through facilitation without inferring or requiring attendance", async () => {
    requireUser.mockResolvedValueOnce({ id: "facilitator-1", role: "member" });
    userFindMany.mockResolvedValue([{ id: "person-1" }]);
    cycleFindFirst.mockResolvedValueOnce({ id: "cycle-1" });
    cycleFacilitatorFindFirst.mockResolvedValueOnce({ id: "facilitation-1" });
    txQueryRaw.mockResolvedValueOnce([
      { cycleId: "cycle-1", facilitatorId: "facilitation-1" },
    ]);
    sessionCreate.mockResolvedValueOnce(createdSession(["person-1"]));

    await createSession({
      cycleId: "cycle-1",
      scheduledAt: "2026-07-22T10:00:00.000Z",
      attendeeUserIds: ["person-1"],
    });

    expect(cycleFindFirst).toHaveBeenCalledWith({
      where: {
        id: "cycle-1",
        status: { in: ["published", "active"] },
      },
      select: { id: true },
    });
    expect(cycleFacilitatorFindFirst).toHaveBeenCalledWith({
      where: {
        cycleId: "cycle-1",
        userId: "facilitator-1",
        status: "active",
        acceptedAt: { not: null },
        endedAt: null,
      },
      select: { id: true },
    });
    expect(sessionCreate.mock.calls[0][0].data).toEqual(
      expect.objectContaining({ cycleId: "cycle-1", mentorshipId: null }),
    );
    expect(resolveSessionAttendeeAuthorization).not.toHaveBeenCalled();
  });

  it("fails inside the write transaction when a pre-authorized Mentorship was revoked", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "member" });
    userFindMany.mockResolvedValue([{ id: "person-1" }]);
    resolveSessionAttendeeAuthorization.mockResolvedValueOnce(directMentorship);
    txQueryRaw.mockResolvedValueOnce([]);

    await expect(
      createSession({
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["person-1"],
      }),
    ).rejects.toThrow("Invalid attendees for this Session.");

    expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledOnce();
    expect(txQueryRaw).toHaveBeenCalledOnce();
    expect(sessionCreate).not.toHaveBeenCalled();
    expect(persistSessionEvent).not.toHaveBeenCalled();
  });

  it("rejects Cycle context without active facilitation", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentor-1", role: "member" });
    userFindMany.mockResolvedValueOnce([{ id: "person-1" }]);
    cycleFindFirst.mockResolvedValueOnce({ id: "cycle-1" });

    await expect(
      createSession({
        cycleId: "cycle-1",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["person-1"],
      }),
    ).rejects.toThrow("Invalid attendees for this Session.");
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("does not let Admin attach Cycle context without a Facilitation edge", async () => {
    requireUser.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    userFindMany.mockResolvedValueOnce([{ id: "person-1" }]);
    cycleFindFirst.mockResolvedValueOnce({ id: "cycle-1" });

    await expect(
      createSession({
        cycleId: "cycle-1",
        scheduledAt: "2026-07-22T10:00:00.000Z",
        attendeeUserIds: ["person-1"],
      }),
    ).rejects.toThrow("Invalid attendees for this Session.");
    expect(cycleFacilitatorFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cycleId: "cycle-1",
          userId: "admin-1",
          status: "active",
        }),
      }),
    );
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("lists only the actor's accepted active Cycle Facilitations", async () => {
    requireUser.mockResolvedValueOnce({ id: "facilitator-1", role: "member" });
    cycleFacilitatorFindMany.mockResolvedValueOnce([
      {
        role: "facilitator",
        cycle: { id: "cycle-1", name: "Arts Cycle", status: "active" },
      },
    ]);

    await expect(getFacilitatedCycles()).resolves.toEqual([
      {
        id: "cycle-1",
        name: "Arts Cycle",
        status: "active",
        role: "facilitator",
      },
    ]);
    expect(cycleFacilitatorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "facilitator-1",
          status: "active",
          acceptedAt: { not: null },
          endedAt: null,
          cycle: { status: { in: ["published", "active"] } },
        },
      }),
    );
  });

  it("discovers the organizer surface from an exact capability edge, not account role", async () => {
    requireUser
      .mockResolvedValueOnce({ id: "person-1", role: "member" })
      .mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    mentorshipFindFirst
      .mockResolvedValueOnce({ id: "mentorship-1" })
      .mockResolvedValueOnce(null);
    cycleFacilitatorFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(canAccessMentorWorkspace()).resolves.toBe(true);
    await expect(canAccessMentorWorkspace()).resolves.toBe(false);

    expect(mentorshipFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        mentorId: "person-1",
        menteeId: { not: "person-1" },
        status: "active",
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: { id: true },
    });
    expect(cycleFacilitatorFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        userId: "admin-1",
        status: "active",
        acceptedAt: { not: null },
        endedAt: null,
        cycle: { status: { in: ["published", "active"] } },
      },
      select: { id: true },
    });
  });

  it("keeps the organizer workspace discoverable through Session ownership", async () => {
    requireUser.mockResolvedValueOnce({ id: "organizer-1", role: "member" });
    sessionFindFirst.mockResolvedValueOnce({ id: "historical-session-1" });

    await expect(canAccessMentorWorkspace()).resolves.toBe(true);
    expect(sessionFindFirst).toHaveBeenCalledWith({
      where: { organizerId: "organizer-1" },
      select: { id: true },
    });
  });

  it("lets an exact active facilitator resolve a known attendee without Enrollment", async () => {
    requireUser.mockResolvedValueOnce({ id: "facilitator-1", role: "member" });
    cycleFindFirst.mockResolvedValueOnce({ id: "cycle-1" });
    cycleFacilitatorFindFirst.mockResolvedValueOnce({ id: "facilitation-1" });
    userFindUnique.mockResolvedValueOnce({
      id: "person-1",
      name: "Alex",
      email: "alex@example.test",
    });

    await expect(
      getCycleSessionAttendeeCandidate(
        "cycle-1",
        " ALEX@EXAMPLE.TEST ",
      ),
    ).resolves.toEqual({
      id: "person-1",
      name: "Alex",
      email: "alex@example.test",
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: "alex@example.test" },
      select: { id: true, name: true, email: true },
    });
  });
});
