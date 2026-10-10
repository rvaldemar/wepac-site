import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, non-expiring unsubscribe token embedded in every voucher email.
 * `participantId` is a cuid (no PII); the signature stops enumeration.
 */
function secret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be configured");
  return s;
}

export function unsubscribeToken(participantId: string): string {
  const sig = createHmac("sha256", secret()).update(`unsub:${participantId}`).digest("base64url");
  return `${participantId}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [id, sig] = String(token || "").split(".");
  if (!id || !sig || id.length > 64) return null;
  const expected = createHmac("sha256", secret()).update(`unsub:${id}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export function unsubscribeUrl(participantId: string): string {
  const base = process.env.APP_URL || "https://wepac.pt";
  return `${base}/api/bilheteira/game/unsubscribe?t=${encodeURIComponent(unsubscribeToken(participantId))}`;
}
