import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const requireRole = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
  requireUser: vi.fn(),
  assertMentorOfCohort: vi.fn(),
  getMentoredCohortIds: vi.fn(async () => []),
  resolveSessionAttendeeAuthorization: vi.fn(),
}));

import { getSessionAttendeePreview } from "@/lib/wepacker/actions/session";

const guardRow = {
  cohortId: null,
  mentorshipId: "mentorship-1",
  mentorId: "mentor-1",
};

function previewRow(sharedNotePublished: boolean, notesPublished: boolean) {
  return {
    id: "session-1",
    scheduledAt: new Date("2026-08-01T10:00:00Z"),
    durationMinutes: 60,
    sessionType: "individual",
    kind: "checkpoint",
    status: "scheduled",
    notes: "legacy private until published",
    notesPublished,
    discussionPoints: "discussion",
    meetingUrl: "https://meet.example/session-1",
    mentor: { id: "mentor-1", name: "Rui" },
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

describe("Preview attendee view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ id: "mentor-1", role: "mentor" });
  });

  it("returns only the selected attendee's member-safe Session projection", async () => {
    sessionFindUnique
      .mockResolvedValueOnce(guardRow)
      .mockResolvedValueOnce(previewRow(false, false));

    const result = await getSessionAttendeePreview("session-1", "alex-1");

    expect(result).toMatchObject({
      viewer: { id: "mentor-1", name: "Rui" },
      attendee: { id: "alex-1", name: "Alex" },
      session: {
        notes: null,
        discussionPoints: null,
        outcome: "agreed outcome",
        sharedNote: null,
      },
    });
    const query = sessionFindUnique.mock.calls[1]?.[0];
    expect(query.select).not.toHaveProperty("transcript");
    expect(query.select).not.toHaveProperty("debrief");
    expect(query.select.attendees.where).toEqual({ userId: "alex-1" });
    expect(query.select.attendees.select).not.toHaveProperty("privateNote");
    expect(query.select.attendees.select.user.select).toEqual({
      id: true,
      name: true,
    });
  });

  it("shows only notes deliberately published to that attendee", async () => {
    sessionFindUnique
      .mockResolvedValueOnce(guardRow)
      .mockResolvedValueOnce(previewRow(true, true));

    const result = await getSessionAttendeePreview("session-1", "alex-1");

    expect(result?.session).toMatchObject({
      notes: "legacy private until published",
      discussionPoints: "discussion",
      sharedNote: "shared only after publish",
    });
  });

  it("does not let Admin bypass organizer ownership", async () => {
    requireRole.mockResolvedValueOnce({ id: "admin-1", role: "admin" });
    sessionFindUnique.mockResolvedValueOnce({
      ...guardRow,
      mentorId: "mentor-1",
    });

    await expect(
      getSessionAttendeePreview("session-1", "alex-1"),
    ).rejects.toThrow("Sem permissão");
    expect(sessionFindUnique).toHaveBeenCalledOnce();
  });

  it("returns no preview when the target is not an explicit attendee", async () => {
    sessionFindUnique.mockResolvedValueOnce(guardRow).mockResolvedValueOnce({
      ...previewRow(false, false),
      attendees: [],
    });

    await expect(
      getSessionAttendeePreview("session-1", "stranger-1"),
    ).resolves.toBeNull();
  });
});
