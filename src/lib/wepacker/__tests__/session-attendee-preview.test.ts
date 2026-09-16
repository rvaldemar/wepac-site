import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const requireUser = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
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

import { getSessionAttendeePreview } from "@/lib/wepacker/actions/session";

const guardRow = {
  cycleId: null,
  mentorshipId: "mentorship-1",
  organizerId: "organizer-1",
};

function previewRow(sharedNotePublished: boolean) {
  return {
    id: "session-1",
    scheduledAt: new Date("2026-08-01T10:00:00Z"),
    durationMinutes: 60,
    kind: "checkpoint",
    status: "scheduled",
    meetingUrl: "https://meet.example/session-1",
    organizer: { id: "organizer-1", name: "Rui" },
    _count: { attendees: 1 },
    attendees: [
      {
        outcome: "agreed outcome",
        sharedNote: "shared only after publish",
        sharedNotePublished,
        user: { id: "alex-1", name: "Alex" },
      },
    ],
  };
}

describe("attendee-safe Session preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: "organizer-1", role: "member" });
  });

  it("returns only the selected attendee's safe projection", async () => {
    sessionFindUnique
      .mockResolvedValueOnce(guardRow)
      .mockResolvedValueOnce(previewRow(false));

    const result = await getSessionAttendeePreview("session-1", "alex-1");
    expect(result).toMatchObject({
      viewer: { id: "organizer-1", name: "Rui" },
      attendee: { id: "alex-1", name: "Alex" },
      session: {
        attendeeCount: 1,
        format: "individual",
        organizerName: "Rui",
        outcome: "agreed outcome",
        sharedNote: null,
      },
    });
    const query = sessionFindUnique.mock.calls[1][0];
    expect(query.select).not.toHaveProperty("transcript");
    expect(query.select).not.toHaveProperty("debrief");
    expect(query.select).not.toHaveProperty("discussionPoints");
    expect(query.select.attendees.where).toEqual({ userId: "alex-1" });
    expect(query.select.attendees.select).not.toHaveProperty("privateNote");
  });

  it("returns an explicitly published shared note", async () => {
    sessionFindUnique
      .mockResolvedValueOnce(guardRow)
      .mockResolvedValueOnce(previewRow(true));
    const result = await getSessionAttendeePreview("session-1", "alex-1");
    expect(result?.session.sharedNote).toBe("shared only after publish");
  });

  it("does not let Admin bypass organizer ownership", async () => {
    requireUser.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    sessionFindUnique.mockResolvedValueOnce(guardRow);
    await expect(
      getSessionAttendeePreview("session-1", "alex-1"),
    ).rejects.toThrow("Permission denied.");
    expect(sessionFindUnique).toHaveBeenCalledOnce();
  });

  it("returns null when the target is not an explicit attendee", async () => {
    sessionFindUnique.mockResolvedValueOnce(guardRow).mockResolvedValueOnce({
      ...previewRow(false),
      attendees: [],
    });
    await expect(
      getSessionAttendeePreview("session-1", "stranger-1"),
    ).resolves.toBeNull();
  });
});
