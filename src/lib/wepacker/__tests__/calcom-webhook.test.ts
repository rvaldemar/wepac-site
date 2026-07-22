import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";

// Route test for the Cal.com self-service booking webhook receiver.
// Exercises: env-gating (404), HMAC signature verification (400), the
// BOOKING_CREATED write path (own meetingUrl, calcomBookingUid persisted,
// organizer/attendee relationship re-checked, duplicate delivery handled via
// the DB's @unique constraint rather than a racy pre-check), and the
// BOOKING_CANCELLED path.

const WEBHOOK_SECRET = "test-calcom-secret";

const userFindUnique = vi.fn();
const userFindMany = vi.fn();
const sessionCreate = vi.fn();
const sessionUpdate = vi.fn();
const sessionFindUnique = vi.fn();
const bookingReferenceFindUnique = vi.fn();
const bookingReferenceUpsert = vi.fn();
const txQueryRaw = vi.fn();
const persistSessionEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const prismaTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      user: {
        findMany: (...args: unknown[]) => userFindMany(...args),
      },
      session: {
        create: (...args: unknown[]) => sessionCreate(...args),
        update: (...args: unknown[]) => sessionUpdate(...args),
      },
      calcomBookingReference: {
        upsert: (...args: unknown[]) => bookingReferenceUpsert(...args),
      },
      $queryRaw: (...args: unknown[]) => txQueryRaw(...args),
    }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      findMany: (...args: unknown[]) => userFindMany(...args),
    },
    session: {
      create: (...args: unknown[]) => sessionCreate(...args),
      update: (...args: unknown[]) => sessionUpdate(...args),
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
    },
    calcomBookingReference: {
      findUnique: (...args: unknown[]) => bookingReferenceFindUnique(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      prismaTransaction(callback),
  },
}));

const resolveSessionAttendeeAuthorization = vi.fn();
vi.mock("@/lib/wepacker/guards", () => ({
  resolveSessionAttendeeAuthorization: (...args: unknown[]) =>
    resolveSessionAttendeeAuthorization(...args),
  requireRole: vi.fn(),
  requireUser: vi.fn(),
}));

const sendSessionInviteEmail = vi.fn(async (input: unknown) => {
  void input;
});
const sendSessionCancelEmail = vi.fn(async (input: unknown) => {
  void input;
});
vi.mock("@/lib/email", () => ({
  sendSessionInviteEmail: (input: unknown) => sendSessionInviteEmail(input),
  sendSessionCancelEmail: (input: unknown) => sendSessionCancelEmail(input),
  sendSharedNotePublishedEmail: vi.fn(),
}));

vi.mock("@/lib/wepacker/ics", () => ({
  buildSessionInviteIcs: vi.fn(() => "ICS-REQUEST"),
  buildSessionCancelIcs: vi.fn(() => "ICS-CANCEL"),
  nextIcsSequence: vi.fn(() => 1),
}));

vi.mock("@/lib/wepacker/notifications", () => ({
  persistSessionEvent: (...args: unknown[]) => persistSessionEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
  sessionTransitionDedupeScope: vi.fn(() => "transition-scope"),
}));

import { POST } from "@/app/api/wepacker/calcom-webhook/route";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(
  bodyObj: unknown,
  opts: {
    signature?: string | null;
    secret?: string;
    version?: string | null;
    contentLength?: string;
  } = {}
): NextRequest {
  const raw = JSON.stringify(bodyObj);
  const signature =
    opts.signature !== undefined ? opts.signature : sign(raw, opts.secret ?? WEBHOOK_SECRET);
  return {
    text: async () => raw,
    headers: {
      get: (name: string) => {
        const normalized = name.toLowerCase();
        if (normalized === "x-cal-signature-256") return signature;
        if (normalized === "x-cal-webhook-version") {
          return opts.version === undefined ? "2021-10-20" : opts.version;
        }
        if (normalized === "content-length") return opts.contentLength ?? null;
        return null;
      },
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

const bookingRescheduledBody = {
  triggerEvent: "BOOKING_RESCHEDULED",
  payload: {
    uid: "booking-uid-2",
    rescheduleUid: "booking-uid-1",
    organizer: { email: "mentor@wepac.pt" },
    attendees: [{ email: "member@wepac.pt" }],
    startTime: "2026-08-11T15:00:00.000Z",
    endTime: "2026-08-11T15:45:00.000Z",
  },
};

const mentorRow = { id: "mentor-1", role: "member" };
const attendeeRow = { id: "member-1" };

const originalSecret = process.env.CALCOM_WEBHOOK_SECRET;
const originalIngestEnabled = process.env.CALCOM_SESSION_INGEST_ENABLED;

afterAll(() => {
  if (originalSecret === undefined) delete process.env.CALCOM_WEBHOOK_SECRET;
  else process.env.CALCOM_WEBHOOK_SECRET = originalSecret;
  if (originalIngestEnabled === undefined) {
    delete process.env.CALCOM_SESSION_INGEST_ENABLED;
  } else {
    process.env.CALCOM_SESSION_INGEST_ENABLED = originalIngestEnabled;
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CALCOM_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.CALCOM_SESSION_INGEST_ENABLED = "true";
  sendSessionInviteEmail.mockResolvedValue(undefined);
  sendSessionCancelEmail.mockResolvedValue(undefined);
  resolveSessionAttendeeAuthorization.mockResolvedValue({
    authorized: false,
    source: null,
    mentorshipId: null,
  });
  userFindMany.mockResolvedValue([]);
  txQueryRaw.mockResolvedValue([
    { id: "mentorship-1", menteeId: "member-1" },
  ]);
  persistSessionEvent.mockResolvedValue([
    { notificationId: "notification-1", outboxId: "outbox-1" },
  ]);
  bookingReferenceFindUnique.mockResolvedValue(null);
  bookingReferenceUpsert.mockResolvedValue({ sessionId: "session-1" });
});

describe("POST /api/wepacker/calcom-webhook", () => {
  it("404s before reading the body unless Session ingest is explicitly enabled", async () => {
    process.env.CALCOM_SESSION_INGEST_ENABLED = "false";
    const req = makeRequest(bookingCreatedBody);
    const text = vi.spyOn(req, "text");

    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(text).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

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

  it("rejects an unpinned webhook version before database work", async () => {
    const res = await POST(makeRequest(bookingCreatedBody, { version: "other" }));
    expect(res.status).toBe(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized declared body before reading it", async () => {
    const req = makeRequest(bookingCreatedBody, { contentLength: "262145" });
    const text = vi.spyOn(req, "text");
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(text).not.toHaveBeenCalled();
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
        .mockResolvedValueOnce(attendeeRow) // attendee lookup
        .mockResolvedValueOnce(mentorRow); // write-path organizer revalidation
      resolveSessionAttendeeAuthorization
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        })
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        });
      userFindMany.mockResolvedValue([{ id: "member-1" }]);
      sessionCreate.mockResolvedValueOnce({
        id: "session-1",
        organizer: { id: "mentor-1", name: "Ana Mentor" },
        attendees: [{ userId: "member-1" }],
      });

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ created: true });
      expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledTimes(2);
      expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledWith(
        "mentor-1",
        "member-1"
      );

      const createArgs = sessionCreate.mock.calls[0][0];
      expect(createArgs.data.calcomBookingUid).toBe("booking-uid-1");
      expect(createArgs.data.calcomBookingReferences).toEqual({
        create: { uid: "booking-uid-1" },
      });
      expect(createArgs.data.organizerId).toBe("mentor-1");
      expect(createArgs.data.mentorshipId).toBe("mentorship-1");
      expect(createArgs.data.durationMinutes).toBe(45);
      // Our own generated link, never anything read off the Cal.com payload
      // (which doesn't even carry one here) — mandate is to always mint a
      // fresh Jitsi room.
      expect(typeof createArgs.data.meetingUrl).toBe("string");
      expect(createArgs.data.meetingUrl).not.toContain("cal.com");

      expect(persistSessionEvent).toHaveBeenCalledWith(expect.any(Object), {
        sessionId: "session-1",
        actorId: "mentor-1",
        type: "session_scheduled",
      });
      expect(dispatchPersistedNotificationEvents).toHaveBeenCalledOnce();
    });

    it("skips (200) without creating a Session when the organizer email has no matching User", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      userFindUnique.mockResolvedValueOnce(null); // organizer lookup misses

      try {
        const res = await POST(makeRequest(bookingCreatedBody));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ skipped: "organizer_not_found" });
        expect(sessionCreate).not.toHaveBeenCalled();
        const logged = JSON.stringify(errorSpy.mock.calls);
        expect(logged).toContain("emailHash");
        expect(logged).not.toContain("mentor@wepac.pt");
      } finally {
        errorSpy.mockRestore();
      }
    });

    it("lets a member account organize when the exact directed Mentorship authorizes the attendee", async () => {
      const memberOrganizer = { id: "user-1", role: "member" };
      userFindUnique
        .mockResolvedValueOnce(memberOrganizer)
        .mockResolvedValueOnce(attendeeRow)
        .mockResolvedValueOnce(memberOrganizer);
      resolveSessionAttendeeAuthorization
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        })
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        });
      userFindMany.mockResolvedValue([{ id: "member-1" }]);
      sessionCreate.mockResolvedValueOnce({
        id: "session-member-organizer-1",
        attendees: [{ userId: "member-1" }],
      });

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ created: true });
      expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledWith(
        "user-1",
        "member-1",
      );
      expect(sessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: "user-1",
            mentorshipId: "mentorship-1",
          }),
        }),
      );
    });

    it("drops an attendee who resolves to a real User but has no mentoring relationship with the organizer, and skips the whole booking if none remain", async () => {
      userFindUnique
        .mockResolvedValueOnce(mentorRow) // organizer
        .mockResolvedValueOnce(attendeeRow); // attendee resolves...
      resolveSessionAttendeeAuthorization.mockResolvedValueOnce({
        authorized: false,
        source: null,
        mentorshipId: null,
      });

      const res = await POST(makeRequest(bookingCreatedBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ skipped: "no_authorized_attendees" });
      expect(sessionCreate).not.toHaveBeenCalled();
    });

    it("dedupes resolved People and derives Group from the unique attendee count", async () => {
      const groupBody = {
        ...bookingCreatedBody,
        payload: {
          ...bookingCreatedBody.payload,
          uid: "booking-group-1",
          attendees: [
            { email: "one@wepac.pt" },
            { email: "one+duplicate@wepac.pt" },
            { email: "two@wepac.pt" },
          ],
        },
      };
      const personOne = { id: "person-1" };
      const personTwo = { id: "person-2" };
      userFindUnique
        .mockResolvedValueOnce(mentorRow)
        .mockResolvedValueOnce(personOne)
        .mockResolvedValueOnce(personOne)
        .mockResolvedValueOnce(personTwo)
        .mockResolvedValueOnce(mentorRow);
      resolveSessionAttendeeAuthorization
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        })
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-2",
        })
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        })
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-2",
        });
      userFindMany.mockResolvedValue([{ id: "person-1" }, { id: "person-2" }]);
      txQueryRaw.mockResolvedValueOnce([
        { id: "mentorship-1", menteeId: "person-1" },
        { id: "mentorship-2", menteeId: "person-2" },
      ]);
      sessionCreate.mockResolvedValueOnce({
        id: "session-group-1",
        attendees: [{ userId: "person-1" }, { userId: "person-2" }],
      });

      const res = await POST(makeRequest(groupBody));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ created: true });
      expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledTimes(4);
      expect(sessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mentorshipId: null,
            attendees: {
              create: [{ userId: "person-1" }, { userId: "person-2" }],
            },
          }),
        })
      );
    });

    it("excludes the organizer from attendees even when Cal.com sends the same User", async () => {
      const selfBody = {
        ...bookingCreatedBody,
        payload: {
          ...bookingCreatedBody.payload,
          attendees: [{ email: "mentor@wepac.pt" }],
        },
      };
      userFindUnique
        .mockResolvedValueOnce(mentorRow)
        .mockResolvedValueOnce({ id: "mentor-1" });

      const res = await POST(makeRequest(selfBody));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ skipped: "no_authorized_attendees" });
      expect(resolveSessionAttendeeAuthorization).not.toHaveBeenCalled();
      expect(sessionCreate).not.toHaveBeenCalled();
    });

    it("does not let Admin bypass a missing directed Mentorship", async () => {
      const adminRow = { id: "admin-1", role: "admin" };
      userFindUnique
        .mockResolvedValueOnce(adminRow)
        .mockResolvedValueOnce(attendeeRow);
      resolveSessionAttendeeAuthorization.mockResolvedValueOnce({
        authorized: false,
        source: null,
        mentorshipId: null,
      });

      const res = await POST(makeRequest(bookingCreatedBody));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        skipped: "no_authorized_attendees",
      });
      expect(resolveSessionAttendeeAuthorization).toHaveBeenCalledWith(
        "admin-1",
        "member-1",
      );
      expect(sessionCreate).not.toHaveBeenCalled();
    });

    it("responds 200 { duplicate: true } and does not retry-storm when two concurrent deliveries race into the @unique constraint", async () => {
      userFindUnique
        .mockResolvedValueOnce(mentorRow)
        .mockResolvedValueOnce(attendeeRow)
        .mockResolvedValueOnce(mentorRow);
      resolveSessionAttendeeAuthorization
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        })
        .mockResolvedValueOnce({
          authorized: true,
          source: "mentorship",
          mentorshipId: "mentorship-1",
        });
      userFindMany.mockResolvedValue([{ id: "member-1" }]);
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
      bookingReferenceFindUnique.mockResolvedValueOnce({
        sessionId: "session-1",
      });
      sessionFindUnique.mockResolvedValueOnce({
        calcomBookingUid: "booking-uid-1",
      });
      txQueryRaw.mockResolvedValueOnce([{
        organizerId: "mentor-1",
        status: "scheduled",
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-10T14:00:00.000Z"),
        durationMinutes: 45,
        meetingUrl: "https://meet.jit.si/wepac-session",
      }]);
      sessionUpdate.mockResolvedValueOnce({
        status: "cancelled",
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-10T14:00:00.000Z"),
        durationMinutes: 45,
        meetingUrl: "https://meet.jit.si/wepac-session",
      });

      const res = await POST(makeRequest(bookingCancelledBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ cancelled: true });
      expect(sessionUpdate).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { status: "cancelled" },
        select: {
          status: true,
          kind: true,
          scheduledAt: true,
          durationMinutes: true,
          meetingUrl: true,
        },
      });
      expect(persistSessionEvent).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sessionId: "session-1",
          actorId: "mentor-1",
          type: "session_cancelled",
        }),
      );
    });

    it("skips (200) when no Session matches the calcomBookingUid", async () => {
      sessionFindUnique.mockResolvedValueOnce(null);

      const res = await POST(makeRequest(bookingCancelledBody));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ skipped: "session_not_found" });
      expect(sessionUpdate).not.toHaveBeenCalled();
    });

    it("ignores cancellation of an historical UID after a reschedule", async () => {
      bookingReferenceFindUnique.mockResolvedValueOnce({
        sessionId: "session-1",
      });
      sessionFindUnique.mockResolvedValueOnce({
        calcomBookingUid: "booking-uid-2",
      });

      const res = await POST(makeRequest(bookingCancelledBody));

      expect(await res.json()).toEqual({ skipped: "stale_booking_uid" });
      expect(sessionUpdate).not.toHaveBeenCalled();
      expect(persistSessionEvent).not.toHaveBeenCalled();
    });
  });

  describe("BOOKING_RESCHEDULED", () => {
    it("updates calendar state once and stages a latest-wins Session event", async () => {
      bookingReferenceFindUnique.mockResolvedValueOnce({
        sessionId: "session-1",
      });
      txQueryRaw.mockResolvedValueOnce([{
        organizerId: "mentor-1",
        status: "scheduled",
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-10T14:00:00.000Z"),
        durationMinutes: 60,
        meetingUrl: "https://meet.jit.si/wepac-session",
        calcomBookingUid: "booking-uid-1",
      }]);
      sessionUpdate.mockResolvedValueOnce({
        status: "scheduled",
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-11T15:00:00.000Z"),
        durationMinutes: 45,
        meetingUrl: "https://meet.jit.si/wepac-session",
      });

      const res = await POST(makeRequest(bookingRescheduledBody));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ rescheduled: true });
      expect(bookingReferenceFindUnique).toHaveBeenNthCalledWith(1, {
        where: { uid: "booking-uid-1" },
        select: { sessionId: true },
      });
      expect(sessionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "session-1" },
          data: {
            scheduledAt: new Date("2026-08-11T15:00:00.000Z"),
            durationMinutes: 45,
            calcomBookingUid: "booking-uid-2",
          },
        }),
      );
      expect(persistSessionEvent).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sessionId: "session-1",
          actorId: "mentor-1",
          type: "session_updated",
        }),
      );
      expect(bookingReferenceUpsert).toHaveBeenCalledWith({
        where: { uid: "booking-uid-2" },
        create: { sessionId: "session-1", uid: "booking-uid-2" },
        update: {},
        select: { sessionId: true },
      });
    });

    it("is idempotent when the requested calendar state is already current", async () => {
      bookingReferenceFindUnique.mockResolvedValueOnce({
        sessionId: "session-1",
      });
      txQueryRaw.mockResolvedValueOnce([{
        organizerId: "mentor-1",
        status: "scheduled",
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-11T15:00:00.000Z"),
        durationMinutes: 45,
        meetingUrl: "https://meet.jit.si/wepac-session",
        calcomBookingUid: "booking-uid-2",
      }]);

      const res = await POST(makeRequest(bookingRescheduledBody));

      expect(await res.json()).toEqual({ unchanged: true });
      expect(sessionUpdate).not.toHaveBeenCalled();
      expect(persistSessionEvent).not.toHaveBeenCalled();
    });

    it("does not resurrect a cancelled Session", async () => {
      bookingReferenceFindUnique.mockResolvedValueOnce({
        sessionId: "session-1",
      });
      txQueryRaw.mockResolvedValueOnce([{
        organizerId: "mentor-1",
        status: "cancelled",
        kind: "checkpoint",
        scheduledAt: new Date("2026-08-10T14:00:00.000Z"),
        durationMinutes: 60,
        meetingUrl: null,
      }]);

      const res = await POST(makeRequest(bookingRescheduledBody));

      expect(await res.json()).toEqual({ unchanged: true });
      expect(sessionUpdate).not.toHaveBeenCalled();
      expect(persistSessionEvent).not.toHaveBeenCalled();
    });

    it("returns 400 for a reschedule without a valid start time", async () => {
      const res = await POST(makeRequest({
        triggerEvent: "BOOKING_RESCHEDULED",
        payload: { uid: "booking-uid-1", startTime: "not-a-date" },
      }));

      expect(res.status).toBe(400);
      expect(sessionFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("unhandled trigger events", () => {
    it("ignores (200) trigger events outside the supported lifecycle", async () => {
      const res = await POST(
        makeRequest({ triggerEvent: "BOOKING_PAYMENT_INITIATED", payload: { uid: "x" } })
      );
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json).toEqual({ ignored: true });
    });
  });
});
