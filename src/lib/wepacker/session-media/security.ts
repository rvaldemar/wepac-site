import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { callbackMaxSkewSeconds } from "@/lib/wepacker/session-media/config";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const ROOM = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const SHA256 = /^[0-9a-f]{64}$/;

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newOpaqueId(prefix: string): string {
  return `${prefix}:${randomUUID()}`;
}

export function assertOpaqueId(value: unknown, label: string): string {
  if (typeof value !== "string" || !OPAQUE_ID.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

export function assertCanonicalRoom(value: unknown): string {
  if (typeof value !== "string" || !ROOM.test(value)) {
    throw new Error("Invalid canonical room.");
  }
  return value;
}

export function assertSha256(value: unknown, label = "sha256"): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

export function canonicalRoomFromMeetingUrl(
  meetingUrl: string | null,
  configuredBaseUrl: string,
): string {
  if (!meetingUrl) throw new Error("Session has no meeting room.");
  let meeting: URL;
  let base: URL;
  try {
    meeting = new URL(meetingUrl);
    base = new URL(configuredBaseUrl);
  } catch {
    throw new Error("Session meeting room is invalid.");
  }
  if (
    meeting.protocol !== "https:" ||
    base.protocol !== "https:" ||
    meeting.origin !== base.origin
  ) {
    throw new Error("Session meeting room is not canonical.");
  }
  const room = decodeURIComponent(meeting.pathname.replace(/^\/+|\/+$/g, ""));
  if (room.includes("/")) throw new Error("Session meeting room is invalid.");
  return assertCanonicalRoom(room);
}

export function safeRelativeObjectKey(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 1_024 ||
    value.includes("\0") ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(value) ||
    value.split("/").some((part) => part === ".." || part === "")
  ) {
    throw new Error("Invalid recording object key.");
  }
  return value;
}

export interface SignedCallbackEvidence {
  idempotencyKey: string;
  timestamp: string;
  bodySha256: string;
}

export function verifySignedCallback(
  request: Request,
  rawBody: string,
  secret: string,
  now = Date.now(),
): SignedCallbackEvidence {
  const idempotencyKey = assertOpaqueId(
    request.headers.get("idempotency-key"),
    "Idempotency-Key",
  );
  const timestamp = request.headers.get("x-wepac-timestamp")?.trim() ?? "";
  const signature = request.headers
    .get("x-wepac-signature")
    ?.trim()
    .toLowerCase() ?? "";
  if (!/^\d{10,13}$/.test(timestamp) || !SHA256.test(signature)) {
    throw new Error("Invalid callback signature.");
  }
  const timestampMs =
    timestamp.length === 10 ? Number(timestamp) * 1_000 : Number(timestamp);
  if (
    !Number.isSafeInteger(timestampMs) ||
    Math.abs(now - timestampMs) > callbackMaxSkewSeconds() * 1_000
  ) {
    throw new Error("Callback timestamp outside accepted window.");
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${idempotencyKey}.`)
    .update(rawBody)
    .digest("hex");
  const actualBytes = Buffer.from(signature, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    throw new Error("Invalid callback signature.");
  }
  return { idempotencyKey, timestamp, bodySha256: sha256(rawBody) };
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export function signJitsiRoomToken(input: {
  secret: string;
  appId: string;
  issuer: string;
  audience: string;
  room: string;
  userId: string;
  displayName: string;
  moderator: boolean;
  now?: Date;
}): string {
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1_000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      aud: input.audience,
      iss: input.issuer,
      sub: input.appId,
      room: input.room,
      iat: nowSeconds,
      nbf: nowSeconds - 5,
      exp: nowSeconds + 5 * 60,
      context: {
        user: {
          id: input.userId,
          name: input.displayName,
          moderator: input.moderator,
        },
      },
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", input.secret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}
