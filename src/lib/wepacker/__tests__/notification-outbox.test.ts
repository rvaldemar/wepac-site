import { beforeEach, describe, expect, it, vi } from "vitest";

const txNotificationUpsert = vi.fn();
const txEmailOutboxUpsert = vi.fn();
const txEmailOutboxUpdateMany = vi.fn();
const txSessionUpdate = vi.fn();
const emailOutboxUpdateMany = vi.fn();
const emailOutboxFindUnique = vi.fn();
const packMembershipFindUnique = vi.fn();
const connectionFindUnique = vi.fn();
const mentorshipFindUnique = vi.fn();
const sessionFindUnique = vi.fn();
const attendeeFindUnique = vi.fn();
const participantFindMany = vi.fn();
const messageFindUnique = vi.fn();
const sendPackInvitationEmail = vi.fn();
const sendPackAcceptedEmail = vi.fn();
const sendConnectionRequestEmail = vi.fn();
const sendConnectionAcceptedEmail = vi.fn();
const sendMentorshipInvitationEmail = vi.fn();
const sendMentorshipAcceptedEmail = vi.fn();
const sendSessionInviteEmail = vi.fn();
const sendSessionCancelEmail = vi.fn();
const sendSessionFollowupUpdatedEmail = vi.fn();
const sendNewMessageEmail = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    emailOutbox: {
      updateMany: (...args: unknown[]) => emailOutboxUpdateMany(...args),
      findUnique: (...args: unknown[]) => emailOutboxFindUnique(...args),
      findMany: vi.fn(),
    },
    packMembership: {
      findUnique: (...args: unknown[]) => packMembershipFindUnique(...args),
    },
    personConnection: {
      findUnique: (...args: unknown[]) => connectionFindUnique(...args),
    },
    mentorship: {
      findUnique: (...args: unknown[]) => mentorshipFindUnique(...args),
    },
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
    sessionAttendee: {
      findUnique: (...args: unknown[]) => attendeeFindUnique(...args),
    },
    conversationParticipant: {
      findMany: (...args: unknown[]) => participantFindMany(...args),
    },
    message: {
      findUnique: (...args: unknown[]) => messageFindUnique(...args),
    },
  },
}));
vi.mock("@/lib/email", () => ({
  sendPackInvitationEmail: (...args: unknown[]) =>
    sendPackInvitationEmail(...args),
  sendPackAcceptedEmail: (...args: unknown[]) => sendPackAcceptedEmail(...args),
  sendConnectionRequestEmail: (...args: unknown[]) =>
    sendConnectionRequestEmail(...args),
  sendConnectionAcceptedEmail: (...args: unknown[]) =>
    sendConnectionAcceptedEmail(...args),
  sendMentorshipInvitationEmail: (...args: unknown[]) =>
    sendMentorshipInvitationEmail(...args),
  sendMentorshipAcceptedEmail: (...args: unknown[]) =>
    sendMentorshipAcceptedEmail(...args),
  sendSessionInviteEmail: (...args: unknown[]) => sendSessionInviteEmail(...args),
  sendSessionCancelEmail: (...args: unknown[]) => sendSessionCancelEmail(...args),
  sendSessionFollowupUpdatedEmail: (...args: unknown[]) =>
    sendSessionFollowupUpdatedEmail(...args),
  sendNewMessageEmail: (...args: unknown[]) => sendNewMessageEmail(...args),
}));

import {
  dispatchEmailOutboxById,
  persistConnectionNotificationEvent,
  persistMentorshipEvent,
  persistNewMessageEvent,
  persistPackNotificationEvent,
  persistSessionEvent,
  persistSessionFollowupUpdatedEvent,
} from "@/lib/wepacker/notifications";

const tx = {
  notification: { upsert: txNotificationUpsert },
  emailOutbox: {
    upsert: txEmailOutboxUpsert,
    updateMany: txEmailOutboxUpdateMany,
  },
  session: { update: txSessionUpdate },
};

const baseDispatchRow = {
  id: "outbox-1",
  notificationId: "notification-1",
  recipientId: "recipient-1",
  recipient: {
    id: "recipient-1",
    name: "Recipient One",
    email: "recipient@example.test",
  },
  notification: {
    id: "notification-1",
    recipientId: "recipient-1",
    resourceId: "resource-1",
    resourceVersion: null as number | null,
    type: "pack_invited",
    actor: { id: "actor-1", name: "Actor One" },
    createdAt: new Date("2026-07-22T12:00:00.000Z"),
  },
};

function mockClaimedRow(row = baseDispatchRow) {
  emailOutboxUpdateMany.mockResolvedValueOnce({ count: 1 });
  emailOutboxFindUnique.mockImplementationOnce(async () => {
    const claim = emailOutboxUpdateMany.mock.calls.at(-1)?.[0];
    return {
      ...row,
      status: "processing",
      lockedAt: claim.data.lockedAt,
    };
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  txNotificationUpsert.mockResolvedValue({ id: "notification-1" });
  txEmailOutboxUpsert.mockResolvedValue({ id: "outbox-1" });
  txEmailOutboxUpdateMany.mockResolvedValue({ count: 0 });
  emailOutboxUpdateMany.mockResolvedValue({ count: 1 });
  sendPackInvitationEmail.mockResolvedValue(undefined);
  sendPackAcceptedEmail.mockResolvedValue(undefined);
  sendConnectionRequestEmail.mockResolvedValue(undefined);
  sendConnectionAcceptedEmail.mockResolvedValue(undefined);
  sendMentorshipInvitationEmail.mockResolvedValue(undefined);
  sendMentorshipAcceptedEmail.mockResolvedValue(undefined);
  sendSessionInviteEmail.mockResolvedValue(undefined);
  sendSessionCancelEmail.mockResolvedValue(undefined);
  sendSessionFollowupUpdatedEmail.mockResolvedValue(undefined);
  sendNewMessageEmail.mockResolvedValue(undefined);
});

describe("Notification event persistence", () => {
  it("writes content-free Pack and Connection events plus durable email intents", async () => {
    await persistPackNotificationEvent(tx as never, {
      packMembershipId: "pack-membership-1",
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "pack_invited",
      dedupeScope: "private-transition-token",
    });
    await persistConnectionNotificationEvent(tx as never, {
      connectionId: "connection-1",
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "connection_requested",
      dedupeScope: "another-private-token",
    });

    expect(txNotificationUpsert).toHaveBeenNthCalledWith(1, {
      where: { dedupeKey: expect.any(String) },
      create: {
        recipientId: "recipient-1",
        actorId: "actor-1",
        type: "pack_invited",
        resourceId: "pack-membership-1",
        resourceVersion: null,
        href: "/wepacker/communities",
        dedupeKey: expect.any(String),
      },
      update: {},
      select: { id: true },
    });
    expect(txEmailOutboxUpsert).toHaveBeenCalledWith({
      where: { dedupeKey: expect.any(String) },
      create: {
        notificationId: "notification-1",
        recipientId: "recipient-1",
        dedupeKey: expect.any(String),
      },
      update: {},
      select: { id: true },
    });
    const persisted = JSON.stringify([
      txNotificationUpsert.mock.calls,
      txEmailOutboxUpsert.mock.calls,
    ]);
    expect(persisted).not.toContain("private-transition-token");
    expect(persisted).not.toMatch(/emailAddress|recipientName|actorName|payload/);
  });

  it("stages Mentorship, Session follow-up and Message events without content", async () => {
    await persistMentorshipEvent(tx as never, {
      mentorshipId: "mentorship-1",
      recipientId: "recipient-1",
      actorId: "actor-1",
      type: "mentorship_invited",
    });
    await persistSessionFollowupUpdatedEvent(tx as never, {
      sessionId: "session-1",
      recipientId: "recipient-1",
      actorId: "actor-1",
      transitionScope: "0->1",
    });
    await persistNewMessageEvent(tx as never, {
      conversationId: "conversation-1",
      messageId: "message-1",
      recipientId: "recipient-1",
      actorId: "actor-1",
    });

    expect(txNotificationUpsert.mock.calls.map(([call]) => call.create.type)).toEqual([
      "mentorship_invited",
      "session_followup_updated",
      "new_message",
    ]);
    const persisted = JSON.stringify([
      txNotificationUpsert.mock.calls,
      txEmailOutboxUpsert.mock.calls,
    ]);
    expect(persisted).toContain("message-1");
    expect(persisted).not.toMatch(/body|payload|recipientName|actorName|emailAddress/);
  });

  it("stages one Session event per explicit Person and supersedes older unsent calendar intents", async () => {
    txSessionUpdate.mockResolvedValueOnce({
      organizerId: "organizer-1",
      calendarRevision: 7,
      attendees: [{ userId: "member-1" }, { userId: "member-2" }],
    });

    const events = await persistSessionEvent(tx as never, {
      sessionId: "session-1",
      actorId: "organizer-1",
      type: "session_updated",
      dedupeScope: "private-transition",
    });

    expect(events).toHaveLength(3);
    expect(txSessionUpdate).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: { calendarRevision: { increment: 1 } },
      select: {
        organizerId: true,
        calendarRevision: true,
        attendees: { select: { userId: true } },
      },
    });
    expect(
      txNotificationUpsert.mock.calls.map(([call]) => call.create.resourceVersion),
    ).toEqual([7, 7, 7]);
    expect(txEmailOutboxUpdateMany).toHaveBeenCalledTimes(3);
    expect(txEmailOutboxUpdateMany).toHaveBeenCalledWith({
      where: {
        recipientId: "member-1",
        dedupeKey: { not: expect.any(String) },
        status: { in: ["pending", "processing", "failed"] },
        notification: {
          is: {
            resourceId: "session-1",
            type: {
              in: [
                "session_scheduled",
                "session_updated",
                "session_cancelled",
              ],
            },
          },
        },
      },
      data: {
        status: "superseded",
        lockedAt: null,
        lastErrorKind: null,
        lastSmtpCode: null,
      },
    });
    expect(JSON.stringify(txNotificationUpsert.mock.calls)).not.toContain(
      "private-transition",
    );
  });

  it("orders calendar transitions by persisted revision when wall-clock time ties", async () => {
    txSessionUpdate
      .mockResolvedValueOnce({
        organizerId: "organizer-1",
        calendarRevision: 1,
        attendees: [],
      })
      .mockResolvedValueOnce({
        organizerId: "organizer-1",
        calendarRevision: 2,
        attendees: [],
      });

    await persistSessionEvent(tx as never, {
      sessionId: "session-1",
      actorId: "organizer-1",
      type: "session_updated",
      dedupeScope: "transition-a",
    });
    await persistSessionEvent(tx as never, {
      sessionId: "session-1",
      actorId: "organizer-1",
      type: "session_cancelled",
      dedupeScope: "transition-b",
    });

    expect(
      txNotificationUpsert.mock.calls.map(([call]) => call.create.resourceVersion),
    ).toEqual([1, 2]);
  });
});

describe("Notification email authorization", () => {
  it("re-reads an invited Pack Membership before emailing its recipient", async () => {
    mockClaimedRow();
    packMembershipFindUnique.mockResolvedValueOnce({
      userId: "recipient-1",
      invitedById: "actor-1",
      status: "invited",
      pack: { personalOwnerId: "actor-1" },
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(packMembershipFindUnique).toHaveBeenCalledWith({
      where: { id: "resource-1" },
      select: {
        userId: true,
        invitedById: true,
        status: true,
        pack: { select: { personalOwnerId: true } },
      },
    });
    expect(sendPackInvitationEmail).toHaveBeenCalledWith({
      to: "recipient@example.test",
      recipientName: "Recipient One",
      ownerName: "Actor One",
    });
  });

  it.each(["active", "declined"] as const)(
    "supersedes a Pack invitation email after status becomes %s",
    async (status) => {
      mockClaimedRow();
      packMembershipFindUnique.mockResolvedValueOnce({
        userId: "recipient-1",
        invitedById: "actor-1",
        status,
        pack: { personalOwnerId: "actor-1" },
      });

      await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe(
        "skipped",
      );
      expect(sendPackInvitationEmail).not.toHaveBeenCalled();
      const claimTime = emailOutboxUpdateMany.mock.calls[0][0].data.lockedAt;
      expect(emailOutboxUpdateMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: "outbox-1",
          status: "processing",
          lockedAt: claimTime,
        },
        data: {
          status: "superseded",
          lockedAt: null,
          lastErrorKind: null,
          lastSmtpCode: null,
        },
      });
    },
  );

  it("re-reads both Connection endpoints before emailing a request", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "connection_requested",
      },
    });
    connectionFindUnique.mockResolvedValueOnce({
      firstUserId: "actor-1",
      secondUserId: "recipient-1",
      requestedById: "actor-1",
      status: "pending",
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(sendConnectionRequestEmail).toHaveBeenCalledWith({
      to: "recipient@example.test",
      recipientName: "Recipient One",
      requesterName: "Actor One",
    });
  });

  it("emails acceptance only to the original requester after active consent", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "connection_accepted",
      },
    });
    connectionFindUnique.mockResolvedValueOnce({
      firstUserId: "recipient-1",
      secondUserId: "actor-1",
      requestedById: "recipient-1",
      status: "active",
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(sendConnectionAcceptedEmail).toHaveBeenCalledWith({
      to: "recipient@example.test",
      recipientName: "Recipient One",
      personName: "Actor One",
    });
  });

  it("re-authorizes a pending directed Mentorship invitation before rendering", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "mentorship_invited",
      },
    });
    mentorshipFindUnique.mockResolvedValueOnce({
      mentorId: "actor-1",
      menteeId: "recipient-1",
      invitedById: "actor-1",
      status: "pending",
      mentorAcceptedAt: new Date(),
      menteeAcceptedAt: null,
      activatedAt: null,
      endedAt: null,
      mentor: { name: "Actor One" },
      mentee: { name: "Recipient One" },
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(sendMentorshipInvitationEmail).toHaveBeenCalledWith({
      to: "recipient@example.test",
      recipientName: "Recipient One",
      mentorName: "Actor One",
    });
  });

  it("supersedes a Mentorship acceptance intent when its actor is not the Mentee", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "mentorship_accepted",
      },
    });
    mentorshipFindUnique.mockResolvedValueOnce({
      mentorId: "recipient-1",
      menteeId: "different-person",
      invitedById: "recipient-1",
      status: "active",
      mentorAcceptedAt: new Date(),
      menteeAcceptedAt: new Date(),
      activatedAt: new Date(),
      endedAt: null,
      mentor: { name: "Recipient One" },
      mentee: { name: "Different Person" },
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");
    expect(sendMentorshipAcceptedEmail).not.toHaveBeenCalled();
  });

  it("re-authorizes an explicit Session attendee and reconstructs a private calendar invite", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "session_updated",
        resourceVersion: 7,
      },
    });
    sessionFindUnique.mockResolvedValueOnce({
      id: "resource-1",
      organizerId: "actor-1",
      status: "scheduled",
      kind: "checkpoint",
      scheduledAt: new Date("2026-08-10T14:30:00.000Z"),
      durationMinutes: 45,
      meetingUrl: "https://meet.example.test/session",
      calendarRevision: 7,
      attendees: [{ userId: "recipient-1" }],
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(sendSessionInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@example.test",
        recipientName: "Recipient One",
        kindLabel: "Checkpoint",
        meetingUrl: "https://meet.example.test/session",
        ics: expect.stringContaining("METHOD:REQUEST"),
      }),
    );
    expect(sendSessionInviteEmail.mock.calls[0][0].ics).not.toContain(
      "actor@example.test",
    );
  });

  it("supersedes Session delivery after the Person is no longer an attendee", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "session_updated",
        resourceVersion: 7,
      },
    });
    sessionFindUnique.mockResolvedValueOnce({
      id: "resource-1",
      organizerId: "actor-1",
      status: "scheduled",
      kind: "checkpoint",
      scheduledAt: new Date(),
      durationMinutes: 60,
      meetingUrl: null,
      calendarRevision: 7,
      attendees: [],
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");
    expect(sendSessionInviteEmail).not.toHaveBeenCalled();
  });

  it("supersedes a stale calendar revision before SMTP rendering", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "session_updated",
        resourceVersion: 6,
      },
    });
    sessionFindUnique.mockResolvedValueOnce({
      id: "resource-1",
      organizerId: "actor-1",
      status: "scheduled",
      kind: "checkpoint",
      scheduledAt: new Date(),
      durationMinutes: 60,
      meetingUrl: null,
      calendarRevision: 7,
      attendees: [{ userId: "recipient-1" }],
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");
    expect(sendSessionInviteEmail).not.toHaveBeenCalled();
  });

  it("re-authorizes the latest generic Session follow-up against the exact organizer", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "session_followup_updated",
        resourceVersion: 2,
      },
    });
    attendeeFindUnique.mockResolvedValueOnce({
      followupRevision: 2,
      session: { organizerId: "actor-1" },
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(sendSessionFollowupUpdatedEmail).toHaveBeenCalledWith({
      to: "recipient@example.test",
      recipientName: "Recipient One",
    });
  });

  it("supersedes a stale Session follow-up revision before rendering email", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "session_followup_updated",
        resourceVersion: 1,
      },
    });
    attendeeFindUnique.mockResolvedValueOnce({
      followupRevision: 2,
      session: { organizerId: "actor-1" },
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");
    expect(sendSessionFollowupUpdatedEmail).not.toHaveBeenCalled();
  });

  it("re-authorizes both explicit Conversation participants before Message email", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "new_message",
      },
    });
    messageFindUnique.mockResolvedValueOnce({
      userId: "actor-1",
      conversationId: "conversation-1",
    });
    participantFindMany.mockResolvedValueOnce([
      { userId: "actor-1" },
      { userId: "recipient-1" },
    ]);

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");
    expect(sendNewMessageEmail).toHaveBeenCalledWith({
      to: "recipient@example.test",
      recipientName: "Recipient One",
      senderName: "Actor One",
    });
  });

  it("supersedes a forged Message intent whose stored author is not the actor", async () => {
    mockClaimedRow({
      ...baseDispatchRow,
      notification: {
        ...baseDispatchRow.notification,
        type: "new_message",
      },
    });
    messageFindUnique.mockResolvedValueOnce({
      userId: "different-author",
      conversationId: "conversation-1",
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");
    expect(participantFindMany).not.toHaveBeenCalled();
    expect(sendNewMessageEmail).not.toHaveBeenCalled();
  });

  it("does not mark a claimed email sent after a newer transition supersedes it", async () => {
    mockClaimedRow();
    packMembershipFindUnique.mockResolvedValueOnce({
      userId: "recipient-1",
      invitedById: "actor-1",
      status: "invited",
      pack: { personalOwnerId: "actor-1" },
    });
    emailOutboxUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");
    expect(sendPackInvitationEmail).toHaveBeenCalledOnce();
    expect(emailOutboxUpdateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "outbox-1",
          status: "processing",
          lockedAt: expect.any(Date),
        }),
        data: expect.objectContaining({ status: "sent" }),
      }),
    );
  });

  it("does not overwrite a newer terminal state while recovering an authorization rejection", async () => {
    mockClaimedRow();
    packMembershipFindUnique.mockResolvedValueOnce({
      userId: "recipient-1",
      invitedById: "actor-1",
      status: "active",
      pack: { personalOwnerId: "actor-1" },
    });
    emailOutboxUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");

    const claimTime = emailOutboxUpdateMany.mock.calls[0][0].data.lockedAt;
    expect(emailOutboxUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: "outbox-1",
        status: "processing",
        lockedAt: claimTime,
      },
      data: expect.objectContaining({ status: "superseded" }),
    });
  });

  it("does not overwrite superseded or sent state during generic failure recovery", async () => {
    mockClaimedRow();
    packMembershipFindUnique.mockResolvedValueOnce({
      userId: "recipient-1",
      invitedById: "actor-1",
      status: "invited",
      pack: { personalOwnerId: "actor-1" },
    });
    sendPackInvitationEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    emailOutboxFindUnique.mockResolvedValueOnce({
      attempts: 1,
      notificationId: "notification-1",
      status: "superseded",
      lockedAt: null,
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");

    expect(
      emailOutboxUpdateMany.mock.calls.some(
        ([call]) => call.data?.status === "failed",
      ),
    ).toBe(false);
  });

  it("uses the claim CAS if a newer transition wins after the failure read", async () => {
    mockClaimedRow();
    packMembershipFindUnique.mockResolvedValueOnce({
      userId: "recipient-1",
      invitedById: "actor-1",
      status: "invited",
      pack: { personalOwnerId: "actor-1" },
    });
    sendPackInvitationEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    emailOutboxFindUnique.mockImplementationOnce(async () => {
      const claimTime = emailOutboxUpdateMany.mock.calls[0][0].data.lockedAt;
      return {
        attempts: 1,
        notificationId: "notification-1",
        status: "processing",
        lockedAt: claimTime,
      };
    });
    emailOutboxUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("skipped");

    const claimTime = emailOutboxUpdateMany.mock.calls[0][0].data.lockedAt;
    expect(emailOutboxUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: "outbox-1",
        status: "processing",
        lockedAt: claimTime,
      },
      data: expect.objectContaining({ status: "failed" }),
    });
  });

  it("marks a still-owned claim failed for bounded retry", async () => {
    mockClaimedRow();
    packMembershipFindUnique.mockResolvedValueOnce({
      userId: "recipient-1",
      invitedById: "actor-1",
      status: "invited",
      pack: { personalOwnerId: "actor-1" },
    });
    sendPackInvitationEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    emailOutboxFindUnique.mockImplementationOnce(async () => {
      const claimTime = emailOutboxUpdateMany.mock.calls[0][0].data.lockedAt;
      return {
        attempts: 1,
        notificationId: "notification-1",
        status: "processing",
        lockedAt: claimTime,
      };
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("failed");

    expect(emailOutboxUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: "outbox-1",
          status: "processing",
          lockedAt: expect.any(Date),
        }),
        data: expect.objectContaining({
          status: "failed",
          lockedAt: null,
          lastErrorKind: "Error",
        }),
      }),
    );
  });
});
