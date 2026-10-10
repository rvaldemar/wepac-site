import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/bilheteira/session";
import { GAME_CAMPAIGN } from "@/lib/bilheteira/game/prizes";

export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  // Neutralise formula injection and quote everything.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** GET /api/bilheteira/game/export — marketing-consented participants only. */
export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const rows = await prisma.gameParticipant.findMany({
    where: { campaign: GAME_CAMPAIGN, marketingConsentAt: { not: null } },
    orderBy: { marketingConsentAt: "asc" },
    select: { email: true, name: true, phone: true, locale: true, marketingConsentAt: true, consentVersion: true },
  });

  const header = ["email", "name", "phone", "locale", "consented_at", "consent_version", "campaign"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.email,
        r.name ?? "",
        r.phone ?? "",
        r.locale,
        r.marketingConsentAt?.toISOString() ?? "",
        r.consentVersion,
        GAME_CAMPAIGN,
      ].map(csvCell).join(","),
    ),
  ];
  const body = `﻿${lines.join("\r\n")}\r\n`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="roda-da-capela-marketing-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
