import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal, tightly-scoped view of a Cal.com webhook delivery — only the
// fields the calcom-webhook route actually reads, not the full Cal.com
// payload shape (same "select explicit, default-deny" philosophy as
// ownAttendeeSessionSelect in actions/session.ts). Cal.com's real payload
// carries far more (event type, location, videoCallData, ...) — none of
// it is consumed here on purpose: the route deliberately ignores
// payload.location/videoCallData and generates its own meeting link (see
// createSessionFromResolvedActors), and the wepackerKind metadata
// override + multi-attendee/group resolution called out in the original
// spec are cut for phase 1 (single-mentor, 1:1 bookings, default kind
// "checkpoint") — see OPS_LOG for the sequencing note.
export type CalcomBookingPayload = {
  uid: string;
  organizer: { email: string };
  attendees: { email: string }[];
  startTime: string;
  endTime?: string;
};

export type CalcomWebhookBody = {
  triggerEvent: string;
  payload: CalcomBookingPayload;
};

// HMAC-SHA256 signature check for the X-Cal-Signature-256 header — mirrors
// the pattern already used for the bilheteira session cookie
// (src/lib/bilheteira/session.ts): timing-safe compare, never a raw ===.
// Cal.com hex-encodes the digest. The length check before timingSafeEqual
// (which throws on unequal-length buffers) plus the surrounding try/catch
// mean a malformed/mismatched header returns false — and therefore a 400
// upstream — instead of ever bubbling into a 500.
export function verifyCalcomSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    const provided = Buffer.from(signatureHeader, "hex");
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}

// Cal.com sends startTime/endTime as ISO strings. A booking with no (or an
// unparsable) endTime falls back to the platform's own default of 60
// minutes rather than guessing — webhook input is untrusted.
export function computeDurationMinutes(startTime: string, endTime?: string): number {
  const start = new Date(startTime).getTime();
  if (!endTime || Number.isNaN(start)) return 60;
  const end = new Date(endTime).getTime();
  if (Number.isNaN(end) || end <= start) return 60;
  return Math.round((end - start) / 60000);
}
