import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { TicketView } from "./ticket-view";
import { getLocale } from "next-intl/server";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const { token } = await params;
  const ticket = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!ticket) return { title: copy.ticketFallbackTitle };
  return {
    title: `${copy.ticket} · Jotta Pê · Sem Nome — WEPAC`,
    description: copy.semNomeDescription,
  };
}

export default async function BilhetePage({ params }: Params) {
  const locale = await getLocale();
  const { token } = await params;
  const ticket = await prisma.semNomeTicket.findUnique({ where: { id: token } });
  if (!ticket) notFound();

  const base = process.env.APP_URL || "https://wepac.pt";
  const localePrefix = locale === "en-US" ? "/en" : "";
  const ticketUrl = `${base}${localePrefix}/bilhete/${ticket.id}`;
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
