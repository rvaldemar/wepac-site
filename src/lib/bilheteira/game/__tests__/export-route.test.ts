import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
let admin: { id: string } | null = { id: "adm1" };
vi.mock("@/lib/db", () => ({ prisma: { gameParticipant: { findMany: (...a: unknown[]) => findMany(...a) } } }));
vi.mock("@/lib/bilheteira/session", () => ({ getSessionAdmin: async () => admin }));

import { GET } from "@/app/api/bilheteira/game/export/route";

beforeEach(() => {
  vi.clearAllMocks();
  admin = { id: "adm1" };
});

describe("GET /api/bilheteira/game/export", () => {
  it("requires an admin session", async () => {
    admin = null;
    expect((await GET()).status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });
  it("exports only consented rows, escapes formulas and keeps phones importable", async () => {
    findMany.mockResolvedValue([
      { email: "a@b.pt", name: "=HYPERLINK(\"x\")", phone: "+351 912", locale: "pt-PT", marketingConsentAt: new Date("2026-10-10T10:00:00Z"), consentVersion: "2026-10-v1" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(findMany.mock.calls[0][0].where).toEqual(expect.objectContaining({ marketingConsentAt: { not: null } }));
    const body = await res.text();
    expect(body).toContain('"\'=HYPERLINK(""x"")"');
    expect(body).toContain('"00351 912"');
    expect(res.headers.get("content-disposition")).toContain("attachment");
  });
});
