import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const requireRole = vi.fn();
const userFindFirst = vi.fn();
const sessionFindMany = vi.fn();
const transaction = vi.fn(
  async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
    callback({
      user: { findFirst: userFindFirst },
      session: { findMany: sessionFindMany },
    }),
);

vi.mock("@/lib/wepacker/guards", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
  requireUser: vi.fn(),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getSessionAttendeePreview: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      transaction(callback),
  },
}));

import { getAdminSessionAttendeePreviewIndex } from "@/lib/wepacker/actions/session-attendee-preview";

describe("Admin Support Preview discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ id: "admin-1", role: "admin" });
    userFindFirst.mockResolvedValue({ id: "admin-1" });
  });

  it("revalidates Admin and uses a metadata-only select", async () => {
    sessionFindMany.mockResolvedValue([]);

    await expect(getAdminSessionAttendeePreviewIndex()).resolves.toEqual([]);
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
    expect(userFindFirst).toHaveBeenCalledWith({
      where: { id: "admin-1", role: "admin" },
      select: { id: true },
    });
    const query = sessionFindMany.mock.calls[0]?.[0];
    expect(query.take).toBe(100);
    expect(query.select).toEqual({
      id: true,
      scheduledAt: true,
      kind: true,
      status: true,
      organizer: { select: { id: true, name: true } },
      attendees: {
        select: { user: { select: { id: true, name: true } } },
      },
    });
    for (const forbidden of [
      "meetingUrl",
      "transcript",
      "debrief",
      "discussionPoints",
      "privateNote",
      "outcome",
      "email",
      "phone",
    ]) {
      expect(JSON.stringify(query.select)).not.toContain(forbidden);
    }
  });

  it("fails closed before listing when the database role was revoked", async () => {
    userFindFirst.mockResolvedValue(null);
    await expect(getAdminSessionAttendeePreviewIndex()).rejects.toThrow(
      "Sem permissão",
    );
    expect(sessionFindMany).not.toHaveBeenCalled();
  });

  it("flattens a Group Session into isolated attendee links", async () => {
    sessionFindMany.mockResolvedValue([
      {
        id: "session-1",
        scheduledAt: new Date("2026-08-01T10:00:00Z"),
        kind: "checkpoint",
        status: "scheduled",
        organizer: { id: "organizer-1", name: "Rui" },
        attendees: [
          { user: { id: "alex-1", name: "Alex" } },
          { user: { id: "sam-1", name: "Sam" } },
        ],
      },
    ]);

    const entries = await getAdminSessionAttendeePreviewIndex();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      sessionId: "session-1",
      attendeeCount: 2,
      format: "group",
      attendee: { id: "alex-1", name: "Alex" },
    });
    expect(entries[1]).toMatchObject({
      attendee: { id: "sam-1", name: "Sam" },
    });
    expect(entries[0]).not.toHaveProperty("attendees");
  });

  it("keeps the Admin route server-only and links only to the gate", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/app/wepacker/(platform)/admin/support-preview/page.tsx",
      ),
      "utf8",
    );
    expect(source).not.toContain('"use client"');
    expect(source).toContain('requirePageRole(["admin"])');
    expect(source).toContain("getAdminSessionAttendeePreviewIndex");
    expect(source).toContain("Open gated preview");
    expect(source).not.toMatch(/meetingUrl|transcript|debrief|privateNote/);
    expect(source).not.toMatch(/<form|<button/);
  });

  it("uses bcrypt's exact UTF-8 password boundary for reauthentication", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/lib/wepacker/actions/session-attendee-preview.ts",
      ),
      "utf8",
    );
    expect(source).toContain('Buffer.byteLength(password, "utf8") > 72');
    expect(source).not.toContain("password.length > 256");
  });
});
