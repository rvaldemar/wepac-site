import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const sessionFindUnique = vi.fn();
const resultDocumentFindUnique = vi.fn();
const auditCreate = vi.fn();

const tx = {
  session: {
    findUnique: (...args: unknown[]) => sessionFindUnique(...args),
  },
};

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
    sessionResultDocument: {
      findUnique: (...args: unknown[]) => resultDocumentFindUnique(...args),
    },
    sessionArtifactAuditEvent: {
      create: (...args: unknown[]) => auditCreate(...args),
    },
    $transaction: (callback: (client: unknown) => unknown) => callback(tx),
  },
}));

import {
  getMyJitsiJoin,
  getSessionMediaWorkspace,
} from "@/lib/wepacker/actions/session-media";
import { GET as getResultDocument } from "@/app/api/wepacker/session-media/documents/[documentId]/route";

const session = {
  id: "session-1",
  organizerId: "mentor-1",
  meetingUrl: "https://meet.rvs.solutions/wepac-0123456789abcdef",
  scheduledAt: new Date("2026-07-23T12:00:00.000Z"),
  durationMinutes: 90,
  status: "scheduled",
  attendees: [{ id: "attendee-row-1", userId: "mentee-1" }],
  consentEvents: [],
  consentCapacityAssurances: [],
  recordings: [],
  transcriptArtifacts: [],
  resultDocuments: [],
};

describe("Session media exact-person authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SESSION_MEDIA_ENABLED", "true");
    vi.stubEnv("JITSI_JWT_ENABLED", "true");
    vi.stubEnv("JITSI_JWT_SUB", "meet.jitsi");
    vi.stubEnv("JITSI_JWT_SECRET", "synthetic-jwt-secret");
    vi.stubEnv("JITSI_JWT_ISSUER", "wepac");
    vi.stubEnv("JITSI_JWT_AUDIENCE", "jitsi");
    vi.stubEnv("MEETING_BASE_URL", "https://meet.rvs.solutions");
    sessionFindUnique.mockResolvedValue(session);
  });

  it.each([
    ["mentor-1", true],
    ["mentee-1", false],
  ] as const)("mints only for exact participant %s", async (userId, moderator) => {
    requireUser.mockResolvedValue({
      id: userId,
      name: userId,
      email: `${userId}@example.test`,
      role: "member",
      onboarded: true,
      sessionVersion: 1,
    });
    const join = await getMyJitsiJoin("session-1");
    expect(join.token).not.toBeNull();
    const payload = JSON.parse(
      Buffer.from(join.token!.split(".")[1], "base64url").toString("utf8"),
    );
    expect(join.room).toBe("wepac-0123456789abcdef");
    expect(payload.context.user).toMatchObject({ id: userId, moderator });
    expect(payload.context.features.recording).toBe(moderator);
  });

  it("denies another member and gives Admin no implicit raw access", async () => {
    requireUser.mockResolvedValue({
      id: "other-1",
      name: "Other",
      email: "other@example.test",
      role: "admin",
      onboarded: true,
      sessionVersion: 1,
    });
    await expect(getMyJitsiJoin("session-1")).rejects.toThrow(
      "Permission denied.",
    );
    await expect(getSessionMediaWorkspace("session-1")).rejects.toThrow(
      "Permission denied.",
    );
  });

  it("serves a draft to its organizer but never to its exact attendee", async () => {
    resultDocumentFindUnique.mockResolvedValue({
      id: "document-1",
      sessionId: "session-1",
      attendeeId: "attendee-row-1",
      version: 1,
      contentHtml: "<!doctype html><p>Result</p>",
      publishedAt: null,
      revokedAt: null,
      erasedAt: null,
      session: { organizerId: "mentor-1" },
      attendee: { userId: "mentee-1" },
    });

    requireUser.mockResolvedValue({ id: "mentee-1" });
    const attendeeResponse = await getResultDocument(new Request("https://test"), {
      params: Promise.resolve({ documentId: "document-1" }),
    });
    expect(attendeeResponse.status).toBe(404);
    expect(auditCreate).not.toHaveBeenCalled();

    requireUser.mockResolvedValue({ id: "mentor-1" });
    const organizerResponse = await getResultDocument(new Request("https://test"), {
      params: Promise.resolve({ documentId: "document-1" }),
    });
    expect(organizerResponse.status).toBe(200);
    expect(auditCreate).toHaveBeenCalledTimes(1);
  });

  it("serves only a published, non-revoked version to the exact attendee", async () => {
    resultDocumentFindUnique.mockResolvedValue({
      id: "document-1",
      sessionId: "session-1",
      attendeeId: "attendee-row-1",
      version: 1,
      contentHtml: "<!doctype html><p>Result</p>",
      publishedAt: new Date("2026-07-23T14:00:00.000Z"),
      revokedAt: null,
      erasedAt: null,
      session: { organizerId: "mentor-1" },
      attendee: { userId: "mentee-1" },
    });
    requireUser.mockResolvedValue({ id: "mentee-1" });

    const response = await getResultDocument(new Request("https://test"), {
      params: Promise.resolve({ documentId: "document-1" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
