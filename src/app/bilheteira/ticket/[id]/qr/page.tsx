import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TicketQRPage({ params }: Props) {
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!ticket) notFound();

  const base = process.env.APP_URL || "https://wepac.pt";
  const ticketUrl = `${base}/bilheteira/ticket/${id}`;

  const qrSvg = await QRCode.toString(ticketUrl, {
    type: "svg",
    margin: 2,
    width: 320,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <html lang="pt">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>QR Bilhete — {ticket.event.title}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
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
      </head>
      <body>
        <div className="event">{ticket.event.title}</div>
        <div className="name">{ticket.buyerName}</div>
        <div
          className="qr"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="hint">
          Aponte a câmara do telemóvel para carregar o bilhete
        </div>
      </body>
    </html>
  );
}
