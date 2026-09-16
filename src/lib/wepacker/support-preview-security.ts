import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "wepac_support_preview_";
const COOKIE_PAYLOAD_VERSION = 1;
const MAX_IDENTIFIER_LENGTH = 128;
const MAX_COOKIE_TOKEN_LENGTH = 2048;

type SupportPreviewCookiePayload = {
  version: typeof COOKIE_PAYLOAD_VERSION;
  grantId: string;
  sessionId: string;
  targetUserId: string;
  expiresAt: number;
};

function getSigningSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Support Preview signing secret is not configured.");
  }
  return secret;
}

function isBoundedIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH
  );
}

function previewPath(sessionId: string, targetUserId: string): string {
  return `/wepacker/mentor/sessions/${encodeURIComponent(sessionId)}/preview/${encodeURIComponent(targetUserId)}`;
}

function cookieName(sessionId: string, targetUserId: string): string {
  const resourceDigest = createHash("sha256")
    .update(`${sessionId}\u0000${targetUserId}`)
    .digest("hex")
    .slice(0, 24);
  return `${COOKIE_PREFIX}${resourceDigest}`;
}

function signPayload(payload: SupportPreviewCookiePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSigningSecret())
    .update(`wepac-support-preview-cookie\u0000${encoded}`)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyPayload(token: string): SupportPreviewCookiePayload | null {
  if (!token || token.length > MAX_COOKIE_TOKEN_LENGTH) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;

  const expected = createHmac("sha256", getSigningSecret())
    .update(`wepac-support-preview-cookie\u0000${encoded}`)
    .digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<SupportPreviewCookiePayload>;
    if (
      parsed.version !== COOKIE_PAYLOAD_VERSION ||
      !isBoundedIdentifier(parsed.grantId) ||
      !isBoundedIdentifier(parsed.sessionId) ||
      !isBoundedIdentifier(parsed.targetUserId) ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isSafeInteger(parsed.expiresAt)
    ) {
      return null;
    }
    return parsed as SupportPreviewCookiePayload;
  } catch {
    return null;
  }
}

function cookieOptions(sessionId: string, targetUserId: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: previewPath(sessionId, targetUserId),
    priority: "high" as const,
  };
}

export function digestSupportTicketReference(ticketReference: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(
      `wepac-support-preview-ticket\u0000${ticketReference.trim().toUpperCase()}`,
    )
    .digest("hex");
}

export async function setAdminSupportPreviewCookie(input: {
  grantId: string;
  sessionId: string;
  targetUserId: string;
  expiresAt: Date;
}): Promise<void> {
  const payload: SupportPreviewCookiePayload = {
    version: COOKIE_PAYLOAD_VERSION,
    grantId: input.grantId,
    sessionId: input.sessionId,
    targetUserId: input.targetUserId,
    expiresAt: input.expiresAt.getTime(),
  };
  const store = await cookies();
  store.set(
    cookieName(input.sessionId, input.targetUserId),
    signPayload(payload),
    {
      ...cookieOptions(input.sessionId, input.targetUserId),
      expires: input.expiresAt,
      maxAge: Math.max(
        0,
        Math.floor((input.expiresAt.getTime() - Date.now()) / 1000),
      ),
    },
  );
}

export async function getAdminSupportPreviewGrantFromCookie(
  sessionId: string,
  targetUserId: string,
): Promise<string | null> {
  const store = await cookies();
  const token = store.get(cookieName(sessionId, targetUserId))?.value;
  if (!token) return null;

  const payload = verifyPayload(token);
  if (
    !payload ||
    payload.sessionId !== sessionId ||
    payload.targetUserId !== targetUserId ||
    payload.expiresAt <= Date.now()
  ) {
    return null;
  }
  return payload.grantId;
}

export async function clearAdminSupportPreviewCookie(
  sessionId: string,
  targetUserId: string,
): Promise<void> {
  const store = await cookies();
  store.set(cookieName(sessionId, targetUserId), "", {
    ...cookieOptions(sessionId, targetUserId),
    expires: new Date(0),
    maxAge: 0,
  });
}
