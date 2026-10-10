import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { prisma } from "@/lib/db";
import { getGameCopy } from "@/i18n/copy/institutional-game";
import { GAME_CAMPAIGN } from "@/lib/bilheteira/game/prizes";
import { styles } from "../../ui";
import { RedeemClient } from "./redeem-client";

export const dynamic = "force-dynamic";

export default async function GameAdminPage() {
  // The layout also checks, but this page lists personal data: authorise here
  // too so a direct segment request cannot skip the layout.
  if (!(await getSessionAdmin())) redirect("/bilheteira/login");
  const locale = await getLocale();
  const copy = getGameCopy(locale);
  const a = copy.admin;

  const [participants, marketing, issued, redeemed, recent] = await Promise.all([
    prisma.gameParticipant.count({ where: { campaign: GAME_CAMPAIGN } }),
    prisma.gameParticipant.count({ where: { campaign: GAME_CAMPAIGN, marketingConsentAt: { not: null } } }),
    prisma.prizeVoucher.count({ where: { campaign: GAME_CAMPAIGN, status: "issued" } }),
    prisma.prizeVoucher.count({ where: { campaign: GAME_CAMPAIGN, status: "redeemed" } }),
    prisma.prizeVoucher.findMany({
      where: { campaign: GAME_CAMPAIGN },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { participant: { select: { email: true } } },
    }),
  ]);

  const fmt = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const stat = (label: string, value: number) => (
    <div style={{ ...styles.card, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#666" }}>{label}</div>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 900, fontSize: 32 }}>{value}</div>
    </div>
  );

  return (
    <main style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={styles.eyebrow}>Arte à Capela</div>
          <h1 style={styles.h1}>{a.title}</h1>
          <p style={{ color: "#666", margin: 0, maxWidth: 620 }}>{a.intro}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/bilheteira/jogo" target="_blank" style={styles.buttonGhost}>{a.kioskLink}</Link>
          {/* Route handler download, not a page: a plain anchor is intentional. */}
          <a href="/api/bilheteira/game/export" download style={styles.buttonGhost} title={a.exportHint}>{a.exportCsv}</a>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {stat(a.stats.participants, participants)}
        {stat(a.stats.marketing, marketing)}
        {stat(a.stats.issued, issued)}
        {stat(a.stats.redeemed, redeemed)}
      </div>

      <RedeemClient locale={locale} />

      <h2 style={{ ...styles.h2, marginTop: 40 }}>{a.recent}</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{a.columns.code}</th>
              <th style={styles.th}>{a.columns.prize}</th>
              <th style={styles.th}>{a.columns.email}</th>
              <th style={styles.th}>{a.columns.status}</th>
              <th style={styles.th}>{a.columns.issuedAt}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((v) => (
              <tr key={v.id}>
                <td style={{ ...styles.td, fontFamily: "monospace" }}>{v.code}</td>
                <td style={styles.td}>{copy.prizes[v.kind].short}</td>
                <td style={styles.td}>{v.participant.email}</td>
                <td style={styles.td}>{a.status[v.status]}</td>
                <td style={styles.td}>{fmt.format(v.createdAt)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td style={styles.td} colSpan={5}>—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
