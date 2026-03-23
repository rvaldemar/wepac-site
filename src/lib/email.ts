import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "25"),
  secure: false,
  tls: { rejectUnauthorized: false },
});

export async function sendInviteEmail(
  to: string,
  name: string,
  inviteUrl: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "info@wepac.pt",
    to,
    subject: "Convite — Artista Alpha | WEPAC",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: Barlow, sans-serif; font-size: 24px; font-weight: 700; color: #000;">Artista Alpha</h1>
        <p style="margin-top: 20px; color: #333; line-height: 1.6;">
          Olá ${name},
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
          Este convite expira em 7 dias. Se não esperavas este email, podes ignorá-lo.
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
    from: process.env.SMTP_FROM || "info@wepac.pt",
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
          Este link expira em 1 hora. Se não pediste esta recuperação, podes ignorar este email.
        </p>
      </div>
    `,
  });
}
