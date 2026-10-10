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

/**
 * Identity key for "one entry per person". Gmail ignores dots and "+tags" in
 * the local part, so those aliases collapse to one address; delivery to the
 * canonical form still reaches the same inbox.
 */
export function canonicalizeEmail(raw: string): string {
  const email = normalizeEmail(raw);
  const at = email.indexOf("@");
  if (at <= 0) return email;
  let local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
    return `${local}@gmail.com`;
  }
  return `${local}@${domain}`;
}

// Strict enough to reject address-list separators and header characters
// (",", ";", "<", ">", quotes, whitespace) that nodemailer would otherwise
// parse as several recipients.
export const EMAIL_RE = /^[a-z0-9!#$%&'*\/=?^_`{|}~.+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
