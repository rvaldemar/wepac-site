import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { POST } from "@/app/api/bilheteira/game/unlock/route";
import { KIOSK_COOKIE_NAME, kioskCookieValue } from "../kiosk-access";
import { resetRateLimits } from "../rate-limit";

function post(key: string, extra: Record<string, string> = {}) {
  const body = new URLSearchParams({ key, ...extra });
  return new NextRequest("https://wepac.pt/api/bilheteira/game/unlock", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded", "x-real-ip": "203.0.113.9" },
  });
}

beforeEach(() => {
  resetRateLimits();
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.GAME_KIOSK_ACCESS_KEY = "kiosk-key-123";
});

describe("POST /api/bilheteira/game/unlock", () => {
  it("sets the signed cookie and redirects to the game on the right key", async () => {
    const res = await POST(post("kiosk-key-123", { locale: "en-US" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://wepac.pt/en/bilheteira/jogo");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${KIOSK_COOKIE_NAME}=${kioskCookieValue()}`);
    expect(cookie.toLowerCase()).toContain("httponly");
  });
  it("redirects back with a failure flag and no cookie on a wrong key", async () => {
    const res = await POST(post("wrong"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://wepac.pt/bilheteira/jogo?unlock=failed");
    expect(res.headers.get("set-cookie")).toBeNull();
  });
  it("rate-limits brute force per IP", async () => {
    for (let i = 0; i < 10; i++) await POST(post("wrong"));
    const res = await POST(post("kiosk-key-123"));
    expect(res.status).toBe(429);
  });
  it("is a no-op redirect when the gate is not configured", async () => {
    delete process.env.GAME_KIOSK_ACCESS_KEY;
    const res = await POST(post("anything"));
    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
