import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const update = vi.fn();
let admin: { id: string; email: string } | null = { id: "adm1", email: "admin@wepac.pt" };

vi.mock("@/lib/db", () => ({
  prisma: {
    prizeVoucher: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => update(...a),
    },
  },
}));
vi.mock("@/lib/bilheteira/session", () => ({ getSessionAdmin: async () => admin }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

import { cancelVoucherAction, lookupVoucherAction, redeemVoucherAction } from "../admin-actions";

const participant = { email: "a@b.pt", name: null, phone: null, marketingConsentAt: null };
const baseVoucher = {
  id: "v1",
  code: "AC-AAAA-BBBB",
  status: "issued",
  validFrom: new Date("2026-10-01T00:00:00Z"),
  validUntil: new Date("2026-12-31T23:59:59Z"),
  redeemedAt: null,
  redemptionNote: null,
  participant,
};

beforeEach(() => {
  vi.clearAllMocks();
  admin = { id: "adm1", email: "admin@wepac.pt" };
  vi.useRealTimers();
  update.mockImplementation(async ({ data }) => ({ ...baseVoucher, ...data, participant }));
});

describe("lookupVoucherAction", () => {
  it("requires an admin session", async () => {
    admin = null;
    expect(await lookupVoucherAction("AC-AAAA-BBBB")).toEqual({ ok: false, error: "unauthorized" });
    expect(findUnique).not.toHaveBeenCalled();
  });
  it("normalises the code before querying", async () => {
    findUnique.mockResolvedValue({ ...baseVoucher, kind: "two_for_one_single_2026" });
    const r = await lookupVoucherAction("ac aaaa bbbb");
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { code: "AC-AAAA-BBBB" } }));
    expect(r.ok).toBe(true);
  });
  it("rejects malformed codes without a query", async () => {
    expect(await lookupVoucherAction("DROP TABLE")).toEqual({ ok: false, error: "invalid_code" });
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("redeemVoucherAction", () => {
  it("single-use prize becomes redeemed with an audit line", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T20:00:00Z"));
    findUnique.mockResolvedValue({ ...baseVoucher, kind: "free_ticket_single_2026" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "sala 2");
    expect(r.ok).toBe(true);
    const data = update.mock.calls[0][0].data;
    expect(data.status).toBe("redeemed");
    expect(data.redeemedByAdminId).toBe("adm1");
    expect(data.redemptionNote).toContain("admin@wepac.pt");
    expect(data.redemptionNote).toContain("sala 2");
  });
  it("multi-use prize stays issued and appends to the history", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T20:00:00Z"));
    findUnique.mockResolvedValue({ ...baseVoucher, kind: "free_all_q4_2026", redemptionNote: "first" });
    await redeemVoucherAction("AC-AAAA-BBBB", "");
    const data = update.mock.calls[0][0].data;
    expect(data.status).toBe("issued");
    expect(data.redemptionNote.startsWith("first\n")).toBe(true);
  });
  it("marks an out-of-window voucher as expired instead of redeeming", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-02T10:00:00Z"));
    findUnique.mockResolvedValue({ ...baseVoucher, kind: "two_for_one_all_2026" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "");
    expect(update.mock.calls[0][0].data).toEqual({ status: "expired" });
    expect(r.ok && r.voucher.status).toBe("expired");
  });
  it("does not re-redeem an already used voucher", async () => {
    findUnique.mockResolvedValue({ ...baseVoucher, kind: "free_ticket_single_2026", status: "redeemed" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "");
    expect(update).not.toHaveBeenCalled();
    expect(r.ok && r.voucher.status).toBe("redeemed");
  });
});

describe("cancelVoucherAction", () => {
  it("cancels and logs who did it", async () => {
    findUnique.mockResolvedValue({ ...baseVoucher, kind: "two_for_one_single_2026" });
    const r = await cancelVoucherAction("AC-AAAA-BBBB");
    expect(update.mock.calls[0][0].data.status).toBe("cancelled");
    expect(update.mock.calls[0][0].data.redemptionNote).toContain("cancelled");
    expect(r.ok).toBe(true);
  });
});
