import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Optional kiosk gate. When GAME_KIOSK_ACCESS_KEY is set, the game page is
 * only served to browsers that presented the key once (?k=...), after which a
 * signed cookie keeps the kiosk unlocked for 90 days. When unset, the game is
 * public (useful locally and for an online campaign).
 */
const COOKIE_NAME = "bilheteira_game_kiosk";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function configuredKey(): string | null {
  const key = process.env.GAME_KIOSK_ACCESS_KEY?.trim();
  return key ? key : null;
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be configured");
  return s;
}

function tokenFor(key: string): string {
  return createHmac("sha256", secret()).update(`kiosk:${key}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isKioskGateEnabled(): boolean {
  return configuredKey() !== null;
}

/** Returns true when the request may use the kiosk. Sets the cookie when the
 *  presented key is correct. */
export async function authorizeKiosk(presentedKey?: string): Promise<boolean> {
  const key = configuredKey();
  if (!key) return true;
  const jar = await cookies();
  const expected = tokenFor(key);
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing && safeEqual(existing, expected)) return true;
  if (presentedKey && safeEqual(presentedKey, key)) {
    jar.set(COOKIE_NAME, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
    return true;
  }
  return false;
}

/** Read-only check for server actions (no cookie writes). */
export async function hasKioskAccess(): Promise<boolean> {
  const key = configuredKey();
  if (!key) return true;
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  return !!existing && safeEqual(existing, tokenFor(key));
}
