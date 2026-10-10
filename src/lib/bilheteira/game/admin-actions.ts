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
  return { ok: true, voucher: toView(v) };
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

  const v = await prisma.prizeVoucher.findUnique({ where: { code: normalized }, include });
  if (!v) return { ok: false, error: "not_found" };

  const now = new Date();
  const multiUse = v.kind === "two_for_one_all_2026" || v.kind === "free_all_q4_2026";
  const expired = now > v.validUntil || now < v.validFrom;
  if (expired && v.status === "issued") {
    const updated = await prisma.prizeVoucher.update({
      where: { id: v.id },
      data: { status: "expired" },
      include,
    });
    revalidatePath("/bilheteira/admin/jogo");
    return { ok: true, voucher: toView(updated) };
  }
  if (v.status !== "issued") return { ok: true, voucher: toView(v) };

  const line = `${now.toISOString()} ${admin.email}${note.trim() ? ` — ${note.trim().slice(0, 200)}` : ""}`;
  const updated = await prisma.prizeVoucher.update({
    where: { id: v.id },
    data: {
      status: multiUse ? "issued" : "redeemed",
      redeemedAt: now,
      redeemedByAdminId: admin.id,
      redemptionNote: v.redemptionNote ? `${v.redemptionNote}\n${line}` : line,
    },
    include,
  });
  revalidatePath("/bilheteira/admin/jogo");
  return { ok: true, voucher: toView(updated) };
}

export async function cancelVoucherAction(code: string): Promise<VoucherLookup> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, error: "unauthorized" };
  const normalized = normalizeVoucherCode(String(code || ""));
  if (!VOUCHER_CODE_RE.test(normalized)) return { ok: false, error: "invalid_code" };
  const v = await prisma.prizeVoucher.findUnique({ where: { code: normalized } });
  if (!v) return { ok: false, error: "not_found" };
  const updated = await prisma.prizeVoucher.update({
    where: { id: v.id },
    data: {
      status: "cancelled",
      redemptionNote: `${v.redemptionNote ? `${v.redemptionNote}\n` : ""}${new Date().toISOString()} ${admin.email} — cancelled`,
    },
    include,
  });
  revalidatePath("/bilheteira/admin/jogo");
  return { ok: true, voucher: toView(updated) };
}
