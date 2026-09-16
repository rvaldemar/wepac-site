import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "bilheteira_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type Payload = {
  adminId: string;
  email: string;
  issuedAt: number;
};

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET must be configured");
  }
  return secret;
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): Buffer {
  const pad = 4 - (str.length % 4 || 4);
  const padded = str + (pad < 4 ? "=".repeat(pad) : "");
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payload: Payload): string {
  const body = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const mac = createHmac("sha256", getSecret()).update(body).digest();
  const sig = base64UrlEncode(mac);
  return `${body}.${sig}`;
}

function verify(token: string): Payload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", getSecret()).update(body).digest();
  const provided = base64UrlDecode(sig);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;
  try {
    return JSON.parse(base64UrlDecode(body).toString("utf8")) as Payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(adminId: string, email: string) {
  const token = sign({ adminId, email, issuedAt: Date.now() });
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSessionAdmin() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const admin = await prisma.ticketingAdmin.findUnique({
    where: { id: payload.adminId },
  });
  return admin;
}

export function isAllowedEmail(email: string): boolean {
  return /^[a-z0-9._+-]+@wepac\.pt$/i.test(email.trim());
}
