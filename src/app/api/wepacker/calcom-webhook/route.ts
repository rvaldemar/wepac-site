import { createHash, createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveSessionAttendeeAuthorization } from "@/lib/wepacker/guards";
import {
  cancelSessionFromWebhook,
  createSessionFromResolvedActors,
  rescheduleSessionFromWebhook,
} from "@/lib/wepacker/actions/session";
import {
  computeDurationMinutes,
  verifyCalcomSignature,
  type CalcomBookingPayload,
  type CalcomWebhookBody,
} from "@/lib/wepacker/calcom";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CALCOM_WEBHOOK_VERSION = "2021-10-20";
const MAX_CALCOM_BODY_BYTES = 256 * 1024;

class CalcomBodyError extends Error {
  constructor(readonly status: 400 | 413) {
    super(status === 413 ? "payload too large" : "malformed body");
  }
}

async function readBoundedBody(req: NextRequest): Promise<string> {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    if (!/^\d+$/.test(contentLength)) throw new CalcomBodyError(400);
    if (Number(contentLength) > MAX_CALCOM_BODY_BYTES) {
      throw new CalcomBodyError(413);
    }
  }

  // Stream in production so a missing or dishonest Content-Length cannot
  // force an unbounded allocation. The text() fallback exists only for small
  // request doubles used by unit tests.
  if (!req.body) {
    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_CALCOM_BODY_BYTES) {
      throw new CalcomBodyError(413);
    }
    return raw;
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_CALCOM_BODY_BYTES) {
      await reader.cancel();
      throw new CalcomBodyError(413);
    }
    chunks.push(value);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
    );
  } catch {
    throw new CalcomBodyError(400);
  }
}

// Not reversible from the log line — email is PII, and the not-found /
// not-authorized paths below are the one place this route logs it. A
// short secret-keyed HMAC prefix correlates repeated mismatches without making
// common addresses reversible through a dictionary attack or writing the
// address itself to journalctl.
function hashEmail(email: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 12);
}

export async function POST(req: NextRequest) {
  // Release A is intentionally fail-closed. Signed Cal.com deliveries do not
  // authenticate the person who used a public booking page; activation needs
  // a one-time BookingGrant or organizer-confirmation workflow first.
  if (process.env.CALCOM_SESSION_INGEST_ENABLED !== "true") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Env-gated: absence of the secret makes this endpoint invisible (404,
  // not 500), same pattern as DEBRIEF_ENGINE/HUB_*. Checked before touching
  // the body — no DB work, no signature computation, on an unconfigured
  // deployment.
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (req.headers.get("x-cal-webhook-version") !== CALCOM_WEBHOOK_VERSION) {
    return NextResponse.json({ error: "unsupported version" }, { status: 400 });
  }

  // Raw body first — verifying against anything other than the exact
  // bytes Cal.com signed would invalidate the signature.
  let rawBody: string;
  try {
    rawBody = await readBoundedBody(req);
  } catch (error) {
    if (error instanceof CalcomBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }
  const signatureHeader = req.headers.get("x-cal-signature-256");
  if (!verifyCalcomSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let body: CalcomWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }

  const { triggerEvent, payload } = body;

  if (triggerEvent === "BOOKING_CREATED") {
    return handleBookingCreated(payload, secret);
  }
  if (triggerEvent === "BOOKING_CANCELLED") {
    return handleBookingCancelled(payload, secret);
  }
  if (triggerEvent === "BOOKING_RESCHEDULED") {
    return handleBookingRescheduled(payload, secret);
  }

  // Cal.com resends on non-2xx and fires other trigger types we do not use.
  // Always 200 for anything recognized-but-uninteresting so it never retries.
  return NextResponse.json({ ignored: true });
}

async function handleBookingCreated(
  payload: CalcomBookingPayload,
  webhookSecret: string,
) {
  if (!payload?.uid || !payload.organizer?.email || !payload.startTime) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  const organizerEmail = payload.organizer.email.trim().toLowerCase();
  const organizer = await prisma.user.findUnique({
    where: { email: organizerEmail },
    select: { id: true },
  });
  if (!organizer) {
    console.error("[calcom webhook] organizer_not_found", {
      emailHash: hashEmail(payload.organizer.email, webhookSecret),
    });
    return NextResponse.json({ skipped: "organizer_not_found" });
  }
  // Authorization, not just authentication: the verified HMAC signature
  // only proves this payload actually came from Cal.com — Cal.com's
  // booking page is public and accepts any self-asserted attendee email,
  // so a valid signature says nothing about whether the attendee has any
  // real relationship with the resolved organizer. Every organizer, regardless
  // of account role, must have the narrow Session capability: an active, fully
  // accepted directed Mentorship with each attendee.
  // Unauthorized/unresolved attendees are dropped individually; if none
  // remain, the whole booking is skipped.
  const resolvedAttendeeIds: string[] = [];
  const seenAttendeeIds = new Set<string>();
  for (const attendee of payload.attendees ?? []) {
    if (!attendee?.email) continue;
    const attendeeEmail = attendee.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: attendeeEmail },
      select: { id: true },
    });
    if (!user) {
      console.error("[calcom webhook] attendee_not_found", {
        emailHash: hashEmail(attendee.email, webhookSecret),
      });
      continue;
    }
    if (user.id === organizer.id) {
      console.error("[calcom webhook] attendee_not_authorized", {
        emailHash: hashEmail(attendee.email, webhookSecret),
      });
      continue;
    }
    if (seenAttendeeIds.has(user.id)) continue;

    const authorization = await resolveSessionAttendeeAuthorization(
      organizer.id,
      user.id,
    );
    if (!authorization.authorized) {
      console.error("[calcom webhook] attendee_not_authorized", {
        emailHash: hashEmail(attendee.email, webhookSecret),
      });
      continue;
    }
    seenAttendeeIds.add(user.id);
    resolvedAttendeeIds.push(user.id);
  }

  if (resolvedAttendeeIds.length === 0) {
    return NextResponse.json({ skipped: "no_authorized_attendees" });
  }
  const scheduledAt = new Date(payload.startTime);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  try {
    await createSessionFromResolvedActors({
      webhookSecret,
      organizerId: organizer.id,
      kind: "checkpoint",
      scheduledAt,
      durationMinutes: computeDurationMinutes(payload.startTime, payload.endTime),
      attendeeUserIds: resolvedAttendeeIds,
      calcomBookingUid: payload.uid,
    });
  } catch (err) {
    // Cal.com is at-least-once delivery and retries aggressively — two
    // concurrent BOOKING_CREATED deliveries for the same booking can both
    // race into this create. The @unique constraint on calcomBookingUid
    // (not a pre-check findFirst, which two racing requests could both
    // pass) is the actual idempotency anchor; a P2002 here just means the
    // other delivery won the race.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ duplicate: true });
    }
    console.error("[calcom webhook] booking_created handler error", {
      bookingUidHash: createHash("sha256")
        .update(payload.uid)
        .digest("hex")
        .slice(0, 12),
      ...logSafeError(err),
    });
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ created: true });
}

async function handleBookingCancelled(
  payload: CalcomBookingPayload,
  webhookSecret: string,
) {
  if (!payload?.uid) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  const sessionId = await resolveCalcomSessionId([payload.uid]);
  if (!sessionId) {
    return NextResponse.json({ skipped: "session_not_found" });
  }

  const current = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { calcomBookingUid: true },
  });
  if (!current || current.calcomBookingUid !== payload.uid) {
    return NextResponse.json({ skipped: "stale_booking_uid" });
  }

  await cancelSessionFromWebhook(sessionId, webhookSecret);
  return NextResponse.json({ cancelled: true });
}

async function handleBookingRescheduled(
  payload: CalcomBookingPayload,
  webhookSecret: string,
) {
  if (!payload?.uid || !payload.rescheduleUid || !payload.startTime) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }
  const scheduledAt = new Date(payload.startTime);
  const durationMinutes = computeDurationMinutes(
    payload.startTime,
    payload.endTime,
  );
  if (
    Number.isNaN(scheduledAt.getTime()) ||
    durationMinutes < 15 ||
    durationMinutes > 1_440
  ) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  const sessionId = await resolveCalcomSessionId([
    payload.rescheduleUid,
    payload.uid,
  ]);
  if (!sessionId) {
    return NextResponse.json({ skipped: "session_not_found" });
  }

  const result = await rescheduleSessionFromWebhook(
    sessionId,
    webhookSecret,
    {
      scheduledAt,
      durationMinutes,
      calcomBookingUid: payload.uid,
    },
  );
  if (!result) {
    return NextResponse.json({ skipped: "session_not_found" });
  }
  return NextResponse.json(
    result.alreadyCurrent ? { unchanged: true } : { rescheduled: true },
  );
}

async function resolveCalcomSessionId(
  candidateUids: readonly string[],
): Promise<string | null> {
  const uids = Array.from(
    new Set(candidateUids.map((uid) => uid.trim()).filter(Boolean)),
  );
  for (const uid of uids) {
    const reference = await prisma.calcomBookingReference.findUnique({
      where: { uid },
      select: { sessionId: true },
    });
    if (reference) return reference.sessionId;
  }

  // Compatibility for the small rollout window before the alias-table
  // migration backfill is visible to every process.
  for (const uid of uids) {
    const session = await prisma.session.findUnique({
      where: { calcomBookingUid: uid },
      select: { id: true },
    });
    if (session) return session.id;
  }
  return null;
}
