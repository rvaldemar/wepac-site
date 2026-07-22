import { logSafeError } from "@/lib/wepacker/log-safe-error";
import {
  assertSafeEmailUrl,
  emailTransporter as transporter,
  escapeEmailHtml as escapeHtml,
  safeEmailHeaderText as safeHeaderText,
} from "@/lib/email-security";

const FROM = process.env.SMTP_FROM || "info@wepac.pt";
const APP_URL = assertSafeEmailUrl(
  process.env.APP_URL || "https://wepac.pt",
);

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
const WEPAC_BADGE = `${APP_URL}/logo/wepac/badge-black.png`;
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
  const safePreheader = escapeHtml(preheader);
  const safeLogoSrc = escapeHtml(assertSafeEmailUrl(logoSrc));
  const safeLogoAlt = escapeHtml(logoAlt);
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${safeLogoAlt}</title>
  </head>
  <body style="margin:0; padding:0; background:#FFFFFF;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${safePreheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;">
      <tr>
        <td align="center" style="padding: 48px 20px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">
            <tr>
              <td style="padding-bottom: 32px;">
                <img src="${safeLogoSrc}" alt="${safeLogoAlt}" width="${logoWidth}" style="display:block; width:${logoWidth}px; max-width:100%; height:auto; border:0;" />
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
  const safeHref = escapeHtml(assertSafeEmailUrl(href));
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 28px;"><tr><td style="background:#000000; border-radius:0;"><a href="${safeHref}" style="display:inline-block; padding:14px 32px; font-family:${FONT_HEADING}; font-weight:700; font-size:13px; letter-spacing:0.5px; color:#FFFFFF; text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px; font-family:${FONT_HEADING}; font-weight:700; font-size:26px; line-height:1.25; color:#000000;">${escapeHtml(text)}</h1>`;
}

// WEPACKER emails header with the WEPACKER wordmark, so the footer signs
// off with the parent brand mark ("by WEPAC") instead of repeating text.
const WEPACKER_FOOTER = `<img src="${WEPAC_BADGE}" alt="WEPAC" width="90" style="display:block; width:90px; height:auto; border:0; margin-bottom:14px;" />From packers to WEPACkers.<br /><a href="${APP_URL}/wepacker" style="color:#999999;">wepac.pt/wepacker</a> · <a href="mailto:info@wepac.pt" style="color:#999999;">info@wepac.pt</a>`;

const WEPAC_FOOTER = `<img src="${WEPAC_BADGE}" alt="WEPAC" width="90" style="display:block; width:90px; height:auto; border:0; margin-bottom:14px;" /><a href="${APP_URL}" style="color:#999999;">wepac.pt</a> · <a href="mailto:info@wepac.pt" style="color:#999999;">info@wepac.pt</a>`;

// ===== WEPACKER EMAILS =====

export async function sendInviteEmail(
  to: string,
  name: string,
  inviteUrl: string,
  message?: string
) {
  const safeName = escapeHtml(name);
  const personalMessage = message?.trim()
    ? `<p style="margin:0 0 16px; padding:16px; border-left:2px solid #000000; background:#F7F7F5; font-style:italic; color:#333333;">${escapeHtml(
        message.trim()
      ).replace(/\n/g, "<br />")}</p>`
    : "";

  const bodyHtml = `
    ${heading("Foste convidado/a.")}
    <p style="margin:0 0 16px;">Olá ${safeName},</p>
    <p style="margin:0 0 16px;">
      Foste convidado/a para o WEPACKER — o caminho de desenvolvimento
      humano integral da WEPAC. Um wepacker carrega o seu próprio peso e
      ainda entrega valor à comunidade.
    </p>
    ${personalMessage}
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

export async function sendMentorshipInvitationEmail({
  to,
  recipientName,
  mentorName,
}: {
  to: string;
  recipientName: string;
  mentorName: string;
}) {
  const mentorshipsUrl = `${APP_URL}/wepacker/mentorships`;
  const safeRecipientName = escapeHtml(recipientName);
  const safeMentorName = escapeHtml(mentorName);
  const bodyHtml = `
    ${heading("Mentorship invitation.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      ${safeMentorName} convidou-te para uma relação de Mentorship na WEPACKER.
      A relação só fica ativa depois da tua aceitação.
    </p>
    <p style="margin:0 0 16px; color:#666666;">
      Nesta primeira fase, uma Mentorship ativa permite apenas descobrir a outra
      pessoa e propor Sessions. Não abre o teu Life Map, Trails, Goals, Actions
      ou artefactos privados de uma Session.
    </p>
    ${ctaButton(mentorshipsUrl, "Review invitation")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Mentorship invitation — WEPACKER",
    html: emailShell({
      preheader: `${mentorName} convidou-te para uma Mentorship.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendMentorshipAcceptedEmail({
  to,
  recipientName,
  menteeName,
}: {
  to: string;
  recipientName: string;
  menteeName: string;
}) {
  const sessionsUrl = `${APP_URL}/wepacker/mentor/sessions`;
  const safeRecipientName = escapeHtml(recipientName);
  const safeMenteeName = escapeHtml(menteeName);
  const bodyHtml = `
    ${heading("Mentorship accepted.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      ${safeMenteeName} aceitou a tua invitation. Já podes propor uma Session
      sem criar um Cycle Enrollment ou Pack Membership.
    </p>
    ${ctaButton(sessionsUrl, "Schedule Session")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Mentorship accepted — WEPACKER",
    html: emailShell({
      preheader: `${menteeName} aceitou a tua Mentorship invitation.`,
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
  const safeName = escapeHtml(name);
  const bodyHtml = `
    ${heading("Candidatura recebida.")}
    <p style="margin:0 0 16px;">Olá ${safeName},</p>
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
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeArtisticArea = artisticArea ? escapeHtml(artisticArea) : null;
  const bodyHtml = `
    ${heading("Nova candidatura.")}
    <p style="margin:0 0 8px;"><strong style="color:#000000;">Nome:</strong> ${safeName}</p>
    <p style="margin:0 0 8px;"><strong style="color:#000000;">Email:</strong> ${safeEmail}</p>
    ${safeArtisticArea ? `<p style="margin:0 0 8px;"><strong style="color:#000000;">Área:</strong> ${safeArtisticArea}</p>` : ""}
    ${ctaButton(`${APP_URL}/wepacker/admin/leads`, "Ver no painel")}
  `;

  await transporter.sendMail({
    from: FROM,
    to: FROM,
    subject: safeHeaderText(`Nova candidatura WEPACKER: ${name}`),
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

// ===== WEPACKER SESSION CALENDAR INVITES =====

const LISBON_TZ = "Europe/Lisbon";

// Sessions happen on WEPAC's own clock (Portugal) regardless of the
// recipient's browser locale — same convention as the bilheteira module.
function formatSessionDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: LISBON_TZ,
  }).format(date);
}

interface SessionCalendarEmailParams {
  to: string;
  recipientName: string;
  kindLabel: string;
  scheduledAt: Date;
  meetingUrl?: string | null;
  ics: string;
}

// One session update = one invite email with the .ics attached as
// text/calendar; method=REQUEST, which calendar clients (Gmail, Outlook,
// Apple Mail) recognize as "add/update this event" rather than a generic
// attachment. Reused for both the initial createSession invite and any
// updateSession reschedule — the UID inside the ics is what tells the
// client to replace the prior version instead of duplicating it.
export async function sendSessionInviteEmail({
  to,
  recipientName,
  kindLabel,
  scheduledAt,
  meetingUrl,
  ics,
}: SessionCalendarEmailParams) {
  const when = formatSessionDateTime(scheduledAt);
  const safeRecipientName = escapeHtml(recipientName);
  const safeKindLabel = escapeHtml(kindLabel);
  const safeWhen = escapeHtml(when);
  const bodyHtml = `
    ${heading("Session scheduled.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      Tens uma Session WEPACKER (${safeKindLabel}) marcada para
      <strong style="color:#000000;">${safeWhen}</strong>.
    </p>
    ${meetingUrl ? ctaButton(meetingUrl, "Join Session") : ""}
    <p style="margin:28px 0 0; font-size:12px; color:#999999;">
      Convite de calendário em anexo — aceita para adicionar à tua agenda.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: safeHeaderText(`Session scheduled — ${kindLabel} | WEPACKER`),
    html: emailShell({
      preheader: `Session WEPACKER (${kindLabel}) marcada para ${when}.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
    icalEvent: {
      method: "REQUEST",
      filename: "sessao-wepacker.ics",
      content: ics,
    },
  });
}

// Cancellation counterpart — same UID, METHOD:CANCEL, which is what
// makes calendar clients remove the event instead of leaving a stale
// entry on the recipient's agenda.
export async function sendSessionCancelEmail({
  to,
  recipientName,
  kindLabel,
  scheduledAt,
  ics,
}: SessionCalendarEmailParams) {
  const when = formatSessionDateTime(scheduledAt);
  const safeRecipientName = escapeHtml(recipientName);
  const safeKindLabel = escapeHtml(kindLabel);
  const safeWhen = escapeHtml(when);
  const bodyHtml = `
    ${heading("Session cancelled.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      A Session WEPACKER (${safeKindLabel}) marcada para
      <strong style="color:#000000;">${safeWhen}</strong> foi cancelada.
    </p>
    <p style="margin:28px 0 0; font-size:12px; color:#999999;">
      O evento foi removido da tua agenda.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: safeHeaderText(`Session cancelled — ${kindLabel} | WEPACKER`),
    html: emailShell({
      preheader: `Session WEPACKER (${kindLabel}) cancelada.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
    icalEvent: {
      method: "CANCEL",
      filename: "sessao-wepacker.ics",
      content: ics,
    },
  });
}

// ===== WEPACKER MEMBER NOTIFICATIONS =====
// Member-facing templates for events initiated by a Session organizer or a
// peer. The durable outbox reauthorizes the exact resource before calling
// these renderers; domain actions never invoke SMTP inside their transaction.

export async function sendSessionFollowupUpdatedEmail({
  to,
  recipientName,
}: {
  to: string;
  recipientName: string;
}) {
  const sessionsUrl = `${APP_URL}/wepacker/sessions`;
  const safeRecipientName = escapeHtml(recipientName);
  const bodyHtml = `
    ${heading("Follow-up da tua Session atualizado.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      O organizador atualizou informação de follow-up visível para ti numa
      Session recente.
    </p>
    ${ctaButton(sessionsUrl, "View Session")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Session follow-up updated — WEPACKER",
    html: emailShell({
      preheader: `${recipientName}, o follow-up da tua Session foi atualizado.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendNewMessageEmail({
  to,
  recipientName,
  senderName,
}: {
  to: string;
  recipientName: string;
  senderName: string;
}) {
  const messagesUrl = `${APP_URL}/wepacker/messages`;
  const safeRecipientName = escapeHtml(recipientName);
  const bodyHtml = `
    ${heading("Nova mensagem.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      Recebeste uma nova mensagem de
      <strong style="color:#000000;">${escapeHtml(senderName)}</strong>.
    </p>
    ${ctaButton(messagesUrl, "Ver mensagem")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: safeHeaderText(`Nova mensagem de ${senderName} — WEPACKER`),
    html: emailShell({
      preheader: `${recipientName}, recebeste uma nova mensagem de ${senderName}.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendPackInvitationEmail({
  to,
  recipientName,
  ownerName,
}: {
  to: string;
  recipientName: string;
  ownerName: string;
}) {
  const safeRecipientName = escapeHtml(recipientName);
  const safeOwnerName = escapeHtml(ownerName);
  const bodyHtml = `
    ${heading("Pack invitation.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      ${safeOwnerName} convidou-te para o seu Pack. A Pack Membership só
      fica ativa depois da tua aceitação.
    </p>
    <p style="margin:0 0 16px; color:#666666;">
      Aceitar este convite não cria uma Connection, Mentorship ou Cycle
      Enrollment e não abre My Journey.
    </p>
    ${ctaButton(`${APP_URL}/wepacker/communities`, "Review Pack invitation")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Pack invitation — WEPACKER",
    html: emailShell({
      preheader: `${ownerName} convidou-te para um Pack.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendPackAcceptedEmail({
  to,
  recipientName,
  memberName,
}: {
  to: string;
  recipientName: string;
  memberName: string;
}) {
  const safeRecipientName = escapeHtml(recipientName);
  const safeMemberName = escapeHtml(memberName);
  const bodyHtml = `
    ${heading("Pack invitation accepted.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      ${safeMemberName} aceitou o teu convite e pertence agora a My Pack.
    </p>
    ${ctaButton(`${APP_URL}/wepacker/communities`, "Open My Pack")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Pack invitation accepted — WEPACKER",
    html: emailShell({
      preheader: `${memberName} aceitou o teu convite para My Pack.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendConnectionRequestEmail({
  to,
  recipientName,
  requesterName,
}: {
  to: string;
  recipientName: string;
  requesterName: string;
}) {
  const safeRecipientName = escapeHtml(recipientName);
  const safeRequesterName = escapeHtml(requesterName);
  const bodyHtml = `
    ${heading("Connection request.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      ${safeRequesterName} enviou-te um pedido de Connection. A relação só
      fica ativa depois da tua aceitação.
    </p>
    <p style="margin:0 0 16px; color:#666666;">
      Uma Connection não abre Life Map, Trails, Goals, Actions ou outros dados
      de My Journey.
    </p>
    ${ctaButton(`${APP_URL}/wepacker/connections`, "Review Connection request")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Connection request — WEPACKER",
    html: emailShell({
      preheader: `${requesterName} enviou-te um pedido de Connection.`,
      logoSrc: WEPACKER_LOCKUP,
      logoAlt: "WEPACKER",
      logoWidth: 220,
      bodyHtml,
      footerHtml: WEPACKER_FOOTER,
    }),
  });
}

export async function sendConnectionAcceptedEmail({
  to,
  recipientName,
  personName,
}: {
  to: string;
  recipientName: string;
  personName: string;
}) {
  const safeRecipientName = escapeHtml(recipientName);
  const safePersonName = escapeHtml(personName);
  const bodyHtml = `
    ${heading("Connection accepted.")}
    <p style="margin:0 0 16px;">Olá ${safeRecipientName},</p>
    <p style="margin:0 0 16px;">
      ${safePersonName} aceitou o teu pedido de Connection.
    </p>
    ${ctaButton(`${APP_URL}/wepacker/connections`, "Open Connections")}
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Connection accepted — WEPACKER",
    html: emailShell({
      preheader: `${personName} aceitou o teu pedido de Connection.`,
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
        `<tr><td style="padding:10px 0; font-weight:700; color:#000000; vertical-align:top; white-space:nowrap; padding-right:16px; border-top:1px solid #DEE0DB;">${escapeHtml(String(label))}</td><td style="padding:10px 0; color:#333333; border-top:1px solid #DEE0DB;">${escapeHtml(String(value))}</td></tr>`
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
      subject: safeHeaderText(
        `Nova lead Wessex: ${lead.name}${lead.eventType ? ` — ${lead.eventType}` : ""}`,
      ),
      html: emailShell({
        preheader: `Nova lead de ${lead.name}.`,
        logoSrc: WEPAC_BADGE,
        logoAlt: "WEPAC",
        logoWidth: 140,
        bodyHtml,
        footerHtml: WEPAC_FOOTER,
      }),
    });
  } catch (error) {
    console.error(
      "[wessex lead email] delivery_failed",
      logSafeError(error),
    );
  }
}
