import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const updateMany = vi.fn();
let admin: { id: string; email: string } | null = { id: "adm1", email: "admin@wepac.pt" };

vi.mock("@/lib/db", () => ({
  prisma: {
    prizeVoucher: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
      // update intentionally absent: every write must be a guarded updateMany.
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

/** Simulates the DB: findUnique returns `row`, updateMany mutates it when the guard matches. */
function db(row: Record<string, unknown>, { guardFails = false } = {}) {
  findUnique.mockImplementation(async () => ({ ...row }));
  updateMany.mockImplementation(async ({ data }) => {
    if (guardFails) return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  });
  return row;
}

beforeEach(() => {
  vi.clearAllMocks();
  admin = { id: "adm1", email: "admin@wepac.pt" };
  vi.useRealTimers();
});

describe("lookupVoucherAction", () => {
  it("requires an admin session", async () => {
    admin = null;
    expect(await lookupVoucherAction("AC-AAAA-BBBB")).toEqual({ ok: false, error: "unauthorized" });
    expect(findUnique).not.toHaveBeenCalled();
  });
  it("normalises the code before querying", async () => {
    db({ ...baseVoucher, kind: "two_for_one_single_2026" });
    const r = await lookupVoucherAction("ac aaaa bbbb");
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { code: "AC-AAAA-BBBB" } }));
    expect(r.ok).toBe(true);
  });
  it("rejects malformed codes without a query", async () => {
    expect(await lookupVoucherAction("DROP TABLE")).toEqual({ ok: false, error: "invalid_code" });
    expect(findUnique).not.toHaveBeenCalled();
  });
  it("flips an out-of-window voucher to expired on lookup", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-02T10:00:00Z"));
    db({ ...baseVoucher, kind: "two_for_one_all_2026" });
    const r = await lookupVoucherAction("AC-AAAA-BBBB");
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "v1", status: "issued" }, data: { status: "expired" } }));
    expect(r.ok && r.voucher.status).toBe("expired");
  });
});

describe("redeemVoucherAction", () => {
  it("single-use prize becomes redeemed with an audit line, via a guarded write", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T20:00:00Z"));
    db({ ...baseVoucher, kind: "free_ticket_single_2026" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "sala 2");
    expect(r.ok && r.voucher.status).toBe("redeemed");
    const call = updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: "v1", status: "issued", redemptionNote: null });
    expect(call.data.redeemedByAdminId).toBe("adm1");
    expect(call.data.redemptionNote).toContain("admin@wepac.pt");
    expect(call.data.redemptionNote).toContain("sala 2");
  });
  it("multi-use prize stays issued and appends to the history", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T20:00:00Z"));
    db({ ...baseVoucher, kind: "free_all_q4_2026", redemptionNote: "first" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "");
    const data = updateMany.mock.calls[0][0].data;
    expect(data.status).toBe("issued");
    expect(data.redemptionNote.startsWith("first\n")).toBe(true);
    expect(r.ok && r.voucher.status).toBe("issued");
  });
  it("marks an out-of-window voucher as expired instead of redeeming", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-02T10:00:00Z"));
    db({ ...baseVoucher, kind: "two_for_one_all_2026" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "");
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls[0][0].data).toEqual({ status: "expired" });
    expect(r.ok && r.voucher.status).toBe("expired");
  });
  it("does not re-redeem an already used voucher", async () => {
    db({ ...baseVoucher, kind: "free_ticket_single_2026", status: "redeemed" });
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "");
    expect(updateMany).not.toHaveBeenCalled();
    expect(r.ok && r.voucher.status).toBe("redeemed");
  });
  it("losing the redeem race returns the current state without claiming success", async () => {
    const row = db({ ...baseVoucher, kind: "free_ticket_single_2026" }, { guardFails: true });
    // Another staff member redeemed in between: the re-read sees it.
    findUnique.mockImplementationOnce(async () => ({ ...row })).mockImplementation(async () => ({ ...row, status: "redeemed" }));
    const r = await redeemVoucherAction("AC-AAAA-BBBB", "");
    expect(r.ok && r.voucher.status).toBe("redeemed");
  });
});

describe("cancelVoucherAction", () => {
  it("cancels and logs who did it, only from issued/expired", async () => {
    db({ ...baseVoucher, kind: "two_for_one_single_2026" });
    const r = await cancelVoucherAction("AC-AAAA-BBBB");
    const call = updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: "v1", status: { in: ["issued", "expired"] } });
    expect(call.data.status).toBe("cancelled");
    expect(call.data.redemptionNote).toContain("cancelled");
    expect(r.ok && r.voucher.status).toBe("cancelled");
  });
});
