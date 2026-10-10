"use client";

import { useState, useTransition } from "react";
import { getGameCopy } from "@/i18n/copy/institutional-game";
import {
  cancelVoucherAction,
  lookupVoucherAction,
  redeemVoucherAction,
  type VoucherLookup,
  type VoucherView,
} from "@/lib/bilheteira/game/admin-actions";
import { styles } from "../../ui";

export function RedeemClient({ locale }: { locale: string }) {
  const copy = getGameCopy(locale);
  const a = copy.admin;
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [voucher, setVoucher] = useState<VoucherView | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const apply = (r: VoucherLookup) => {
    if (r.ok) { setVoucher(r.voucher); setError(""); }
    else { setVoucher(null); setError(a.errors[r.error] ?? a.errors.generic); }
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale, { timeZone: "Europe/Lisbon", day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

  const multiUse = voucher && (voucher.kind === "two_for_one_all_2026" || voucher.kind === "free_all_q4_2026");
  const canRedeem = voucher && voucher.status === "issued";

  return (
    <div style={styles.card}>
      <form
        onSubmit={(e) => { e.preventDefault(); start(async () => apply(await lookupVoucherAction(code))); }}
        style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <label style={{ flex: 1, minWidth: 220 }}>
          <div style={styles.label}>{a.lookupLabel}</div>
          <input
            style={{ ...styles.input, fontFamily: "monospace", fontSize: 20, letterSpacing: 2, textTransform: "uppercase" }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={a.lookupPlaceholder}
            autoComplete="off"
            autoFocus
          />
        </label>
        <button type="submit" style={styles.button} disabled={pending}>{a.lookup}</button>
      </form>
      {error && <p style={{ color: "#c00", fontSize: 14, marginTop: 12 }}>{error}</p>}

      {voucher && (
        <div style={{ marginTop: 20, borderTop: "1px solid #e5e3de", paddingTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 24, letterSpacing: 2 }}>{voucher.code}</div>
              <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 900, fontSize: 22, marginTop: 4 }}>
                {copy.prizes[voucher.kind].title}
              </div>
              <div style={{ color: "#666", fontSize: 14 }}>{copy.prizes[voucher.kind].rules}</div>
            </div>
            <div style={{
              alignSelf: "flex-start",
              padding: "6px 12px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              background: voucher.status === "issued" ? "#e8f5e9" : voucher.status === "redeemed" ? "#eeeeee" : "#fdecea",
              color: voucher.status === "issued" ? "#1b5e20" : voucher.status === "redeemed" ? "#333" : "#c00",
            }}>
              {a.status[voucher.status]}
            </div>
          </div>

          <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 16px", marginTop: 16, fontSize: 14 }}>
            <dt style={{ color: "#666" }}>{a.participant}</dt>
            <dd style={{ margin: 0 }}>
              {voucher.participant.name ? `${voucher.participant.name} · ` : ""}{voucher.participant.email}
              {voucher.participant.phone ? ` · ${voucher.participant.phone}` : ""}
              <span style={{ color: "#666" }}> · {voucher.participant.marketingConsentAt ? a.marketingYes : a.marketingNo}</span>
            </dd>
            <dt style={{ color: "#666" }}>{a.validity}</dt>
            <dd style={{ margin: 0 }}>{fmt(voucher.validFrom)} → {fmt(voucher.validUntil)}</dd>
            {voucher.redemptionNote && (
              <>
                <dt style={{ color: "#666" }}>{a.history}</dt>
                <dd style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}>{voucher.redemptionNote}</dd>
              </>
            )}
          </dl>
          {multiUse && <p style={{ fontSize: 13, color: "#666" }}>{a.multiUseHint}</p>}

          {canRedeem && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}>
              <label style={{ flex: 1, minWidth: 220 }}>
                <div style={styles.label}>{a.noteLabel}</div>
                <input style={styles.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder={a.notePlaceholder} maxLength={200} />
              </label>
              <button
                type="button"
                style={styles.button}
                disabled={pending}
                onClick={() => start(async () => { apply(await redeemVoucherAction(voucher.code, note)); setNote(""); })}
              >
                {multiUse ? a.redeemAgain : a.redeem}
              </button>
              <button
                type="button"
                style={{ ...styles.buttonGhost, color: "#c00" }}
                disabled={pending}
                onClick={() => start(async () => apply(await cancelVoucherAction(voucher.code)))}
              >
                {a.cancel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
