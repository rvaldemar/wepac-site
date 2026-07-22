import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getSessionAttendeePreview = vi.fn();
const ownerFindFirst = vi.fn();
const adminFindFirst = vi.fn();
const grantFindFirst = vi.fn();
const projectionFindFirst = vi.fn();
const auditCreate = vi.fn();
const transaction = vi.fn(
  async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
    callback({
      user: { findFirst: adminFindFirst },
      supportPreviewGrant: { findFirst: grantFindFirst },
      session: { findFirst: projectionFindFirst },
      supportPreviewAuditEvent: { create: auditCreate },
    }),
);

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  requireRole: vi.fn(),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getSessionAttendeePreview: (...args: unknown[]) =>
    getSessionAttendeePreview(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    session: { findFirst: (...args: unknown[]) => ownerFindFirst(...args) },
    $transaction: (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      transaction(callback),
  },
}));

import { getSessionAttendeeSupportProjection } from "@/lib/wepacker/actions/session-attendee-preview";

describe("Session attendee support projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("lets the exact organizer reuse the attendee-safe projection", async () => {
    requireUser.mockResolvedValue({ id: "organizer-1", role: "member" });
    ownerFindFirst.mockResolvedValue({ id: "session-1" });
    getSessionAttendeePreview.mockResolvedValue({
      viewer: { id: "organizer-1", name: "Rui" },
      attendee: { id: "alex-1", name: "Alex" },
      session: { id: "session-1" },
    });

    await expect(
      getSessionAttendeeSupportProjection("session-1", "alex-1"),
    ).resolves.toMatchObject({
      accessMode: "organizer",
      accessExpiresAt: null,
    });
    expect(getSessionAttendeePreview).toHaveBeenCalledWith(
      "session-1",
      "alex-1",
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("gives Admin only the grant-bound minimal projection", async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    requireUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    ownerFindFirst.mockResolvedValue(null);
    adminFindFirst.mockResolvedValue({ id: "admin-1", name: "Admin" });
    grantFindFirst.mockResolvedValue({
      id: "grant-1",
      expiresAt,
      reasonCode: "reported_issue",
    });
    projectionFindFirst.mockResolvedValue({
      id: "session-1",
      scheduledAt: new Date("2026-08-01T10:00:00Z"),
      durationMinutes: 60,
      kind: "checkpoint",
      status: "scheduled",
      organizer: { id: "organizer-1", name: "Rui" },
      attendees: [
        {
          outcome: "bounded outcome",
          sharedNote: "not yet shared",
          sharedNotePublished: false,
          user: { id: "alex-1", name: "Alex" },
        },
      ],
      _count: { attendees: 2 },
    });

    const result = await getSessionAttendeeSupportProjection(
      "session-1",
      "alex-1",
      "grant-1",
    );

    expect(result).toMatchObject({
      accessMode: "admin_support",
      accessExpiresAt: expiresAt,
      session: {
        attendeeCount: 2,
        format: "group",
        outcome: "bounded outcome",
        sharedNote: null,
        meetingUrl: null,
      },
    });
    const query = projectionFindFirst.mock.calls[0]?.[0];
    const serializedSelect = JSON.stringify(query.select);
    for (const forbidden of [
      "meetingUrl",
      "discussionPoints",
      "privateNote",
      "transcript",
      "debrief",
      "email",
      "phone",
    ]) {
      expect(serializedSelect).not.toContain(forbidden);
    }
    expect(query.where).toMatchObject({
      id: "session-1",
      organizerId: { not: "admin-1" },
      attendees: { some: { userId: "alex-1" } },
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        grantId: "grant-1",
        actorId: "admin-1",
        targetUserId: "alex-1",
        sessionId: "session-1",
        reasonCode: "reported_issue",
        type: "projection_accessed",
      },
      select: { id: true },
    });
  });

  it("fails closed for non-organizer/non-Admin and invalid grants", async () => {
    requireUser.mockResolvedValue({ id: "stranger-1", role: "member" });
    ownerFindFirst.mockResolvedValue(null);
    await expect(
      getSessionAttendeeSupportProjection("session-1", "alex-1"),
    ).resolves.toBeNull();
    expect(transaction).not.toHaveBeenCalled();

    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    ownerFindFirst.mockResolvedValue(null);
    adminFindFirst.mockResolvedValue({ id: "admin-1", name: "Admin" });
    grantFindFirst.mockResolvedValue(null);
    await expect(
      getSessionAttendeeSupportProjection("session-1", "alex-1", "bad-grant"),
    ).resolves.toBeNull();
    expect(projectionFindFirst).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
