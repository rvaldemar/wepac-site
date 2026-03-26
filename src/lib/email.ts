import nodemailer from "nodemailer";

const hasAuth = process.env.SMTP_USER && process.env.SMTP_PASSWORD;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.eu",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: hasAuth ? true : false,
  ...(hasAuth
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
    : { tls: { rejectUnauthorized: false } }),
});

const FROM = process.env.SMTP_FROM || "info@wepac.pt";

export async function sendInviteEmail(
  to: string,
  name: string,
  inviteUrl: string
) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Convite — Artista Alpha | WEPAC",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: Barlow, sans-serif; font-size: 24px; font-weight: 700; color: #000;">Artista Alpha</h1>
        <p style="margin-top: 20px; color: #333; line-height: 1.6;">
          Ola ${name},
        </p>
        <p style="color: #333; line-height: 1.6;">
          Foste convidado/a para participar no programa Artista Alpha da WEPAC — Companhia de Artes.
        </p>
        <p style="margin-top: 24px;">
          <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Criar conta
          </a>
        </p>
        <p style="margin-top: 24px; color: #999; font-size: 12px;">
          Este convite expira em 7 dias. Se nao esperavas este email, podes ignora-lo.
        </p>
        <p style="margin-top: 32px; color: #999; font-size: 12px;">
          WEPAC — Companhia de Artes
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Recuperar password — Artista Alpha | WEPAC",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: Barlow, sans-serif; font-size: 24px; font-weight: 700; color: #000;">Artista Alpha</h1>
        <p style="margin-top: 20px; color: #333; line-height: 1.6;">
          Recebemos um pedido para recuperar a tua password.
        </p>
        <p style="margin-top: 24px;">
          <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Recuperar password
          </a>
        </p>
        <p style="margin-top: 24px; color: #999; font-size: 12px;">
          Este link expira em 1 hora. Se nao pediste esta recuperacao, podes ignorar este email.
        </p>
      </div>
    `,
  });
}

interface LeadEmailData {
  name: string;
  email?: string | null;
  phone?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  location?: string | null;
  guestCount?: number | null;
  musicalPreferences?: string | null;
  ensemble?: string | null;
  estimatedBudget?: string | null;
  notes?: string | null;
  source: string;
}

export async function sendLeadNotificationEmail(lead: LeadEmailData) {
  const details = [
    ["Nome", lead.name],
    ["Email", lead.email],
    ["Telefone", lead.phone],
    ["Tipo de evento", lead.eventType],
    ["Data do evento", lead.eventDate],
    ["Local", lead.location],
    ["Convidados", lead.guestCount?.toString()],
    ["Preferencias musicais", lead.musicalPreferences],
    ["Ensemble", lead.ensemble],
    ["Orcamento estimado", lead.estimatedBudget],
    ["Notas", lead.notes],
    ["Origem", lead.source === "chat" ? "Chat Wessex" : "Formulario"],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:700;color:#000;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:8px 12px;color:#333;">${value}</td></tr>`
    )
    .join("");

  try {
    await transporter.sendMail({
      from: FROM,
      to: "info@wepac.pt",
      subject: `Nova lead Wessex: ${lead.name}${lead.eventType ? ` — ${lead.eventType}` : ""}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-family: Barlow, sans-serif; font-size: 24px; font-weight: 700; color: #000;">
            Nova Lead Wessex
          </h1>
          <p style="margin-top: 16px; color: #666; font-size: 14px;">
            Um potencial cliente interagiu com o assistente Wessex e deixou dados de contacto.
          </p>
          <table style="margin-top: 24px; border-collapse: collapse; width: 100%; font-size: 14px;">
            ${details}
          </table>
          <p style="margin-top: 32px;">
            <a href="https://wepac.pt/artists/alpha/admin/leads" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Ver no backoffice
            </a>
          </p>
          <p style="margin-top: 32px; color: #999; font-size: 12px;">
            WEPAC — Companhia de Artes | Wessex Lead Management
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send lead notification email:", error);
  }
}
