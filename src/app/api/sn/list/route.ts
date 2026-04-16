import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-sn-admin-key");
  if (!adminKey || adminKey !== process.env.SN_ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.semNomeTicket.findMany({
    orderBy: { serial: "asc" },
  });

  const base = process.env.APP_URL || "https://wepac.pt";

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      token: t.id,
      serial: t.serial,
      serialCode: `SN-${String(t.serial).padStart(3, "0")}`,
      name: t.name,
      seats: t.seats,
      createdAt: t.createdAt.toISOString(),
      checkedInAt: t.checkedInAt?.toISOString() ?? null,
      url: `${base}/bilhete/${t.id}`,
    })),
    totals: {
      count: tickets.length,
      seats: tickets.reduce((s, t) => s + t.seats, 0),
      checkedInCount: tickets.filter((t) => t.checkedInAt).length,
      checkedInSeats: tickets
        .filter((t) => t.checkedInAt)
        .reduce((s, t) => s + t.seats, 0),
    },
  });
}
