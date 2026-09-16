import nodemailer from "nodemailer";

function smtpPort(): number {
  const value = Number(process.env.SMTP_PORT ?? "587");
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error("Invalid SMTP port.");
  }
  return value;
}

const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
  throw new Error("Incomplete SMTP authentication configuration.");
}

const port = smtpPort();

// Shared by every WEPAC email surface. TLS certificate verification stays on;
// an unauthenticated local relay is allowed only by omitting both credentials.
export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.eu",
  port,
  secure: port === 465,
  ...(smtpUser && smtpPassword
    ? { auth: { user: smtpUser, pass: smtpPassword } }
    : {}),
  tls: { minVersion: "TLSv1.2" },
});

export function escapeEmailHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function assertSafeEmailUrl(value: string): string {
  if (/\p{Cc}/u.test(value)) throw new Error("Unsafe email URL.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Unsafe email URL.");
  }
  const loopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
    url.username ||
    url.password
  ) {
    throw new Error("Unsafe email URL.");
  }
  return url.toString().replace(/\/$/, value.endsWith("/") ? "/" : "");
}

export function safeEmailHeaderText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function safeEmailRecipient(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length === 0 ||
    normalized.length > 320 ||
    /[\r\n]/.test(normalized) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error("Unsafe email recipient.");
  }
  return normalized;
}
