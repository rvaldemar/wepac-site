import { NextRequest, NextResponse } from "next/server";
import {
  KIOSK_COOKIE_NAME,
  keyMatches,
  kioskCookieOptions,
  kioskCookieValue,
  kioskMode,
} from "@/lib/bilheteira/game/kiosk-access";
import { checkRateLimit } from "@/lib/bilheteira/game/rate-limit";
import { getVisitorIp } from "@/lib/wessex/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/bilheteira/game/unlock — form field `key`, optional `locale`.
 * Sets the signed kiosk cookie and redirects to the game. The key travels in
 * a POST body, never in a URL, so it stays out of access logs and history.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  const locale = String(form?.get("locale") ?? "") === "en-US" ? "/en" : "";
  const gamePath = `${locale}/bilheteira/jogo`;

  if (kioskMode() !== "gated") {
    return NextResponse.redirect(new URL(gamePath, req.url), 303);
  }
  if (!checkRateLimit(`game:unlock:${getVisitorIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  if (!keyMatches(key)) {
    return NextResponse.redirect(new URL(`${gamePath}?unlock=failed`, req.url), 303);
  }
  const res = NextResponse.redirect(new URL(gamePath, req.url), 303);
  res.cookies.set(KIOSK_COOKIE_NAME, kioskCookieValue(), kioskCookieOptions);
  return res;
}
