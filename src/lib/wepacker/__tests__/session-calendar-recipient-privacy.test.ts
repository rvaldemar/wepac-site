import { beforeEach, describe, expect, it, vi } from "vitest";

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
  getMentoredCohortIds: vi.fn(async () => []),
  requireRole: vi.fn(),
  requireUser: vi.fn(async () => ({ id: "mentor-1", role: "mentor" })),
}));

const sendSessionInviteEmail = vi.fn(async (input: unknown) => {
  void input;
});
const sendSessionCancelEmail = vi.fn(async (input: unknown) => {
  void input;
});
vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: (input: unknown) => sendSessionInviteEmail(input),
  sendSessionCancelEmail: (input: unknown) => sendSessionCancelEmail(input),
  sendSharedNotePublishedEmail: vi.fn(async () => undefined),
}));

const buildSessionInviteIcs = vi.fn((input: { attendees: { email: string }[] }) =>
  `REQUEST:${input.attendees.map((person) => person.email).join(",")}`
);
const buildSessionCancelIcs = vi.fn((input: { attendees: { email: string }[] }) =>
  `CANCEL:${input.attendees.map((person) => person.email).join(",")}`
);
vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: (input: { attendees: { email: string }[] }) =>
    buildSessionInviteIcs(input),
  buildSessionCancelIcs: (input: { attendees: { email: string }[] }) =>
    buildSessionCancelIcs(input),
  nextIcsSequence: vi.fn(() => 42),
}));

import { updateSession } from "@/lib/wepacker/actions/session";

const scheduledAt = new Date("2026-08-10T14:30:00.000Z");
const recipients = [
  { id: "mentor-1", name: "Ana Mentor", email: "mentor@wepac.pt" },
  { id: "member-1", name: "Member One", email: "member1@example.com" },
  { id: "member-2", name: "Member Two", email: "member2@example.com" },
];
const calendarContextRow = {
  kind: "checkpoint",
  scheduledAt,
  durationMinutes: 45,
  meetingUrl: "https://meet.rvs.solutions/session-1",
  mentor: recipients[0],
  attendees: recipients.slice(1).map((user) => ({ user })),
};

function mockCalendarUpdate(status: "scheduled" | "cancelled") {
  sessionFindUnique
    .mockResolvedValueOnce({ cohortId: null, mentorId: "mentor-1" })
    .mockResolvedValueOnce({
      scheduledAt,
      status: "scheduled",
      meetingUrl: "https://meet.rvs.solutions/old-session-link",
    })
    .mockResolvedValueOnce(calendarContextRow);
  sessionUpdate.mockResolvedValueOnce({
    id: "session-1",
    scheduledAt,
    status,
    meetingUrl: calendarContextRow.meetingUrl,
  });
}

describe("session calendar email recipient privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindUnique.mockReset();
    sessionUpdate.mockReset();
  });

  it("builds a REQUEST ICS containing only the recipient's address", async () => {
    mockCalendarUpdate("scheduled");

    await updateSession("session-1", { meetingUrl: calendarContextRow.meetingUrl });

    await vi.waitFor(() => {
      expect(sendSessionInviteEmail).toHaveBeenCalledTimes(recipients.length);
    });
    expect(buildSessionInviteIcs).toHaveBeenCalledTimes(recipients.length);

    for (const recipient of recipients) {
      expect(buildSessionInviteIcs).toHaveBeenCalledWith(
        expect.objectContaining({ attendees: [recipient] })
      );
      expect(sendSessionInviteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipient.email,
          ics: `REQUEST:${recipient.email}`,
        })
      );
    }
  });

  it("builds a CANCEL ICS containing only the recipient's address", async () => {
    mockCalendarUpdate("cancelled");

    await updateSession("session-1", { status: "cancelled" });

    await vi.waitFor(() => {
      expect(sendSessionCancelEmail).toHaveBeenCalledTimes(recipients.length);
    });
    expect(buildSessionCancelIcs).toHaveBeenCalledTimes(recipients.length);

    for (const recipient of recipients) {
      expect(buildSessionCancelIcs).toHaveBeenCalledWith(
        expect.objectContaining({ attendees: [recipient] })
      );
      expect(sendSessionCancelEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: recipient.email,
          ics: `CANCEL:${recipient.email}`,
        })
      );
    }
  });
});
