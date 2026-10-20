import {
  emailTransporter as transporter,
  escapeEmailHtml,
  safeEmailHeaderText,
  safeEmailRecipient,
} from "@/lib/email-security";

const FROM = process.env.SMTP_FROM || "info@wepac.pt";
const TEAM_INBOX = process.env.BILHETEIRA_REQUESTS_INBOX || FROM;

type RequestEmailData = {
  to: string;
  name: string;
  eventTitle: string;
  tierName: string;
};

function shell(inner: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #000;">
      <h1 style="font-family: 'Barlow', Arial, sans-serif; font-size: 24px; font-weight: 900; margin: 0 0 24px;">
        WEPAC · Bilheteira
      </h1>
      ${inner}
      <p style="margin-top: 32px; color:#999; font-size: 11px;">WEPAC · info@wepac.pt</p>
    </div>`;
}

export async function sendRequestReceivedEmail(data: RequestEmailData): Promise<void> {
  const name = escapeEmailHtml(data.name);
  const tier = escapeEmailHtml(data.tierName);
  const event = escapeEmailHtml(data.eventTitle);
  await transporter.sendMail({
    from: FROM,
    to: safeEmailRecipient(data.to),
    subject: safeEmailHeaderText(`Pedido recebido · ${data.eventTitle} — WEPAC`),
    html: shell(`
      <p style="font-size: 15px; line-height: 1.5;">Olá ${name},</p>
      <p style="font-size: 15px; line-height: 1.5;">
        Recebemos o teu pedido de <strong>${tier}</strong> para <strong>${event}</strong>.
        A equipa da WEPAC analisa cada pedido e responde por email. Se for
        aprovado, recebes o teu bilhete nesse email.
      </p>`),
  });
}

export async function sendRequestTeamNotice(
  data: RequestEmailData & { organization: string; role: string; adminUrl: string },
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: safeEmailRecipient(TEAM_INBOX),
    subject: safeEmailHeaderText(`Novo pedido: ${data.tierName} · ${data.eventTitle}`),
    html: shell(`
      <p style="font-size: 15px; line-height: 1.5;">
        <strong>${escapeEmailHtml(data.name)}</strong> (${escapeEmailHtml(data.role)},
        ${escapeEmailHtml(data.organization)}) pediu <strong>${escapeEmailHtml(data.tierName)}</strong>
        para <strong>${escapeEmailHtml(data.eventTitle)}</strong>.
      </p>
      <p style="font-size: 15px; line-height: 1.5;">
        Rever no admin: ${escapeEmailHtml(data.adminUrl)}
      </p>`),
  });
}
