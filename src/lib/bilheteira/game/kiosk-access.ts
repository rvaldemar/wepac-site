import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Kiosk gate. When GAME_KIOSK_ACCESS_KEY is set, the game is only served to
 * browsers that posted the key once to /api/bilheteira/game/unlock, after
 * which a signed cookie keeps the device unlocked for 90 days.
 *
 * Fail-closed: in production the game is locked unless a key is configured
 * or GAME_PUBLIC=1 explicitly opts into an open online campaign. Outside
 * production (local dev, E2E) an unset key means open.
 */
export const KIOSK_COOKIE_NAME = "bilheteira_game_kiosk";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type KioskMode = "open" | "gated" | "locked_misconfigured";

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

export function kioskMode(env: NodeJS.ProcessEnv = process.env): KioskMode {
  if (env.GAME_KIOSK_ACCESS_KEY?.trim()) return "gated";
  if (env.GAME_PUBLIC === "1") return "open";
  return env.NODE_ENV === "production" ? "locked_misconfigured" : "open";
}

export function isKioskGateEnabled(): boolean {
  return kioskMode() === "gated";
}

/** Validates a presented key. Pure; the caller sets the cookie. */
export function keyMatches(presented: string | null | undefined): boolean {
  const key = configuredKey();
  if (!key || !presented) return false;
  return safeEqual(presented, key);
}

export function kioskCookieValue(): string {
  const key = configuredKey();
  if (!key) throw new Error("GAME_KIOSK_ACCESS_KEY is not configured");
  return tokenFor(key);
}

export const kioskCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/**
 * Read-only access check, safe in Server Components and server actions.
 * Returns the device token when access comes from a kiosk cookie (used to
 * key per-device rate limits), "open" when the game is public, or null.
 */
export async function kioskAccess(): Promise<{ device: string } | null> {
  const mode = kioskMode();
  if (mode === "open") return { device: "open" };
  if (mode === "locked_misconfigured") return null;
  const jar = await cookies();
  const existing = jar.get(KIOSK_COOKIE_NAME)?.value;
  if (existing && safeEqual(existing, kioskCookieValue())) {
    return { device: existing.slice(0, 16) };
  }
  return null;
}

export async function hasKioskAccess(): Promise<boolean> {
  return (await kioskAccess()) !== null;
}
