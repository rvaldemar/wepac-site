"use server";

import { revalidatePath } from "next/cache";
import type { PrizeKind, PrizeVoucherStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { normalizeVoucherCode, VOUCHER_CODE_RE } from "./voucher-code";

export type VoucherView = {
  id: string;
  code: string;
  kind: PrizeKind;
  status: PrizeVoucherStatus;
  validFrom: string;
  validUntil: string;
  redeemedAt: string | null;
  redemptionNote: string | null;
  participant: { email: string; name: string | null; phone: string | null; marketingConsentAt: string | null };
};

export type VoucherLookup =
  | { ok: true; voucher: VoucherView }
  | { ok: false; error: "unauthorized" | "invalid_code" | "not_found" | "generic" };

function toView(v: {
  id: string;
  code: string;
  kind: PrizeKind;
  status: PrizeVoucherStatus;
  validFrom: Date;
  validUntil: Date;
  redeemedAt: Date | null;
  redemptionNote: string | null;
  participant: { email: string; name: string | null; phone: string | null; marketingConsentAt: Date | null };
}): VoucherView {
  return {
    id: v.id,
    code: v.code,
    kind: v.kind,
    status: v.status,
    validFrom: v.validFrom.toISOString(),
    validUntil: v.validUntil.toISOString(),
    redeemedAt: v.redeemedAt?.toISOString() ?? null,
    redemptionNote: v.redemptionNote,
    participant: {
      email: v.participant.email,
      name: v.participant.name,
      phone: v.participant.phone,
      marketingConsentAt: v.participant.marketingConsentAt?.toISOString() ?? null,
    },
  };
}

const include = {
  participant: { select: { email: true, name: true, phone: true, marketingConsentAt: true } },
} as const;

export async function lookupVoucherAction(raw: string): Promise<VoucherLookup> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };
  const code = normalizeVoucherCode(String(raw || ""));
  if (!VOUCHER_CODE_RE.test(code)) return { ok: false, error: "invalid_code" };
  const v = await prisma.prizeVoucher.findUnique({ where: { code }, include });
  if (!v) return { ok: false, error: "not_found" };
  return { ok: true, voucher: toView(await expireIfOutOfWindow(v)) };
}

type VoucherRow = NonNullable<Awaited<ReturnType<typeof findByCode>>>;

function findByCode(code: string) {
  return prisma.prizeVoucher.findUnique({ where: { code }, include });
}

/** Flips an `issued` voucher outside its validity window to `expired`. */
async function expireIfOutOfWindow(v: VoucherRow): Promise<VoucherRow> {
  const now = new Date();
  if (v.status !== "issued" || (now <= v.validUntil && now >= v.validFrom)) return v;
  await prisma.prizeVoucher.updateMany({
    where: { id: v.id, status: "issued" },
    data: { status: "expired" },
  });
  return (await findByCode(v.code)) ?? v;
}

/**
 * Marks a voucher as redeemed. Single-use prizes flip to `redeemed`; the
 * "all 2026 / all Q4" prizes stay `issued` so they can be presented at every
 * concert, and each use is appended to the redemption note as an audit line.
 */
export async function redeemVoucherAction(
  code: string,
  note: string,
): Promise<VoucherLookup> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };
  const normalized = normalizeVoucherCode(String(code || ""));
  if (!VOUCHER_CODE_RE.test(normalized)) return { ok: false, error: "invalid_code" };

  let v = await findByCode(normalized);
  if (!v) return { ok: false, error: "not_found" };
  v = await expireIfOutOfWindow(v);
  if (v.status !== "issued") return { ok: true, voucher: toView(v) };

  const now = new Date();
  const multiUse = v.kind === "two_for_one_all_2026" || v.kind === "free_all_q4_2026";
  const line = `${now.toISOString()} ${admin.email}${note.trim() ? ` — ${note.trim().slice(0, 200)}` : ""}`;
  // Guarded write: a double click or two staff redeeming the same single-use
  // code at once must not both succeed.
  const result = await prisma.prizeVoucher.updateMany({
    where: { id: v.id, status: "issued", redemptionNote: v.redemptionNote },
    data: {
      status: multiUse ? "issued" : "redeemed",
      redeemedAt: now,
      redeemedByAdminId: admin.id,
      redemptionNote: v.redemptionNote ? `${v.redemptionNote}\n${line}` : line,
    },
  });
  revalidatePath("/bilheteira/admin/jogo");
  const fresh = await findByCode(normalized);
  if (!fresh) return { ok: false, error: "not_found" };
  if (result.count === 0) {
    // Lost the race: return the current state without claiming the redeem.
    return { ok: true, voucher: toView(fresh) };
  }
  return { ok: true, voucher: toView(fresh) };
}

export async function cancelVoucherAction(code: string): Promise<VoucherLookup> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };
  const normalized = normalizeVoucherCode(String(code || ""));
  if (!VOUCHER_CODE_RE.test(normalized)) return { ok: false, error: "invalid_code" };
  const v = await findByCode(normalized);
  if (!v) return { ok: false, error: "not_found" };
  await prisma.prizeVoucher.updateMany({
    where: { id: v.id, status: { in: ["issued", "expired"] } },
    data: {
      status: "cancelled",
      redemptionNote: `${v.redemptionNote ? `${v.redemptionNote}\n` : ""}${new Date().toISOString()} ${admin.email} — cancelled`,
    },
  });
  revalidatePath("/bilheteira/admin/jogo");
  const fresh = await findByCode(normalized);
  return fresh ? { ok: true, voucher: toView(fresh) } : { ok: false, error: "not_found" };
}
