import {
  assertSafeEmailUrl,
  emailTransporter as transporter,
  escapeEmailHtml,
  safeEmailHeaderText,
  safeEmailRecipient,
} from "@/lib/email-security";
import { mergeText, mergeUrl, type EmailMergeValues } from "./email-merge";

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

export type TicketEmailData = {
  to: string;
  buyerName: string;
  eventTitle: string;
  eventSubtitle?: string | null;
  startsAt: Date;
  venue: string;
  tierName: string;
  // Total actually charged for the order (bundles and groups are not
  // price × seats). Optional for legacy callers.
  totalCents?: number;
  priceCents: number;
  seats: number;
  ticketId: string;
  ticketSerial?: number | null;
  coverImage?: string | null;
  // Configurable extras (event-wide note, tier note, tier CTA). Merge fields
  // are resolved here with the buyer's data.
  eventEmailNote?: string | null;
  tierEmailNote?: string | null;
  emailCtaLabel?: string | null;
  emailCtaUrl?: string | null;
};

type TicketEmailSource = {
  ticket: { id: string; serial: number; buyerName: string; buyerEmail: string; seats: number; priceCents: number };
  event: {
    title: string;
    subtitle: string | null;
    startsAt: Date;
    venue: string;
    coverImage: string | null;
    emailNote: string | null;
  };
  tier: {
    name: string;
    priceCents: number;
    emailNote: string | null;
    emailCtaLabel: string | null;
    emailCtaUrl: string | null;
  };
};

export function ticketEmailData({ ticket, event, tier }: TicketEmailSource): TicketEmailData {
  return {
    to: ticket.buyerEmail,
    buyerName: ticket.buyerName,
    eventTitle: event.title,
    eventSubtitle: event.subtitle,
    startsAt: event.startsAt,
    venue: event.venue,
    tierName: tier.name,
    priceCents: tier.priceCents,
    // Ticket.priceCents is the effective price per seat (total / seats).
    totalCents: ticket.priceCents * ticket.seats,
    seats: ticket.seats,
    ticketId: ticket.id,
    ticketSerial: ticket.serial,
    coverImage: event.coverImage,
    eventEmailNote: event.emailNote,
    tierEmailNote: tier.emailNote,
    emailCtaLabel: tier.emailCtaLabel,
    emailCtaUrl: tier.emailCtaUrl,
  };
}

function mergeValues(data: TicketEmailData): EmailMergeValues {
  return {
    nome: data.buyerName,
    email: data.to,
    bilhete: data.ticketSerial != null ? String(data.ticketSerial) : data.ticketId,
    evento: data.eventTitle,
    tipo: data.tierName,
    lugares: String(data.seats),
  };
}

function noteHtml(note: string, values: EmailMergeValues): string {
  return mergeText(note, values)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;">${escapeEmailHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function extrasHtml(data: TicketEmailData): string {
  const values = mergeValues(data);
  const notes = [data.tierEmailNote, data.eventEmailNote]
    .filter((n): n is string => Boolean(n && n.trim()))
    .map((n) => noteHtml(n, values))
    .join("");
  let cta = "";
  if (data.emailCtaUrl && data.emailCtaLabel) {
    let href: string | null = null;
    try {
      href = assertSafeEmailUrl(mergeUrl(data.emailCtaUrl, values));
    } catch {
      href = null;
    }
    if (href) {
      cta = `<p style="margin-top: 16px;"><a href="${escapeEmailHtml(href)}" style="display:inline-block;background:#fff;color:#000;border:1px solid #000;padding:12px 24px;text-decoration:none;font-family:'Barlow',Arial,sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:12px;">${escapeEmailHtml(data.emailCtaLabel)}</a></p>`;
    }
  }
  if (!notes && !cta) return "";
  return `<div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e3de;">${notes}${cta}</div>`;
}

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

export function renderTicketEmail(data: TicketEmailData): { subject: string; html: string } {
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
  const totalCents = data.totalCents ?? data.priceCents * data.seats;
  const paymentNote =
    totalCents > 0
      ? `<p style="font-size:13px;color:#666;margin-top:8px;">Total pago: <strong>${formatPrice(totalCents)}</strong>. Isento de IVA ao abrigo do art.º 9.º do CIVA.</p>`
      : "";
  const serialRow =
    data.ticketSerial != null
      ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Bilhete n.º</td><td>${data.ticketSerial}</td></tr>`
      : "";

  return {
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
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Bilhete</td><td><strong>${safeTierName}</strong></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Lugares</td><td>${data.seats}</td></tr>
            ${serialRow}
          </table>
          ${paymentNote}
        </div>
        <p style="margin-top: 28px;">
          <a href="${escapeEmailHtml(url)}" style="display:inline-block;background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-family:'Barlow',Arial,sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:13px;">
            Ver bilhete
          </a>
        </p>
        ${extrasHtml(data)}
        <p style="margin-top: 32px; color:#999; font-size: 11px;">
          WEPAC · info@wepac.pt
        </p>
      </div>
    `,
  };
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { subject, html } = renderTicketEmail(data);
  await transporter.sendMail({
    from: FROM,
    to: safeEmailRecipient(data.to),
    subject: safeEmailHeaderText(subject),
    html,
  });
}
