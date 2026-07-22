import { beforeEach, describe, expect, it, vi } from "vitest";

const emailOutboxUpdateMany = vi.fn();
const emailOutboxFindUnique = vi.fn();
const emailOutboxUpdate = vi.fn();
const sessionFindUnique = vi.fn();
const sendSessionInviteEmail = vi.fn();
const sendSessionCancelEmail = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    emailOutbox: {
      updateMany: (...args: unknown[]) => emailOutboxUpdateMany(...args),
      findUnique: (...args: unknown[]) => emailOutboxFindUnique(...args),
      update: (...args: unknown[]) => emailOutboxUpdate(...args),
    },
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: (...args: unknown[]) =>
    sendSessionInviteEmail(...args),
  sendSessionCancelEmail: (...args: unknown[]) =>
    sendSessionCancelEmail(...args),
}));

const buildSessionInviteIcs = vi.fn((input: { attendees: { email: string }[] }) =>
  `REQUEST:${input.attendees.map((person) => person.email).join(",")}`,
);
const buildSessionCancelIcs = vi.fn((input: { attendees: { email: string }[] }) =>
  `CANCEL:${input.attendees.map((person) => person.email).join(",")}`,
);
vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: (input: { attendees: { email: string }[] }) =>
    buildSessionInviteIcs(input),
  buildSessionCancelIcs: (input: { attendees: { email: string }[] }) =>
    buildSessionCancelIcs(input),
}));

import { dispatchEmailOutboxById } from "@/lib/wepacker/notifications";

const scheduledAt = new Date("2026-08-10T14:30:00.000Z");

function mockClaimedCalendarIntent(input: {
  type: "session_updated" | "session_cancelled";
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
}) {
  emailOutboxUpdateMany
    .mockResolvedValueOnce({ count: 1 })
    .mockResolvedValueOnce({ count: 1 });
  emailOutboxFindUnique.mockImplementationOnce(async () => {
    const claim = emailOutboxUpdateMany.mock.calls[0][0];
    return {
      id: "outbox-1",
      notificationId: "notification-1",
      recipientId: input.recipientId,
      status: "processing",
      lockedAt: claim.data.lockedAt,
      recipient: {
        id: input.recipientId,
        name: input.recipientName,
        email: input.recipientEmail,
      },
      notification: {
        id: "notification-1",
        recipientId: input.recipientId,
        resourceId: "session-1",
        resourceVersion: 42,
        type: input.type,
        actor: { id: "organizer-1", name: "Ana Organizer" },
        createdAt: scheduledAt,
      },
    };
  });
  sessionFindUnique.mockResolvedValueOnce({
    id: "session-1",
    organizerId: "organizer-1",
    status: input.type === "session_cancelled" ? "cancelled" : "scheduled",
    kind: "checkpoint",
    scheduledAt,
    durationMinutes: 45,
    meetingUrl: "https://meet.rvs.solutions/session-1",
    calendarRevision: 42,
    attendees: [{ userId: input.recipientId }],
  });
}

describe("session calendar email recipient privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailOutboxUpdate.mockResolvedValue({});
    sendSessionInviteEmail.mockResolvedValue(undefined);
    sendSessionCancelEmail.mockResolvedValue(undefined);
  });

  it("builds a REQUEST ICS containing only the current recipient", async () => {
    mockClaimedCalendarIntent({
      type: "session_updated",
      recipientId: "member-1",
      recipientName: "Member One",
      recipientEmail: "member1@example.com",
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");

    expect(buildSessionInviteIcs).toHaveBeenCalledWith(
      expect.objectContaining({
        attendees: [{ name: "Member One", email: "member1@example.com" }],
        sequence: 42,
      }),
    );
    const ics = sendSessionInviteEmail.mock.calls[0][0].ics as string;
    expect(ics).toBe("REQUEST:member1@example.com");
    expect(ics).not.toContain("organizer@wepac.pt");
    expect(ics).not.toContain("member2@example.com");
  });

  it("builds a CANCEL ICS containing only the current recipient", async () => {
    mockClaimedCalendarIntent({
      type: "session_cancelled",
      recipientId: "member-2",
      recipientName: "Member Two",
      recipientEmail: "member2@example.com",
    });

    await expect(dispatchEmailOutboxById("outbox-1")).resolves.toBe("sent");

    expect(buildSessionCancelIcs).toHaveBeenCalledWith(
      expect.objectContaining({
        attendees: [{ name: "Member Two", email: "member2@example.com" }],
        sequence: 42,
      }),
    );
    const ics = sendSessionCancelEmail.mock.calls[0][0].ics as string;
    expect(ics).toBe("CANCEL:member2@example.com");
    expect(ics).not.toContain("organizer@wepac.pt");
    expect(ics).not.toContain("member1@example.com");
  });
});
