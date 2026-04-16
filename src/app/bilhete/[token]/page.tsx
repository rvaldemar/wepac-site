import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { TicketView } from "./ticket-view";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params) {
  const { token } = await params;
  const ticket = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!ticket) return { title: "Bilhete — WEPAC" };
  return {
    title: `Bilhete · Jotta Pê · Sem Nome — WEPAC`,
    description: `Bilhete para o concerto privado de Jotta Pê em Aquiraz, 21 de abril de 2026.`,
  };
}

export default async function BilhetePage({ params }: Params) {
  const { token } = await params;
  const ticket = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!ticket) notFound();

  const base = process.env.APP_URL || "https://wepac.pt";
  const ticketUrl = `${base}/bilhete/${ticket.id}`;
  const qrSvg = await QRCode.toString(ticketUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#000000", light: "#00000000" },
  });

  const serialCode = `SN-${String(ticket.serial).padStart(3, "0")}`;

  return (
    <TicketView
      name={ticket.name}
      seats={ticket.seats}
      serialCode={serialCode}
      qrSvg={qrSvg}
    />
  );
}
