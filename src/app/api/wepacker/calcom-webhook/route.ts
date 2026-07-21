import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveSessionAttendeeAuthorization } from "@/lib/wepacker/guards";
import {
  cancelSessionFromWebhook,
  createSessionFromResolvedActors,
} from "@/lib/wepacker/actions/session";
import {
  computeDurationMinutes,
  verifyCalcomSignature,
  type CalcomBookingPayload,
  type CalcomWebhookBody,
} from "@/lib/wepacker/calcom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Not reversible from the log line — email is PII, and the not-found /
// not-authorized paths below are the one place this route logs it. A
// short sha256 prefix is enough to correlate repeated mismatches (e.g.
// "same wrong email keeps showing up") without ever writing the address
// itself to journalctl.
function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 12);
}

export async function POST(req: NextRequest) {
  // Env-gated: absence of the secret makes this endpoint invisible (404,
  // not 500), same pattern as DEBRIEF_ENGINE/HUB_*. Checked before touching
  // the body — no DB work, no signature computation, on an unconfigured
  // deployment.
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Raw body first — verifying against anything other than the exact
  // bytes Cal.com signed would invalidate the signature.
  const rawBody = await req.text();
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
    return handleBookingCreated(payload);
  }
  if (triggerEvent === "BOOKING_CANCELLED") {
    return handleBookingCancelled(payload);
  }

  // Cal.com resends on non-2xx, and fires plenty of trigger types we don't
  // care about yet (BOOKING_RESCHEDULED included — see OPS_LOG). Always
  // 200 for anything recognized-but-uninteresting so it never retries.
  return NextResponse.json({ ignored: true });
}

async function handleBookingCreated(payload: CalcomBookingPayload) {
  if (!payload?.uid || !payload.organizer?.email || !payload.startTime) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  const mentor = await prisma.user.findUnique({
    where: { email: payload.organizer.email },
    select: { id: true, role: true },
  });
  if (!mentor) {
    console.error("[calcom webhook] organizer_not_found", {
      emailHash: hashEmail(payload.organizer.email),
    });
    return NextResponse.json({ skipped: "organizer_not_found" });
  }
  if (mentor.role !== "mentor" && mentor.role !== "admin") {
    console.error("[calcom webhook] organizer_not_authorized", {
      emailHash: hashEmail(payload.organizer.email),
    });
    return NextResponse.json({ skipped: "organizer_not_authorized" });
  }

  // Authorization, not just authentication: the verified HMAC signature
  // only proves this payload actually came from Cal.com — Cal.com's
  // booking page is public and accepts any self-asserted attendee email,
  // so a valid signature says nothing about whether the attendee has any
  // real relationship with the resolved organizer. Every non-admin
  // organizer must have the narrow Session capability: primarily an active,
  // fully accepted Mentorship, with an active legacy Cohort pair as a measured
  // migration fallback. Admin may schedule with any other Person.
  // Unauthorized/unresolved attendees are dropped individually; if none
  // remain, the whole booking is skipped.
  const resolvedAttendeeIds: string[] = [];
  const seenAttendeeIds = new Set<string>();
  let legacyFallbackCount = 0;
  for (const attendee of payload.attendees ?? []) {
    if (!attendee?.email) continue;
    const user = await prisma.user.findUnique({
      where: { email: attendee.email },
      select: { id: true },
    });
    if (!user) {
      console.error("[calcom webhook] attendee_not_found", {
        emailHash: hashEmail(attendee.email),
      });
      continue;
    }
    if (user.id === mentor.id) {
      console.error("[calcom webhook] attendee_not_authorized", {
        emailHash: hashEmail(attendee.email),
      });
      continue;
    }
    if (seenAttendeeIds.has(user.id)) continue;

    const authorization = await resolveSessionAttendeeAuthorization(
      mentor.id,
      user.id
    );
    const authorized = mentor.role === "admin" || authorization.authorized;
    if (!authorized) {
      console.error("[calcom webhook] attendee_not_authorized", {
        emailHash: hashEmail(attendee.email),
      });
      continue;
    }
    seenAttendeeIds.add(user.id);
    resolvedAttendeeIds.push(user.id);
    if (authorization.source === "legacy_cohort") {
      legacyFallbackCount += 1;
    }
  }

  if (resolvedAttendeeIds.length === 0) {
    return NextResponse.json({ skipped: "no_authorized_attendees" });
  }
  if (legacyFallbackCount > 0) {
    console.info("[calcom webhook] legacy_cohort_fallback", {
      attendeeCount: legacyFallbackCount,
    });
  }

  const scheduledAt = new Date(payload.startTime);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  try {
    await createSessionFromResolvedActors({
      mentorId: mentor.id,
      sessionType: resolvedAttendeeIds.length === 1 ? "individual" : "group",
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
    console.error("[calcom webhook] booking_created handler error", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ created: true });
}

async function handleBookingCancelled(payload: CalcomBookingPayload) {
  if (!payload?.uid) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { calcomBookingUid: payload.uid },
    select: { id: true },
  });
  if (!session) {
    return NextResponse.json({ skipped: "session_not_found" });
  }

  await cancelSessionFromWebhook(session.id);
  return NextResponse.json({ cancelled: true });
}
