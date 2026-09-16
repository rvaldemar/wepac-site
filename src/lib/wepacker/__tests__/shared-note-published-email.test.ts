import { beforeEach, describe, expect, it, vi } from "vitest";

// Attendee-visible Session follow-up is one generic event. A first publish,
// an edit while published, an outcome change, and a visibility transition
// each advance a locked revision. Organizer-private fields never notify.

const sessionFindUnique = vi.fn();
const attendeeUpdate = vi.fn();
const txQueryRaw = vi.fn();
const persistSessionFollowupUpdatedEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const prismaTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      $queryRaw: (...args: unknown[]) => txQueryRaw(...args),
      sessionAttendee: {
        update: (...args: unknown[]) => attendeeUpdate(...args),
      },
    }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
    sessionAttendee: {
      update: (...args: unknown[]) => attendeeUpdate(...args),
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
  persistSessionFollowupUpdatedEvent: (...args: unknown[]) =>
    persistSessionFollowupUpdatedEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
  persistSessionEvent: vi.fn(),
  sessionTransitionDedupeScope: vi.fn(() => "transition-scope"),
}));

import { updateSessionAttendee } from "@/lib/wepacker/actions/session";

const emptyBefore = {
  sharedNote: null,
  sharedNotePublished: false,
  outcome: null,
  followupRevision: 0,
};

describe("updateSessionAttendee — generic Session follow-up notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindUnique.mockResolvedValue({
      cycleId: null,
      mentorshipId: null,
      organizerId: "organizer-1",
    });
    persistSessionFollowupUpdatedEvent.mockResolvedValue([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
  });

  it("notifies on the first shared-note publication and advances revision", async () => {
    txQueryRaw.mockResolvedValueOnce([emptyBefore]);
    attendeeUpdate.mockResolvedValueOnce({
      id: "attendee-1",
      sharedNote: "Boa evolução esta semana.",
      sharedNotePublished: true,
      outcome: null,
      followupRevision: 1,
    });

    await updateSessionAttendee("session-1", "member-1", {
      sharedNote: "Boa evolução esta semana.",
      sharedNotePublished: true,
    });

    expect(attendeeUpdate).toHaveBeenCalledWith({
      where: {
        sessionId_userId: { sessionId: "session-1", userId: "member-1" },
      },
      data: {
        sharedNote: "Boa evolução esta semana.",
        sharedNotePublished: true,
        followupRevision: { increment: 1 },
      },
    });
    expect(persistSessionFollowupUpdatedEvent).toHaveBeenCalledWith(
      expect.any(Object),
      {
        sessionId: "session-1",
        recipientId: "member-1",
        actorId: "organizer-1",
        transitionScope: "0->1",
      },
    );
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
  });

  it("notifies when a currently-published shared note is edited", async () => {
    txQueryRaw.mockResolvedValueOnce([
      {
        sharedNote: "Antes",
        sharedNotePublished: true,
        outcome: null,
        followupRevision: 4,
      },
    ]);
    attendeeUpdate.mockResolvedValueOnce({
      id: "attendee-1",
      sharedNote: "Depois",
      sharedNotePublished: true,
      outcome: null,
      followupRevision: 5,
    });

    await updateSessionAttendee("session-1", "member-1", {
      sharedNote: "Depois",
    });

    expect(persistSessionFollowupUpdatedEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ transitionScope: "4->5" }),
    );
  });

  it("notifies for an outcome-only change without requiring a published note", async () => {
    txQueryRaw.mockResolvedValueOnce([
      { ...emptyBefore, outcome: "Anterior", followupRevision: 1 },
    ]);
    attendeeUpdate.mockResolvedValueOnce({
      id: "attendee-1",
      ...emptyBefore,
      outcome: "Novo acordo",
      followupRevision: 2,
    });

    await updateSessionAttendee("session-1", "member-1", {
      outcome: "Novo acordo",
    });

    expect(persistSessionFollowupUpdatedEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ transitionScope: "1->2" }),
    );
  });

  it("does not lock or notify for organizer-private or attendance fields", async () => {
    attendeeUpdate.mockResolvedValueOnce({
      id: "attendee-1",
      attended: true,
      privateNote: "Only the organizer sees this",
    });

    await updateSessionAttendee("session-1", "member-1", {
      attended: true,
      privateNote: "Only the organizer sees this",
    });

    expect(txQueryRaw).not.toHaveBeenCalled();
    expect(persistSessionFollowupUpdatedEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([]);
  });

  it("does not notify a no-op re-save of the same published note", async () => {
    txQueryRaw.mockResolvedValueOnce([
      {
        sharedNote: "Sem alteração",
        sharedNotePublished: true,
        outcome: null,
        followupRevision: 3,
      },
    ]);
    attendeeUpdate.mockResolvedValueOnce({
      id: "attendee-1",
      sharedNote: "Sem alteração",
      sharedNotePublished: true,
      outcome: null,
      followupRevision: 3,
    });

    await updateSessionAttendee("session-1", "member-1", {
      sharedNote: "Sem alteração",
      sharedNotePublished: true,
    });

    expect(persistSessionFollowupUpdatedEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([]);
  });

  it("rejects publishing an empty shared note", async () => {
    txQueryRaw.mockResolvedValueOnce([emptyBefore]);

    await expect(
      updateSessionAttendee("session-1", "member-1", {
        sharedNote: "   ",
        sharedNotePublished: true,
      }),
    ).rejects.toThrow("A published shared note cannot be empty.");

    expect(attendeeUpdate).not.toHaveBeenCalled();
    expect(persistSessionFollowupUpdatedEvent).not.toHaveBeenCalled();
  });

  it("rejects unchecked relation fields instead of passing caller data to Prisma", async () => {
    await expect(
      updateSessionAttendee("session-1", "member-1", {
        attended: true,
        userId: "another-person",
      } as unknown as { attended?: boolean }),
    ).rejects.toThrow("Invalid attendee update fields");

    expect(attendeeUpdate).not.toHaveBeenCalled();
  });

  it("rejects oversized attendee notes", async () => {
    await expect(
      updateSessionAttendee("session-1", "member-1", {
        privateNote: "x".repeat(30_001),
      }),
    ).rejects.toThrow("Invalid attendee update");

    expect(attendeeUpdate).not.toHaveBeenCalled();
  });
});
