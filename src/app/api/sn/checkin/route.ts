import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findReservation } from "@/lib/sem-nome/reserved-seats";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const serial = Number.isFinite(body?.serial) ? Math.floor(body.serial) : null;
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!pin || pin !== process.env.SN_PORTA_PIN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!token && serial === null) {
    return NextResponse.json(
      { error: "token or serial required" },
      { status: 400 }
    );
  }

  const ticket = token
    ? await prisma.semNomeTicket.findUnique({ where: { id: token } })
    : await prisma.semNomeTicket.findUnique({ where: { serial: serial! } });
  if (!ticket) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const reservation = findReservation(ticket.name);
  const reservationJson = reservation
    ? {
        name: reservation.name,
        role: reservation.role,
        org: reservation.org,
      }
    : null;

  if (ticket.checkedInAt) {
    return NextResponse.json({
      alreadyCheckedIn: true,
      token: ticket.id,
      serialCode: `SN-${String(ticket.serial).padStart(3, "0")}`,
      name: ticket.name,
      seats: ticket.seats,
      checkedInAt: ticket.checkedInAt.toISOString(),
      reservation: reservationJson,
    });
  }

  const updated = await prisma.semNomeTicket.update({
    where: { id: ticket.id },
    data: { checkedInAt: new Date() },
  });

  return NextResponse.json({
    alreadyCheckedIn: false,
    token: updated.id,
    serialCode: `SN-${String(updated.serial).padStart(3, "0")}`,
    name: updated.name,
    seats: updated.seats,
    checkedInAt: updated.checkedInAt!.toISOString(),
    reservation: reservationJson,
  });
}
