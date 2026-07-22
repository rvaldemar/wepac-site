import {
  assertSafeEmailUrl,
  emailTransporter as transporter,
  escapeEmailHtml,
  safeEmailHeaderText,
  safeEmailRecipient,
} from "@/lib/email-security";

const FROM = process.env.SMTP_FROM || "info@wepac.pt";

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  const euros = cents / 100;
  return euros % 1 === 0
    ? `${euros.toFixed(0)} €`
    : `${euros.toFixed(2).replace(".", ",")} €`;
}

const LISBON_TZ = "Europe/Lisbon";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON_TZ,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

type TicketEmailData = {
  to: string;
  buyerName: string;
  eventTitle: string;
  eventSubtitle?: string | null;
  startsAt: Date;
  venue: string;
  tierName: string;
  priceCents: number;
  seats: number;
  ticketId: string;
  coverImage?: string | null;
};

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
) {
  const safeName = escapeEmailHtml(name);
  const safeVerifyUrl = escapeEmailHtml(assertSafeEmailUrl(verifyUrl));
  await transporter.sendMail({
    from: FROM,
    to: safeEmailRecipient(to),
    subject: "Confirma o teu email — Bilheteira WEPAC",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #000;">
        <h1 style="font-family: 'Barlow', Arial, sans-serif; font-size: 24px; font-weight: 900; margin: 0 0 4px;">
          WEPAC · Bilheteira
        </h1>
        <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #666; margin: 0 0 24px;">
          Confirmação de email
        </p>
        <p style="font-size: 15px; line-height: 1.5;">Olá ${safeName},</p>
        <p style="font-size: 15px; line-height: 1.5;">
          Para activares a tua conta de administrador da Bilheteira WEPAC,
          confirma o teu email clicando no botão abaixo.
        </p>
        <p style="margin-top: 28px;">
          <a href="${safeVerifyUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-family:'Barlow',Arial,sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:13px;">
            Confirmar email
          </a>
        </p>
        <p style="margin-top: 24px; color:#666; font-size: 12px;">
          Este link expira em 24 horas. Se não foste tu, podes ignorar este
          email.
        </p>
        <p style="margin-top: 32px; color:#999; font-size: 11px;">
          WEPAC · info@wepac.pt
        </p>
      </div>
    `,
  });
}

export async function sendTicketEmail(data: TicketEmailData) {
  const base = assertSafeEmailUrl(process.env.APP_URL || "https://wepac.pt");
  const url = assertSafeEmailUrl(
    new URL(`/bilheteira/ticket/${encodeURIComponent(data.ticketId)}`, base).toString(),
  );
  const coverSrc = data.coverImage
    ? assertSafeEmailUrl(new URL(data.coverImage, base).toString())
    : null;
  const safeBuyerName = escapeEmailHtml(data.buyerName);
  const safeEventTitle = escapeEmailHtml(data.eventTitle);
  const safeEventSubtitle = data.eventSubtitle
    ? escapeEmailHtml(data.eventSubtitle)
    : null;
  const safeVenue = escapeEmailHtml(data.venue);
  const safeTierName = escapeEmailHtml(data.tierName);
  const coverBlock = coverSrc
    ? `<img src="${escapeEmailHtml(coverSrc)}" alt="${safeEventTitle}" style="display:block;width:100%;max-width:560px;height:auto;margin-bottom:24px;" />`
    : "";
  const paymentNote =
    data.priceCents > 0
      ? `<p style="font-size:13px;color:#666;margin-top:8px;">Total pago: <strong>${formatPrice(data.priceCents * data.seats)}</strong>. Isento de IVA ao abrigo do art.º 9.º do CIVA.</p>`
      : "";

  await transporter.sendMail({
    from: FROM,
    to: safeEmailRecipient(data.to),
    subject: safeEmailHeaderText(`Bilhete · ${data.eventTitle} — WEPAC`),
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #000;">
        ${coverBlock}
        <h1 style="font-family: 'Barlow', Arial, sans-serif; font-size: 24px; font-weight: 900; margin: 0 0 4px;">
          WEPAC · Bilheteira
        </h1>
        <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #666; margin: 0 0 24px;">
          Confirmação de reserva
        </p>
        <p style="font-size: 15px; line-height: 1.5;">
          Olá ${safeBuyerName},
        </p>
        <p style="font-size: 15px; line-height: 1.5;">
          A tua reserva está confirmada. Apresenta este bilhete à entrada.
        </p>
        <div style="margin-top: 24px; padding: 20px; background: #fafaf7; border: 1px solid #e5e3de;">
          <div style="font-family:'Barlow', Arial, sans-serif; font-weight: 900; font-size: 22px; letter-spacing: -0.4px;">
            ${safeEventTitle}
          </div>
          ${safeEventSubtitle ? `<div style="font-size:14px;color:#444;margin-top:4px;">${safeEventSubtitle}</div>` : ""}
          <table style="margin-top: 16px; font-size: 14px;">
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Data</td><td>${formatDate(data.startsAt)} · ${formatTime(data.startsAt)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Local</td><td>${safeVenue}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Tier</td><td><strong>${safeTierName}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Lugares</td><td>${data.seats}</td></tr>
          </table>
          ${paymentNote}
        </div>
        <p style="margin-top: 28px;">
          <a href="${escapeEmailHtml(url)}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-family:'Barlow',Arial,sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:13px;">
            Ver bilhete
          </a>
        </p>
        <p style="margin-top: 32px; color:#999; font-size: 11px;">
          WEPAC · info@wepac.pt
        </p>
      </div>
    `,
  });
}
