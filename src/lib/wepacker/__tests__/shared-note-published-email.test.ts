import { describe, it, expect, vi, beforeEach } from "vitest";

// Story T1/M: publishing a shared session note (sharedNotePublished
// false -> true) should email the member once. Re-saving an
// already-published note, or an update that never touches
// sharedNotePublished at all, must never re-send.

const sessionFindUnique = vi.fn();
const attendeeFindUnique = vi.fn();
const attendeeUpdate = vi.fn();
const userFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
    sessionAttendee: {
      findUnique: (...args: unknown[]) => attendeeFindUnique(...args),
      update: (...args: unknown[]) => attendeeUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
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

const sendSharedNotePublishedEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: vi.fn(async (..._args: unknown[]) => undefined),
  sendSessionCancelEmail: vi.fn(async (..._args: unknown[]) => undefined),
  sendSharedNotePublishedEmail: (...args: unknown[]) =>
    sendSharedNotePublishedEmail(...args),
}));

vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: vi.fn(),
  buildSessionCancelIcs: vi.fn(),
  nextIcsSequence: vi.fn(() => 1),
}));

import { updateSessionAttendee } from "@/lib/wepacker/actions/session";

describe("updateSessionAttendee — shared note published email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindUnique.mockResolvedValue({ cohortId: null, mentorId: "mentor-1" });
    userFindUnique.mockResolvedValue({ name: "Member One", email: "member1@wepac.pt" });
  });

  it("sends the email when sharedNotePublished flips false -> true", async () => {
    attendeeFindUnique.mockResolvedValueOnce({ sharedNotePublished: false });
    attendeeUpdate.mockResolvedValueOnce({ id: "attendee-1", sharedNotePublished: true });

    await updateSessionAttendee("session-1", "member-1", {
      sharedNote: "Boa evolução esta semana.",
      sharedNotePublished: true,
    });

    await vi.waitFor(() => {
      expect(sendSharedNotePublishedEmail).toHaveBeenCalledTimes(1);
    });
    expect(sendSharedNotePublishedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "member1@wepac.pt", recipientName: "Member One" })
    );
  });

  it("does not re-send when the note was already published", async () => {
    attendeeFindUnique.mockResolvedValueOnce({ sharedNotePublished: true });
    attendeeUpdate.mockResolvedValueOnce({ id: "attendee-1", sharedNotePublished: true });

    await updateSessionAttendee("session-1", "member-1", {
      sharedNote: "Texto editado.",
      sharedNotePublished: true,
    });

    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSharedNotePublishedEmail).not.toHaveBeenCalled();
  });

  it("does not query a before-snapshot or send when sharedNotePublished is untouched", async () => {
    attendeeUpdate.mockResolvedValueOnce({ id: "attendee-1", attended: true });

    await updateSessionAttendee("session-1", "member-1", { attended: true });

    expect(attendeeFindUnique).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSharedNotePublishedEmail).not.toHaveBeenCalled();
  });
});
