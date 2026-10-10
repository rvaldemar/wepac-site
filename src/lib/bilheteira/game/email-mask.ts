/** "rui.santos@gmail.com" -> "r•••••••••@gmail.com". Never reveals more than
 *  the first character of the local part at the kiosk. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  return `${local[0]}${"•".repeat(Math.max(2, Math.min(local.length - 1, 8)))}${domain}`;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
