import type { PrizeKind } from "@prisma/client";
import {
  assertSafeEmailUrl,
  emailTransporter as transporter,
  escapeEmailHtml,
  safeEmailHeaderText,
  safeEmailRecipient,
} from "@/lib/email-security";
import { getGameCopy } from "@/i18n/copy/institutional-game";
import { unsubscribeUrl } from "./unsubscribe-token";

const FROM = process.env.SMTP_FROM || "info@wepac.pt";

function formatDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export type VoucherEmailData = {
  to: string;
  name: string | null;
  kind: PrizeKind;
  code: string;
  validUntil: Date;
  locale: string;
  participantId: string;
};

export async function sendVoucherEmail(data: VoucherEmailData): Promise<void> {
  const copy = getGameCopy(data.locale);
  const prize = copy.prizes[data.kind];
  const e = copy.email_;
  const validUntil = formatDate(data.validUntil, data.locale);
  const unsubscribe = unsubscribeUrl(data.participantId);
  const safeUnsubscribe = escapeEmailHtml(assertSafeEmailUrl(unsubscribe));

  const text = [
    e.greeting(data.name ?? ""),
    "",
    e.intro,
    prize.title,
    prize.description,
    "",
    `${e.codeLabel}: ${data.code}`,
    `${e.validUntil}: ${validUntil}`,
    "",
    prize.rules,
    e.howTo,
    "",
    e.footer,
    e.marketingNote,
    unsubscribe,
  ].join("\n");

  const html = `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0B0A09;color:#F0EDE6;padding:40px 32px">
  <p style="margin:0 0 24px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#DC4A32">${escapeEmailHtml(copy.brand)}</p>
  <p style="margin:0 0 16px;font-size:16px">${escapeEmailHtml(e.greeting(data.name ?? ""))}</p>
  <p style="margin:0 0 8px;font-size:16px">${escapeEmailHtml(e.intro)}</p>
  <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:28px;line-height:1.15;color:#F0EDE6">${escapeEmailHtml(prize.title)}</h1>
  <p style="margin:0 0 28px;font-size:15px;color:#DEE0DB">${escapeEmailHtml(prize.description)}</p>
  <div style="border:1px solid #DC4A32;padding:20px 24px;margin:0 0 28px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#DEE0DB">${escapeEmailHtml(e.codeLabel)}</p>
    <p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:30px;letter-spacing:.08em;font-weight:700;color:#F0EDE6">${escapeEmailHtml(data.code)}</p>
    <p style="margin:0;font-size:13px;color:#DEE0DB">${escapeEmailHtml(e.validUntil)} ${escapeEmailHtml(validUntil)}</p>
  </div>
  <p style="margin:0 0 8px;font-size:13px;color:#DEE0DB">${escapeEmailHtml(prize.rules)}</p>
  <p style="margin:0 0 32px;font-size:13px;color:#DEE0DB">${escapeEmailHtml(e.howTo)}</p>
  <p style="margin:0 0 6px;font-size:12px;color:#999">${escapeEmailHtml(e.footer)}</p>
  <p style="margin:0 0 6px;font-size:11px;color:#777">${escapeEmailHtml(e.marketingNote)}</p>
  <p style="margin:0;font-size:11px"><a href="${safeUnsubscribe}" style="color:#999">${escapeEmailHtml(e.unsubscribe)}</a></p>
</div>`;

  await transporter.sendMail({
    from: FROM,
    to: safeEmailRecipient(data.to),
    subject: safeEmailHeaderText(e.subject(prize.title)),
    text,
    html,
  });
}
