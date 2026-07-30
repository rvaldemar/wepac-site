import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { TicketView } from "./ticket-view";
import { CapelaVivaTicketView } from "./capela-viva-view";
import { getLocale } from "next-intl/server";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true, tier: true },
  });
  if (!ticket) return { title: copy.ticketFallbackTitle };
  return {
    title: `${copy.ticket} · ${ticket.event.title} — WEPAC`,
    description: copy.ticketFor(ticket.tier.name, ticket.event.title),
  };
}

export default async function TicketPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const { id } = await params;
  const { welcome } = await searchParams;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        include: { brand: true, department: true },
      },
      tier: true,
    },
  });
  if (!ticket) notFound();

  const base = process.env.APP_URL || "https://wepac.pt";
  const localePrefix = locale === "en-US" ? "/en" : "";
  const ticketUrl = `${base}${localePrefix}/bilheteira/ticket/${ticket.id}`;
  const qrSvg = await QRCode.toString(ticketUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#000000", light: "#00000000" },
  });

  const serialCode = `BT-${String(ticket.serial).padStart(3, "0")}`;
  const brandName = ticket.event.brand?.name || ticket.event.department.name;

  // Brand-specific design: Capela Viva uses the C/D-style landscape ticket.
  if (ticket.event.brand?.slug === "capela-viva") {
    return (
      <CapelaVivaTicketView
        tierName={ticket.tier.name}
        buyerName={ticket.buyerName}
        seats={ticket.seats}
        priceCents={ticket.priceCents}
        serialCode={serialCode}
        qrSvg={qrSvg}
        startsAt={ticket.event.startsAt}
        doorsAt={ticket.event.doorsAt}
        venue={ticket.event.venue}
        address={ticket.event.address}
        checkedInAt={ticket.checkedInAt}
        welcome={welcome === "1"}
        coverImage={ticket.event.coverImage}
        eventTitle={ticket.event.title}
        eventSubtitle={ticket.event.subtitle}
        ticketNote={ticket.event.ticketNote}
      />
    );
  }

  return (
    <TicketView
      tierName={ticket.tier.name}
      buyerName={ticket.buyerName}
      seats={ticket.seats}
      priceCents={ticket.priceCents}
      serialCode={serialCode}
      qrSvg={qrSvg}
      eventTitle={ticket.event.title}
      eventSubtitle={ticket.event.subtitle}
      brandName={brandName}
      startsAt={ticket.event.startsAt}
      doorsAt={ticket.event.doorsAt}
      venue={ticket.event.venue}
      address={ticket.event.address}
      checkedInAt={ticket.checkedInAt}
      welcome={welcome === "1"}
      coverImage={ticket.event.coverImage}
    />
  );
}
