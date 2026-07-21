import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";

// Route test for the Cal.com self-service booking webhook receiver.
// Exercises: env-gating (404), HMAC signature verification (400), the
// BOOKING_CREATED write path (own meetingUrl, calcomBookingUid persisted,
// mentor/attendee relationship re-checked, duplicate delivery handled via
// the DB's @unique constraint rather than a racy pre-check), and the
// BOOKING_CANCELLED path.

const WEBHOOK_SECRET = "test-calcom-secret";

const userFindUnique = vi.fn();
const sessionCreate = vi.fn();
const sessionUpdate = vi.fn();
const sessionFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
    session: {
      create: (...args: unknown[]) => sessionCreate(...args),
      update: (...args: unknown[]) => sessionUpdate(...args),
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
  },
}));

const isMentoredUser = vi.fn();
vi.mock("@/lib/wepacker/guards", () => ({
  isMentoredUser: (...args: unknown[]) => isMentoredUser(...args),
  assertMentorOfCohort: vi.fn(),
  assertMentorOfUsers: vi.fn(),
  getMentoredCohortIds: vi.fn(async () => []),
  requireMembership: vi.fn(),
  requireRole: vi.fn(),
  requireUser: vi.fn(),
}));

const sendSessionInviteEmail = vi.fn(async (..._args: unknown[]) => undefined);
const sendSessionCancelEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: (...args: unknown[]) => sendSessionInviteEmail(...args),
  sendSessionCancelEmail: (...args: unknown[]) => sendSessionCancelEmail(...args),
}));

vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: vi.fn(() => "ICS-REQUEST"),
  buildSessionCancelIcs: vi.fn(() => "ICS-CANCEL"),
  nextIcsSequence: vi.fn(() => 1),
}));

import { POST } from "@/app/api/wepacker/calcom-webhook/route";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(
  bodyObj: unknown,
  opts: { signature?: string | null; secret?: string } = {}
): NextRequest {
  const raw = JSON.stringify(bodyObj);
  const signature =
    opts.signature !== undefined ? opts.signature : sign(raw, opts.secret ?? WEBHOOK_SECRET);
  return {
    text: async () => raw,
    headers: {
      get: (name: string) => (name.toLowerCase() === "x-cal-signature-256" ? signature : null),
    },
  } as unknown as NextRequest;
}

const bookingCreatedBody = {
  triggerEvent: "BOOKING_CREATED",
  payload: {
    uid: "booking-uid-1",
    organizer: { email: "mentor@wepac.pt" },
    attendees: [{ email: "member@wepac.pt" }],
    startTime: "2026-08-10T14:00:00.000Z",
    endTime: "2026-08-10T14:45:00.000Z",
  },
};

const bookingCancelledBody = {
  triggerEvent: "BOOKING_CANCELLED",
  payload: { uid: "booking-uid-1" },
};

const mentorRow = { id: "mentor-1", role: "mentor" };
const attendeeRow = { id: "member-1" };

const originalSecret = process.env.CALCOM_WEBHOOK_SECRET;

afterAll(() => {
  if (originalSecret === undefined) delete process.env.CALCOM_WEBHOOK_SECRET;
  else process.env.CALCOM_WEBHOOK_SECRET = originalSecret;
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CALCOM_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

describe("POST /api/wepacker/calcom-webhook", () => {
  it("404s when CALCOM_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.CALCOM_WEBHOOK_SECRET;
    const res = await POST(makeRequest(bookingCreatedBody));
    expect(res.status).toBe(404);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("400s on a missing signature", async () => {
    const res = await POST(makeRequest(bookingCreatedBody, { signature: null }));
    expect(res.status).toBe(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("400s on an invalid signature", async () => {
    const res = await POST(makeRequest(bookingCreatedBody, { signature: "0".repeat(64) }));
    expect(res.status).toBe(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("400s (not 500) on a malformed signature encoding instead of throwing", async () => {
    const res = await POST(makeRequest(bookingCreatedBody, { signature: "not-hex-!!" }));
    expect(res.status).toBe(400);
  });

  describe("BOOKING_CREATED", () => {
    it("resolves organizer + relationship-checked attendee and creates a Session with our own meetingUrl and calcomBookingUid", async () => {
      userFindUnique
        .mockResolvedValueOnce(mentorRow) // organizer lookup
        .mockResolvedValueOnce(attendeeRow); // attendee lookup
      isMentoredUser.mockResolvedValueOnce(true);
      sessionCreate.mockResolvedValueOnce({
        id: "session-1",
        mentor: { id: "mentor-1", name: "Ana Mentor" },
        attendees: [],
      });
      // sendSessionCalendarEmails (fire-and-forget) re-reads the session via
      // getSessionCalendarContext for the email fan-out.
      sessionFindUnique.mockResolvedValueOnce({
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-10T14:00:00.000Z"),
        durationMinutes: 45,
        meetingUrl: "https://meet.jit.si/wepac-abc123",
        mentor: { id: "mentor-1", name: "Ana Mentor", email: "mentor@wepac.pt" },
        attendees: [
          { user: { id: "member-1", name: "Membro Um", email: "member@wepac.pt" } },
        ],
      });

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ created: true });
      expect(isMentoredUser).toHaveBeenCalledWith("mentor-1", "member-1");

      const createArgs = sessionCreate.mock.calls[0][0];
      expect(createArgs.data.calcomBookingUid).toBe("booking-uid-1");
      expect(createArgs.data.mentorId).toBe("mentor-1");
      expect(createArgs.data.durationMinutes).toBe(45);
      // Our own generated link, never anything read off the Cal.com payload
      // (which doesn't even carry one here) — mandate is to always mint a
      // fresh Jitsi room.
      expect(typeof createArgs.data.meetingUrl).toBe("string");
      expect(createArgs.data.meetingUrl).not.toContain("cal.com");

      await vi.waitFor(() => {
        expect(sendSessionInviteEmail).toHaveBeenCalled();
      });
    });

    it("skips (200) without creating a Session when the organizer email has no matching User", async () => {
      userFindUnique.mockResolvedValueOnce(null); // organizer lookup misses

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ skipped: "organizer_not_found" });
      expect(sessionCreate).not.toHaveBeenCalled();
    });

    it("skips (200) without creating a Session when the organizer resolves but isn't a mentor/admin", async () => {
      userFindUnique.mockResolvedValueOnce({ id: "user-1", role: "member" });

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ skipped: "organizer_not_authorized" });
      expect(sessionCreate).not.toHaveBeenCalled();
    });

    it("drops an attendee who resolves to a real User but has no mentoring relationship with the organizer, and skips the whole booking if none remain", async () => {
      userFindUnique
        .mockResolvedValueOnce(mentorRow) // organizer
        .mockResolvedValueOnce(attendeeRow); // attendee resolves...
      isMentoredUser.mockResolvedValueOnce(false); // ...but isn't actually mentored by this organizer

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ skipped: "no_authorized_attendees" });
      expect(sessionCreate).not.toHaveBeenCalled();
    });

    it("responds 200 { duplicate: true } and does not retry-storm when two concurrent deliveries race into the @unique constraint", async () => {
      userFindUnique.mockResolvedValueOnce(mentorRow).mockResolvedValueOnce(attendeeRow);
      isMentoredUser.mockResolvedValueOnce(true);
      sessionCreate.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "6.19.2",
        })
      );

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ duplicate: true });
    });
  });

  describe("BOOKING_CANCELLED", () => {
    it("cancels the matching Session by calcomBookingUid", async () => {
      sessionFindUnique
        .mockResolvedValueOnce({ id: "session-1" }) // uid -> session lookup (route)
        .mockResolvedValueOnce({ status: "scheduled" }); // status check (cancelSessionFromWebhook)
      sessionUpdate.mockResolvedValueOnce({ id: "session-1", status: "cancelled" });

      const res = await POST(makeRequest(bookingCancelledBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ cancelled: true });
      expect(sessionUpdate).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { status: "cancelled" },
      });
    });

    it("skips (200) when no Session matches the calcomBookingUid", async () => {
      sessionFindUnique.mockResolvedValueOnce(null);

      const res = await POST(makeRequest(bookingCancelledBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ skipped: "session_not_found" });
      expect(sessionUpdate).not.toHaveBeenCalled();
    });
  });

  describe("unhandled trigger events", () => {
    it("ignores (200) any triggerEvent it doesn't handle, e.g. BOOKING_RESCHEDULED", async () => {
      const res = await POST(
        makeRequest({ triggerEvent: "BOOKING_RESCHEDULED", payload: { uid: "x" } })
      );
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json).toEqual({ ignored: true });
    });
  });
});
