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
const APP_URL = process.env.APP_URL || "https://wepac.pt";

// ===== SHARED LIGHT TEMPLATE =====
// Table-based layout for Outlook/Gmail compatibility. Brand palette only
// (#000 / #FFF / #DEE0DB). Light theme deliberately, not the platform's
// dark UI: dark-on-dark HTML email gets remapped unpredictably by Gmail/
// Apple Mail's automatic dark-mode color injection (confirmed — the first
// dark version rendered with muddy gray dividers in real inboxes). White
// background with black text and hairline #DEE0DB dividers is the robust
// choice for transactional email.

const FONT_HEADING =
  "'Barlow', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_BODY = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Canonical WEPAC assets — see public/logo/wepac/MANIFEST.md before
// touching these. Never hand-derive a substitute (font render, pixel
// inversion, file of unknown provenance) — re-export from
// brand-assets/wepac/source/ or ask for a fresh download instead.
const WEPAC_WORDMARK = `${APP_URL}/logo/wepac/wordmark-black.png`;
const WEPACKER_LOCKUP = `${APP_URL}/logo/email/wepacker-lockup-black.png`;

interface EmailShellOptions {
  preheader: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  bodyHtml: string;
  footerHtml: string;
}

function emailShell({
  preheader,
  logoSrc,
  logoAlt,
  logoWidth,
  bodyHtml,
  footerHtml,
}: EmailShellOptions): string {
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${logoAlt}</title>
  </head>
  <body style="margin:0; padding:0; background:#FFFFFF;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;">
      <tr>
        <td align="center" style="padding: 48px 20px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">
            <tr>
              <td style="padding-bottom: 32px;">
                <img src="${logoSrc}" alt="${logoAlt}" width="${logoWidth}" style="display:block; width:${logoWidth}px; max-width:100%; height:auto; border:0;" />
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #DEE0DB;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-top: 32px; font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.7; color: #333333;">
                      ${bodyHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 40px; border-top: 1px solid #DEE0DB; margin-top: 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                  <tr>
                    <td style="font-family: ${FONT_BODY}; font-size: 12px; line-height: 1.6; color: #999999;">
                      ${footerHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 28px;"><tr><td style="background:#000000; border-radius:0;"><a href="${href}" style="display:inline-block; padding:14px 32px; font-family:${FONT_HEADING}; font-weight:700; font-size:13px; letter-spacing:0.5px; color:#FFFFFF; text-decoration:none;">${label}</a></td></tr></table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px; font-family:${FONT_HEADING}; font-weight:700; font-size:26px; line-height:1.25; color:#000000;">${text}</h1>`;
}

// WEPACKER emails header with the WEPACKER wordmark, so the footer signs
// off with the parent brand mark ("by WEPAC") instead of repeating text.
const WEPACKER_FOOTER = `<img src="${WEPAC_WORDMARK}" alt="WEPAC" width="110" style="display:block; width:110px; height:auto; border:0; margin-bottom:14px; opacity:0.8;" />From packers to WEPACkers.<br /><a href="${APP_URL}/wepacker" style="color:#999999;">wepac.pt/wepacker</a> · <a href="mailto:info@wepac.pt" style="color:#999999;">info@wepac.pt</a>`;

const WEPAC_FOOTER = `<img src="${WEPAC_WORDMARK}" alt="WEPAC" width="110" style="display:block; width:110px; height:auto; border:0; margin-bottom:14px; opacity:0.8;" /><a href="${APP_URL}" style="color:#999999;">wepac.pt</a> · <a href="mailto:info@wepac.pt" style="color:#999999;">info@wepac.pt</a>`;

// ===== WEPACKER EMAILS =====

export async function sendInviteEmail(
  to: string,
  name: string,
  inviteUrl: string
) {
  const bodyHtml = `
    ${heading("Foste convidado/a.")}
    <p style="margin:0 0 16px;">Olá ${name},</p>
    <p style="margin:0 0 16px;">
      Foste convidado/a para o WEPACKER — o caminho de desenvolvimento
      humano integral da WEPAC. Um wepacker carrega o seu próprio peso e
      ainda entrega valor à comunidade.
    </p>
    ${ctaButton(inviteUrl, "Criar conta")}
    <p style="margin:28px 0 0; font-size:12px; color:#999999;">
      Este convite expira em 7 dias. Se não esperavas este email, podes ignorá-lo.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Convite — WEPACKER | WEPAC",
    html: emailShell({
      preheader: `${name}, foste convidado/a para o WEPACKER.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const bodyHtml = `
    ${heading("Recuperar password.")}
    <p style="margin:0 0 16px;">
      Recebemos um pedido para recuperar a tua password de acesso ao WEPACKER.
    </p>
    ${ctaButton(resetUrl, "Recuperar password")}
    <p style="margin:28px 0 0; font-size:12px; color:#999999;">
      Este link expira em 1 hora. Se não pediste esta recuperação, podes ignorar este email.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Recuperar password — WEPACKER | WEPAC",
    html: emailShell({
      preheader: "Recebemos um pedido para recuperar a tua password.",
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendBetaSignupConfirmationEmail(
  name: string,
  email: string
) {
  const bodyHtml = `
    ${heading("Candidatura recebida.")}
    <p style="margin:0 0 16px;">Olá ${name},</p>
    <p style="margin:0 0 16px;">
      Recebemos a tua candidatura ao WEPACKER. A nossa equipa vai analisar
      o teu perfil e entrar em contacto em breve.
    </p>
    <p style="margin:0;">Obrigado pelo interesse. Até breve.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Candidatura recebida — WEPACKER",
    html: emailShell({
      preheader: `${name}, recebemos a tua candidatura ao WEPACKER.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendBetaSignupNotificationEmail(
  name: string,
  email: string,
  artisticArea?: string | null
) {
  const bodyHtml = `
    ${heading("Nova candidatura.")}
    <p style="margin:0 0 8px;"><strong style="color:#000000;">Nome:</strong> ${name}</p>
    <p style="margin:0 0 8px;"><strong style="color:#000000;">Email:</strong> ${email}</p>
    ${artisticArea ? `<p style="margin:0 0 8px;"><strong style="color:#000000;">Área:</strong> ${artisticArea}</p>` : ""}
    ${ctaButton(`${APP_URL}/wepacker/admin/leads`, "Ver no painel")}
  `;

  await transporter.sendMail({
    from: FROM,
    to: FROM,
    subject: `Nova candidatura WEPACKER: ${name}`,
    html: emailShell({
      preheader: `Nova candidatura de ${name}.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

// ===== WEPAC / WESSEX EMAILS =====

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

const LEAD_SOURCE_LABELS: Record<string, string> = {
  chat: "Chat Wessex",
  form: "Formulário Wessex",
  contact: "Contacto",
};

export async function sendLeadNotificationEmail(lead: LeadEmailData) {
  const details = [
    ["Nome", lead.name],
    ["Email", lead.email],
    ["Telefone", lead.phone],
    ["Tipo de evento", lead.eventType],
    ["Data do evento", lead.eventDate],
    ["Local", lead.location],
    ["Convidados", lead.guestCount?.toString()],
    ["Preferências musicais", lead.musicalPreferences],
    ["Ensemble", lead.ensemble],
    ["Orçamento estimado", lead.estimatedBudget],
    ["Notas", lead.notes],
    ["Origem", LEAD_SOURCE_LABELS[lead.source] ?? lead.source],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0; font-weight:700; color:#000000; vertical-align:top; white-space:nowrap; padding-right:16px; border-top:1px solid #DEE0DB;">${label}</td><td style="padding:10px 0; color:#333333; border-top:1px solid #DEE0DB;">${value}</td></tr>`
    )
    .join("");

  const bodyHtml = `
    ${heading("Nova lead Wessex.")}
    <p style="margin:0 0 16px; color:#666666;">
      Um potencial cliente interagiu com o assistente Wessex e deixou dados de contacto.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${details}
    </table>
    ${ctaButton(`${APP_URL}/wepacker/admin/leads`, "Ver no backoffice")}
  `;

  try {
    await transporter.sendMail({
      from: FROM,
      to: "info@wepac.pt",
      subject: `Nova lead Wessex: ${lead.name}${lead.eventType ? ` — ${lead.eventType}` : ""}`,
      html: emailShell({
        preheader: `Nova lead de ${lead.name}.`,
        logoSrc: WEPAC_WORDMARK,
        logoAlt: "WEPAC",
        logoWidth: 140,
        bodyHtml,
        footerHtml: WEPAC_FOOTER,
      }),
    });
  } catch (error) {
    console.error("Failed to send lead notification email:", error);
  }
}
