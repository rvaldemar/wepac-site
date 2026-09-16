import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const adminKey = req.headers.get("x-sn-admin-key");
  if (!adminKey || adminKey !== process.env.SN_ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const seats = Number.isFinite(body?.seats)
    ? Math.max(1, Math.min(20, Math.floor(body.seats)))
    : null;

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (seats === null) {
    return NextResponse.json({ error: "seats required" }, { status: 400 });
  }

  const existing = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ticket = await prisma.semNomeTicket.update({
    where: { id: token },
    data: { name, seats },
  });

  const serialCode = `SN-${String(ticket.serial).padStart(3, "0")}`;
  const base = process.env.APP_URL || "https://wepac.pt";

  return NextResponse.json({
    token: ticket.id,
    serial: ticket.serial,
    serialCode,
    name: ticket.name,
    seats: ticket.seats,
    url: `${base}/bilhete/${ticket.id}`,
  });
}
