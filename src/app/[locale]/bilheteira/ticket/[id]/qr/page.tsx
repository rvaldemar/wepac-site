import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getLocale } from "next-intl/server";
import { getInstitutionalCopy } from "@/i18n/copy/institutional";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TicketQRPage({ params }: Props) {
  const locale = await getLocale();
  const copy = getInstitutionalCopy(locale).ticketing;
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!ticket) notFound();

  const base = process.env.APP_URL || "https://wepac.pt";
  const localePrefix = locale === "en-US" ? "/en" : "";
  const ticketUrl = `${base}${localePrefix}/bilheteira/ticket/${id}`;

  const qrSvg = await QRCode.toString(ticketUrl, {
    type: "svg",
    margin: 2,
    width: 320,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <>
      <title>QR {copy.ticket} — {ticket.event.title}</title>
      <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .ticket-qr-page {
            font-family: Inter, sans-serif;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 32px 16px;
            gap: 24px;
          }
          .event { font-size: 13px; color: #666; text-align: center; max-width: 320px; }
          .name { font-size: 18px; font-weight: 700; text-align: center; }
          .qr svg { display: block; width: 320px; height: 320px; }
          .hint { font-size: 12px; color: #999; text-align: center; max-width: 260px; line-height: 1.5; }
        `}</style>
      <div className="fixed right-4 top-4 z-[100] rounded bg-white/90 p-1 shadow print:hidden">
        <LocaleSwitcher tone="light" />
      </div>
      <main className="ticket-qr-page">
        <div className="event">{ticket.event.title}</div>
        <div className="name">{ticket.buyerName}</div>
        <div
          className="qr"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="hint">{copy.qrHint}</div>
      </main>
    </>
  );
}
