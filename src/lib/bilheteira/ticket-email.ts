import nodemailer from "nodemailer";

const hasAuth = process.env.SMTP_USER && process.env.SMTP_PASSWORD;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.eu",
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  ...(hasAuth
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
    : { tls: { rejectUnauthorized: false } }),
});

const FROM = process.env.SMTP_FROM || "info@wepac.pt";

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  const euros = cents / 100;
  return euros % 1 === 0
    ? `${euros.toFixed(0)} €`
    : `${euros.toFixed(2).replace(".", ",")} €`;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
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
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Confirma o teu email — Bilheteira WEPAC",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #000;">
        <h1 style="font-family: 'Barlow', Arial, sans-serif; font-size: 24px; font-weight: 900; margin: 0 0 4px;">
          WEPAC · Bilheteira
        </h1>
        <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #666; margin: 0 0 24px;">
          Confirmação de email
        </p>
        <p style="font-size: 15px; line-height: 1.5;">Olá ${name},</p>
        <p style="font-size: 15px; line-height: 1.5;">
          Para activares a tua conta de administrador da Bilheteira WEPAC,
          confirma o teu email clicando no botão abaixo.
        </p>
        <p style="margin-top: 28px;">
          <a href="${verifyUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-family:'Barlow',Arial,sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:13px;">
            Confirmar email
          </a>
        </p>
        <p style="margin-top: 24px; color:#666; font-size: 12px;">
          Este link expira em 24 horas. Se não foste tu, podes ignorar este
          email.
        </p>
        <p style="margin-top: 32px; color:#999; font-size: 11px;">
          WEPAC — Companhia de Artes · info@wepac.pt
        </p>
      </div>
    `,
  });
}

export async function sendTicketEmail(data: TicketEmailData) {
  const base = process.env.APP_URL || "https://wepac.pt";
  const url = `${base}/bilheteira/ticket/${data.ticketId}`;
  const coverSrc = data.coverImage
    ? data.coverImage.startsWith("http")
      ? data.coverImage
      : `${base}${data.coverImage}`
    : null;
  const coverBlock = coverSrc
    ? `<img src="${coverSrc}" alt="${data.eventTitle}" style="display:block;width:100%;max-width:560px;height:auto;margin-bottom:24px;" />`
    : "";
  const paymentNote =
    data.priceCents > 0
      ? `<p style="font-size:13px;color:#666;margin-top:8px;">Total pago: <strong>${formatPrice(data.priceCents * data.seats)}</strong>. Isento de IVA ao abrigo do art.º 9.º do CIVA.</p>`
      : "";

  await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: `Bilhete · ${data.eventTitle} — WEPAC`,
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
          Olá ${data.buyerName},
        </p>
        <p style="font-size: 15px; line-height: 1.5;">
          A tua reserva está confirmada. Apresenta este bilhete à entrada.
        </p>
        <div style="margin-top: 24px; padding: 20px; background: #fafaf7; border: 1px solid #e5e3de;">
          <div style="font-family:'Barlow', Arial, sans-serif; font-weight: 900; font-size: 22px; letter-spacing: -0.4px;">
            ${data.eventTitle}
          </div>
          ${data.eventSubtitle ? `<div style="font-size:14px;color:#444;margin-top:4px;">${data.eventSubtitle}</div>` : ""}
          <table style="margin-top: 16px; font-size: 14px;">
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Data</td><td>${formatDate(data.startsAt)} · ${formatTime(data.startsAt)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Local</td><td>${data.venue}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Tier</td><td><strong>${data.tierName}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Lugares</td><td>${data.seats}</td></tr>
          </table>
          ${paymentNote}
        </div>
        <p style="margin-top: 28px;">
          <a href="${url}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-family:'Barlow',Arial,sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:13px;">
            Ver bilhete
          </a>
        </p>
        <p style="margin-top: 32px; color:#999; font-size: 11px;">
          WEPAC — Companhia de Artes · info@wepac.pt
        </p>
      </div>
    `,
  });
}
