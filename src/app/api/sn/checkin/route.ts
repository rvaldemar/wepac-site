import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!pin || pin !== process.env.SN_PORTA_PIN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const ticket = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!ticket) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (ticket.checkedInAt) {
    return NextResponse.json({
      alreadyCheckedIn: true,
      token: ticket.id,
      serialCode: `SN-${String(ticket.serial).padStart(3, "0")}`,
      name: ticket.name,
      seats: ticket.seats,
      checkedInAt: ticket.checkedInAt.toISOString(),
    });
  }

  const updated = await prisma.semNomeTicket.update({
    where: { id: token },
    data: { checkedInAt: new Date() },
  });

  return NextResponse.json({
    alreadyCheckedIn: false,
    token: updated.id,
    serialCode: `SN-${String(updated.serial).padStart(3, "0")}`,
    name: updated.name,
    seats: updated.seats,
    checkedInAt: updated.checkedInAt!.toISOString(),
  });
}
