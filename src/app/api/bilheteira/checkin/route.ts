import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/bilheteira/session";

function serialToId(serial: string): string | null {
  // Accepts "BT-001", "001", "1", or a raw cuid ticket id
  const stripped = serial.trim().replace(/^BT-?/i, "");
  const num = parseInt(stripped, 10);
  if (!isNaN(num)) return String(num); // return the numeric serial for lookup
  return null;
}

// GET /api/bilheteira/checkin?ticketId=<id-or-serial>
export async function GET(req: NextRequest) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const raw = req.nextUrl.searchParams.get("ticketId") || "";

  let ticket = await prisma.ticket.findUnique({
    where: { id: raw },
    include: {
      tier: true,
      event: { select: { id: true, title: true } },
      checkLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!ticket) {
    const serial = serialToId(raw);
    if (serial !== null) {
      ticket = await prisma.ticket.findUnique({
        where: { serial: Number(serial) },
        include: {
          tier: true,
          event: { select: { id: true, title: true } },
          checkLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
    }
  }

  if (!ticket) return NextResponse.json({ error: "Bilhete não encontrado" }, { status: 404 });

  return NextResponse.json({
    id: ticket.id,
    serial: `BT-${String(ticket.serial).padStart(3, "0")}`,
    buyerName: ticket.buyerName,
    tierName: ticket.tier.name,
    seats: ticket.seats,
    status: ticket.status,
    checkedInAt: ticket.checkedInAt,
    eventTitle: ticket.event.title,
    eventId: ticket.event.id,
    checkLogs: ticket.checkLogs.map((l) => ({
      action: l.action,
      createdAt: l.createdAt,
    })),
  });
}

// POST /api/bilheteira/checkin
// body: { ticketId: string, action: "checkin" | "checkout" }
export async function POST(req: NextRequest) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ticketId, action } = body as { ticketId?: string; action?: string };

  if (!ticketId) return NextResponse.json({ error: "ticketId obrigatório" }, { status: 400 });
  if (action !== "checkin" && action !== "checkout") {
    return NextResponse.json({ error: "action deve ser 'checkin' ou 'checkout'" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { tier: true, event: { select: { id: true, title: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Bilhete não encontrado" }, { status: 404 });

  if (action === "checkin") {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { checkedInAt: new Date(), status: "checked_in" },
    });
  } else {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { checkedInAt: null, status: "pending" },
    });
  }

  await prisma.ticketCheckLog.create({
    data: { ticketId, action, adminId: admin.id },
  });

  const updated = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      tier: true,
      checkLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return NextResponse.json({
    id: updated!.id,
    serial: `BT-${String(updated!.serial).padStart(3, "0")}`,
    buyerName: updated!.buyerName,
    tierName: updated!.tier.name,
    seats: updated!.seats,
    status: updated!.status,
    checkedInAt: updated!.checkedInAt,
    checkLogs: updated!.checkLogs.map((l) => ({
      action: l.action,
      createdAt: l.createdAt,
    })),
  });
}
