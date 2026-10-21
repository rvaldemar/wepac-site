import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cookieName = "wepac_convites_access";
const routePath = "/convites/quem-e-o-teu-mestre";
const documentPath = path.join(process.cwd(), "private-assets", "convites-quem-e-o-teu-mestre.html");

function configuredToken() {
  const token = process.env.WEPAC_CONVITES_TEAM_TOKEN;
  return token && /^[a-f0-9]{96}$/i.test(token) ? token : null;
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sessionValue(token: string) {
  return createHmac("sha256", token).update("wepac-convites-team-session-v1").digest("hex");
}

function headers() {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

function login(error = false) {
  const message = error ? '<p role="alert">Token inválido.</p>' : "";
  return new NextResponse(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Convites · acesso equipa WEPAC</title><style>body{font:16px system-ui;background:#111;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}main{width:min(90vw,420px)}input,button{box-sizing:border-box;width:100%;padding:14px;margin-top:12px;font:inherit}button{cursor:pointer}p{color:#fbb}</style></head><body><main><h1>Convites · acesso equipa</h1><form method="post"><label for="token">Token de acesso</label><input id="token" name="token" type="password" required autocomplete="off"><button type="submit">Entrar</button></form>${message}</main></body></html>`, {
    headers: { ...headers(), "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const token = configuredToken();
  if (!token) return new NextResponse("Unavailable", { status: 503, headers: headers() });
  const cookie = request.cookies.get(cookieName)?.value ?? "";
  if (!equal(cookie, sessionValue(token))) return login();
  const html = await readFile(documentPath);
  return new NextResponse(html, {
    headers: { ...headers(), "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const token = configuredToken();
  if (!token) return new NextResponse("Unavailable", { status: 503, headers: headers() });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return new NextResponse("Forbidden", { status: 403, headers: headers() });
  }
  const form = await request.formData();
  const supplied = form.get("token");
  if (typeof supplied !== "string" || !equal(supplied, token)) return login(true);
  // Keep the redirect relative: behind Nginx, Next may see 0.0.0.0:3003.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: routePath },
  });
  response.cookies.set(cookieName, sessionValue(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: routePath,
    maxAge: 60 * 60 * 24 * 7,
  });
  for (const [key, value] of Object.entries(headers())) response.headers.set(key, value);
  return response;
}
