import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const sessionFindMany = vi.fn();
const grantFindMany = vi.fn();
const grantDeleteMany = vi.fn();
const grantUpdateMany = vi.fn();
const auditUpdateMany = vi.fn();
const auditDeleteMany = vi.fn();
const tx = {
  $queryRaw: queryRaw,
  session: { findMany: sessionFindMany },
  supportPreviewGrant: {
    findMany: grantFindMany,
    deleteMany: grantDeleteMany,
    updateMany: grantUpdateMany,
  },
  supportPreviewAuditEvent: {
    updateMany: auditUpdateMany,
    deleteMany: auditDeleteMany,
  },
};
const transaction = vi.fn(
  async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (callback: (client: typeof tx) => Promise<unknown>) =>
      transaction(callback),
  },
}));

import {
  anonymizeSupportPreviewForUser,
  applySupportPreviewRetention,
} from "@/lib/wepacker/support-preview-retention";

describe("Support Preview retention and erasure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([]);
    auditUpdateMany.mockResolvedValue({ count: 0 });
    auditDeleteMany.mockResolvedValue({ count: 0 });
    grantDeleteMany.mockResolvedValue({ count: 0 });
    grantUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("anonymizes Person/organized-Session links and removes grants", async () => {
    sessionFindMany.mockResolvedValue([{ id: "session-owned" }]);
    grantFindMany.mockResolvedValue([{ id: "grant-1" }]);
    auditUpdateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    grantDeleteMany.mockResolvedValue({ count: 1 });
    const now = new Date("2026-07-22T12:00:00Z");

    const result = await anonymizeSupportPreviewForUser(
      tx as never,
      "person-1",
      now,
    );

    expect(queryRaw).toHaveBeenCalled();
    expect(sessionFindMany).toHaveBeenCalledWith({
      where: { organizerId: "person-1" },
      select: { id: true },
    });
    expect(grantFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { actorId: "person-1" },
          { targetUserId: "person-1" },
          { sessionId: { in: ["session-owned"] } },
        ],
      },
      select: { id: true },
    });
    expect(auditUpdateMany).toHaveBeenCalledWith({
      where: { actorId: "person-1" },
      data: { actorId: null, anonymizedAt: now },
    });
    expect(auditUpdateMany).toHaveBeenCalledWith({
      where: { targetUserId: "person-1" },
      data: { targetUserId: null, anonymizedAt: now },
    });
    expect(auditUpdateMany).toHaveBeenCalledWith({
      where: { sessionId: { in: ["session-owned"] } },
      data: { sessionId: null, anonymizedAt: now },
    });
    expect(grantDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["grant-1"] } },
    });
    expect(result).toEqual({ anonymizedEvents: 5, removedGrants: 1 });
  });

  it("redacts expired digests, removes stale grants and purges old audit", async () => {
    grantFindMany.mockResolvedValue([{ id: "stale-grant" }]);
    auditDeleteMany.mockResolvedValue({ count: 4 });
    auditUpdateMany.mockResolvedValue({ count: 2 });
    grantDeleteMany.mockResolvedValue({ count: 1 });
    grantUpdateMany.mockResolvedValue({ count: 3 });
    const now = new Date("2026-07-22T12:00:00Z");

    await expect(applySupportPreviewRetention(now)).resolves.toEqual({
      deletedAuditEvents: 4,
      detachedGrantReferences: 2,
      deletedGrants: 1,
      redactedTicketReferences: 3,
    });

    expect(auditDeleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: new Date("2025-07-22T12:00:00Z") } },
    });
    expect(grantUpdateMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lte: now },
        ticketReferenceDigest: { not: null },
      },
      data: {
        ticketReferenceDigest: null,
        ticketReferenceRedactedAt: now,
      },
    });
  });

  it("does not mutate when the maintenance boundary fails", async () => {
    queryRaw.mockRejectedValue(new Error("maintenance denied"));
    await expect(applySupportPreviewRetention()).rejects.toThrow(
      "maintenance denied",
    );
    expect(auditDeleteMany).not.toHaveBeenCalled();
    expect(grantDeleteMany).not.toHaveBeenCalled();
    expect(grantUpdateMany).not.toHaveBeenCalled();
  });
});
