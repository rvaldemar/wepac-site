"use server";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma, type SessionKind, type SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  requireUser,
  resolveSessionAttendeeAuthorization,
  type SessionAttendeeAuthorization,
} from "@/lib/wepacker/guards";
import { SESSION_KIND_KEYS } from "@/lib/wepacker/types";
import {
  dispatchPersistedNotificationEvents,
  persistSessionEvent,
  persistSessionFollowupUpdatedEvent,
  sessionTransitionDedupeScope,
  type PersistedNotificationEvent,
} from "@/lib/wepacker/notifications";
import {
  generateMeetingUrl,
  normalizeMeetingUrl,
} from "@/lib/wepacker/meeting-url";

export type SessionFormat = "individual" | "group";

function deriveSessionFormat(attendeeCount: number): SessionFormat {
  return attendeeCount === 1 ? "individual" : "group";
}

function withAttendeeFormat<T extends { attendees: unknown[] }>(session: T) {
  const attendeeCount = session.attendees.length;
  return {
    ...session,
    attendeeCount,
    format: deriveSessionFormat(attendeeCount),
  };
}

// Organizer-facing shape. The full attendee notes are private to the exact
// organizer and must never be reused by an attendee-facing read.
const organizerSessionInclude = {
  attendees: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
  organizer: { select: { id: true, name: true } },
  transcriptUploadedBy: { select: { id: true, name: true } },
} as const;

// A top-level select prevents newly-added sensitive Session scalars from
// silently entering list responses.
const organizerSessionListSelect = {
  id: true,
  cycleId: true,
  mentorshipId: true,
  kind: true,
  scheduledAt: true,
  durationMinutes: true,
  status: true,
  discussionPoints: true,
  meetingUrl: true,
  transcriptUploadedAt: true,
  attendees: {
    select: {
      id: true,
      attended: true,
      privateNote: true,
      sharedNote: true,
      sharedNotePublished: true,
      outcome: true,
      user: { select: { id: true, name: true } },
    },
  },
  organizer: { select: { id: true, name: true } },
  debrief: { select: { id: true, contractVersion: true } },
} as const;

// Attendees receive only their own attendee row. Raw transcripts, uploader
// metadata, private notes, and other attendees are default-denied.
function ownAttendeeSessionSelect(userId: string) {
  return {
    id: true,
    cycleId: true,
    mentorshipId: true,
    kind: true,
    scheduledAt: true,
    durationMinutes: true,
    status: true,
    meetingUrl: true,
    attendees: {
      where: { userId },
      select: {
        id: true,
        attended: true,
        outcome: true,
        sharedNote: true,
        sharedNotePublished: true,
        user: { select: { id: true, name: true } },
      },
    },
    organizer: { select: { id: true, name: true } },
    _count: { select: { attendees: true } },
  } as const;
}

type OwnAttendeeSession = {
  attendees: Array<{
    id: string;
    attended: boolean;
    outcome: string | null;
    sharedNote: string | null;
    sharedNotePublished: boolean;
    user: { id: string; name: string };
  }>;
  _count: { attendees: number };
};

function toAttendeeSessionView<T extends OwnAttendeeSession>(session: T) {
  const { _count, ...safeSession } = session;
  return {
    ...safeSession,
    attendeeCount: _count.attendees,
    format: deriveSessionFormat(_count.attendees),
    attendees: session.attendees.map((attendee) =>
      attendee.sharedNotePublished
        ? attendee
        : { ...attendee, sharedNote: null },
    ),
  };
}

type SessionOrganizerGuard = {
  cycleId: string | null;
  mentorshipId: string | null;
  organizerId: string;
  actorId: string;
};

// Private session artifacts and every session mutation belong to the exact
// organizer. An Admin role is not an implicit artifact grant.
export async function assertSessionOrganizer(
  sessionId: string,
): Promise<SessionOrganizerGuard> {
  const actor = await requireUser();
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { cycleId: true, mentorshipId: true, organizerId: true },
  });
  if (!session) throw new Error("Session not found.");
  if (session.organizerId !== actor.id) throw new Error("Permission denied.");
  return { ...session, actorId: actor.id };
}

export async function getMySessions() {
  const actor = await requireUser();
  const sessions = await prisma.session.findMany({
    where: { attendees: { some: { userId: actor.id } } },
    select: ownAttendeeSessionSelect(actor.id),
    orderBy: { scheduledAt: "desc" },
  });
  return sessions.map(toAttendeeSessionView);
}

export async function getNextSession() {
  const actor = await requireUser();
  const session = await prisma.session.findFirst({
    where: {
      status: "scheduled",
      scheduledAt: { gte: new Date() },
      attendees: { some: { userId: actor.id } },
    },
    select: ownAttendeeSessionSelect(actor.id),
    orderBy: { scheduledAt: "asc" },
  });
  return session ? toAttendeeSessionView(session) : null;
}

// Support preview is a read of the exact attendee-safe projection, not
// impersonation: identity, cookies, and mutation authority stay unchanged.
export async function getSessionAttendeePreview(
  sessionId: string,
  attendeeUserId: string,
) {
  const { actorId } = await assertSessionOrganizer(sessionId);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
      kind: true,
      status: true,
      meetingUrl: true,
      organizer: { select: { id: true, name: true } },
      attendees: {
        where: { userId: attendeeUserId },
        select: {
          outcome: true,
          sharedNote: true,
          sharedNotePublished: true,
          user: { select: { id: true, name: true } },
        },
      },
      _count: { select: { attendees: true } },
    },
  });
  const attendee = session?.attendees[0];
  if (!session || !attendee) return null;

  return {
    viewer: { id: actorId, name: session.organizer.name },
    attendee: attendee.user,
    session: {
      id: session.id,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      attendeeCount: session._count.attendees,
      format: deriveSessionFormat(session._count.attendees),
      kind: session.kind,
      status: session.status,
      organizerName: session.organizer.name,
      outcome: attendee.outcome,
      sharedNote: attendee.sharedNotePublished ? attendee.sharedNote : null,
      meetingUrl: session.meetingUrl,
    },
  };
}

export async function getMentoredSessionDetail(sessionId: string) {
  await assertSessionOrganizer(sessionId);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: organizerSessionInclude,
  });
  return session ? withAttendeeFormat(session) : null;
}

export async function getMentoredSessions() {
  const actor = await requireUser();
  const sessions = await prisma.session.findMany({
    where: { organizerId: actor.id },
    select: organizerSessionListSelect,
    orderBy: { scheduledAt: "desc" },
  });
  return sessions.map(withAttendeeFormat);
}

// Mentorship attendee discovery comes only from active, fully accepted,
// directed Mentorships. Account role never substitutes for the relationship.
export async function getMentoredMembers() {
  const actor = await requireUser();
  const mentorships = await prisma.mentorship.findMany({
    where: {
      mentorId: actor.id,
      menteeId: { not: actor.id },
      status: "active",
      mentorAcceptedAt: { not: null },
      menteeAcceptedAt: { not: null },
      activatedAt: { not: null },
      endedAt: null,
    },
    select: {
      mentee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { activatedAt: "asc" },
  });
  return mentorships.map(({ mentee }) => mentee);
}

// A Cycle facilitator is an explicit capability edge, independent of account
// role. Only accepted, active facilitations for runnable Cycles are exposed.
export async function getFacilitatedCycles() {
  const actor = await requireUser();
  const facilitations = await prisma.cycleFacilitator.findMany({
    where: {
      userId: actor.id,
      status: "active",
      acceptedAt: { not: null },
      endedAt: null,
      cycle: { status: { in: ["published", "active"] } },
    },
    select: {
      role: true,
      cycle: { select: { id: true, name: true, status: true } },
    },
    orderBy: { acceptedAt: "asc" },
  });
  return facilitations.map(({ cycle, role }) => ({
    ...cycle,
    // The relational where clause above is the runtime narrowing Prisma does
    // not currently carry into its generated TypeScript result.
    status: cycle.status as "published" | "active",
    role,
  }));
}

// Navigation discovery follows exact graph authority. Account role is absent:
// an accepted Mentorship-as-mentor, active Cycle Facilitation, or ownership of
// any Session keeps the organizer workspace reachable; Admin alone does not.
export async function canAccessMentorWorkspace() {
  const actor = await requireUser();
  const [mentorship, facilitation, ownedSession] = await Promise.all([
    prisma.mentorship.findFirst({
      where: {
        mentorId: actor.id,
        menteeId: { not: actor.id },
        status: "active",
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: { id: true },
    }),
    prisma.cycleFacilitator.findFirst({
      where: {
        userId: actor.id,
        status: "active",
        acceptedAt: { not: null },
        endedAt: null,
        cycle: { status: { in: ["published", "active"] } },
      },
      select: { id: true },
    }),
    prisma.session.findFirst({
      where: { organizerId: actor.id },
      select: { id: true },
    }),
  ]);
  return Boolean(mentorship || facilitation || ownedSession);
}

const SESSION_PERSON_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cycle context authorizes the facilitator to resolve a known Person by exact
// email for explicit attendance. It does not create an Enrollment, Connection,
// Pack Membership or Mentorship, and never bulk-enumerates People.
export async function getCycleSessionAttendeeCandidate(
  cycleId: string,
  emailInput: string,
) {
  const actor = await requireUser();
  const normalizedCycleId = cycleId.trim();
  const email = emailInput.trim().toLowerCase();
  if (
    !normalizedCycleId ||
    normalizedCycleId.length > 128 ||
    !SESSION_PERSON_EMAIL_PATTERN.test(email) ||
    email.length > 320
  ) {
    throw new Error("Invalid Cycle Session participant.");
  }

  await authorizeCycleContext(
    { id: actor.id },
    normalizedCycleId,
    "Cycle unavailable or permission denied.",
  );

  const candidate = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  return candidate && candidate.id !== actor.id ? candidate : null;
}

function normalizeSessionAttendeeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((userId): userId is string => typeof userId === "string")
        .map((userId) => userId.trim())
        .filter(Boolean),
    ),
  );
}

function assertSessionAttendeeCardinality(attendeeUserIds: string[]): void {
  if (attendeeUserIds.length === 0) {
    throw new Error("Choose at least one attendee.");
  }
  if (attendeeUserIds.length > 50) {
    throw new Error("A Session cannot have more than 50 attendees.");
  }
}

// This module is a Server Actions boundary, so webhook-only exports need their
// own capability check. A valid Cal.com request signature is verified by the
// route; passing the configured secret here prevents either helper from being
// invoked as an unauthenticated Server Action.
function assertWebhookCapability(candidate: string): void {
  const expected = process.env.CALCOM_WEBHOOK_SECRET;
  if (!expected || typeof candidate !== "string") {
    throw new Error("Unauthorized webhook operation.");
  }
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  if (
    candidateBytes.length !== expectedBytes.length ||
    !timingSafeEqual(candidateBytes, expectedBytes)
  ) {
    throw new Error("Unauthorized webhook operation.");
  }
}

type SessionActor = { id: string };

async function authorizeCycleContext(
  actor: SessionActor,
  cycleId: string,
  invalidMessage: string,
): Promise<void> {
  const cycle = await prisma.cycle.findFirst({
    where: {
      id: cycleId,
      status: { in: ["published", "active"] },
    },
    select: { id: true },
  });
  if (!cycle) throw new Error(invalidMessage);

  const facilitator = await prisma.cycleFacilitator.findFirst({
    where: {
      cycleId,
      userId: actor.id,
      status: "active",
      acceptedAt: { not: null },
      endedAt: null,
    },
    select: { id: true },
  });
  if (!facilitator) throw new Error(invalidMessage);
}

async function authorizeSessionAttendees({
  actor,
  attendeeUserIds,
  cycleId,
  invalidMessage,
}: {
  actor: SessionActor;
  attendeeUserIds: string[];
  cycleId?: string | null;
  invalidMessage: string;
}): Promise<{ cycleId: string | null; mentorshipId: string | null }> {
  if (attendeeUserIds.includes(actor.id)) throw new Error(invalidMessage);

  const users = await prisma.user.findMany({
    where: { id: { in: attendeeUserIds, not: actor.id } },
    select: { id: true },
  });
  if (new Set(users.map(({ id }) => id)).size !== attendeeUserIds.length) {
    throw new Error(invalidMessage);
  }

  if (cycleId) {
    // Cycle context authorizes the organizer, not the attendee list. Every
    // attendee is an explicit Person and need not be enrolled in the Cycle.
    await authorizeCycleContext(actor, cycleId, invalidMessage);
    return { cycleId, mentorshipId: null };
  }

  const authorizations: SessionAttendeeAuthorization[] = await Promise.all(
    attendeeUserIds.map((attendeeUserId) =>
      resolveSessionAttendeeAuthorization(actor.id, attendeeUserId),
    ),
  );
  if (authorizations.some(({ authorized }) => !authorized)) {
    throw new Error(invalidMessage);
  }

  const soleAuthorization =
    attendeeUserIds.length === 1 ? authorizations[0] : undefined;
  return {
    cycleId: null,
    mentorshipId:
      soleAuthorization?.source === "mentorship"
        ? soleAuthorization.mentorshipId
        : null,
  };
}

// Repeat the exact capability proof inside the write transaction. The earlier
// check provides fast feedback, but is not an authorization boundary: a
// Mentorship or Cycle Facilitation can be revoked between that check and the
// Session insert.
async function revalidateSessionAttendeesInTransaction(
  tx: Prisma.TransactionClient,
  {
    actor,
    attendeeUserIds,
    cycleId,
    invalidMessage,
  }: {
    actor: SessionActor;
    attendeeUserIds: string[];
    cycleId?: string | null;
    invalidMessage: string;
  },
): Promise<{ cycleId: string | null; mentorshipId: string | null }> {
  if (attendeeUserIds.includes(actor.id)) throw new Error(invalidMessage);

  const users = await tx.user.findMany({
    where: { id: { in: attendeeUserIds, not: actor.id } },
    select: { id: true },
  });
  if (new Set(users.map(({ id }) => id)).size !== attendeeUserIds.length) {
    throw new Error(invalidMessage);
  }

  if (cycleId) {
    const lockedCapability = await tx.$queryRaw<
      Array<{ cycleId: string; facilitatorId: string }>
    >(Prisma.sql`
      SELECT
        c."id" AS "cycleId",
        cf."id" AS "facilitatorId"
      FROM "cycles" c
      INNER JOIN "cycle_facilitators" cf
        ON cf."cycleId" = c."id"
      WHERE c."id" = ${cycleId}
        AND c."status" IN ('published', 'active')
        AND cf."userId" = ${actor.id}
        AND cf."status" = 'active'
        AND cf."acceptedAt" IS NOT NULL
        AND cf."endedAt" IS NULL
      FOR SHARE OF c, cf
    `);
    if (lockedCapability.length !== 1) throw new Error(invalidMessage);
    return { cycleId, mentorshipId: null };
  }

  const mentorships = await tx.$queryRaw<
    Array<{ id: string; menteeId: string }>
  >(Prisma.sql`
    SELECT "id", "menteeId"
    FROM "mentorships"
    WHERE "mentorId" = ${actor.id}
      AND "menteeId" IN (${Prisma.join(attendeeUserIds)})
      AND "status" = 'active'
      AND "mentorAcceptedAt" IS NOT NULL
      AND "menteeAcceptedAt" IS NOT NULL
      AND "activatedAt" IS NOT NULL
      AND "endedAt" IS NULL
    FOR SHARE
  `);
  const byMenteeId = new Map(
    mentorships.map((mentorship) => [mentorship.menteeId, mentorship.id]),
  );
  if (attendeeUserIds.some((userId) => !byMenteeId.has(userId))) {
    throw new Error(invalidMessage);
  }
  return {
    cycleId: null,
    mentorshipId:
      attendeeUserIds.length === 1
        ? (byMenteeId.get(attendeeUserIds[0]) ?? null)
        : null,
  };
}

type SessionCreateInput = {
  cycleId?: string;
  kind?: SessionKind;
  scheduledAt: string;
  durationMinutes?: number;
  discussionPoints?: string;
  attendeeUserIds: string[];
};

type ParsedSessionCreate = {
  cycleId: string | null;
  kind: SessionKind;
  scheduledAt: Date;
  durationMinutes: number;
  discussionPoints: string | null;
  attendeeUserIds: string[];
};

const SESSION_CREATE_KEYS = new Set<keyof SessionCreateInput>([
  "cycleId",
  "kind",
  "scheduledAt",
  "durationMinutes",
  "discussionPoints",
  "attendeeUserIds",
]);

function parseSessionCreateData(input: unknown): ParsedSessionCreate {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid Session data.");
  }
  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!SESSION_CREATE_KEYS.has(key as keyof SessionCreateInput)) {
      throw new Error("Invalid Session fields.");
    }
  }

  const attendeeUserIds = normalizeSessionAttendeeIds(raw.attendeeUserIds);
  assertSessionAttendeeCardinality(attendeeUserIds);

  if (typeof raw.scheduledAt !== "string" || !raw.scheduledAt.trim()) {
    throw new Error("Invalid Session date.");
  }
  const scheduledAt = new Date(raw.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid Session date.");
  }

  const durationMinutes = raw.durationMinutes ?? 60;
  if (
    typeof durationMinutes !== "number" ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 1_440
  ) {
    throw new Error("Invalid Session duration.");
  }

  const kind = raw.kind ?? "checkpoint";
  if (
    typeof kind !== "string" ||
    !SESSION_KIND_KEYS.includes(kind as (typeof SESSION_KIND_KEYS)[number])
  ) {
    throw new Error("Invalid Session kind.");
  }

  if (
    raw.cycleId !== undefined &&
    (typeof raw.cycleId !== "string" || !raw.cycleId.trim())
  ) {
    throw new Error("Invalid Cycle.");
  }
  if (
    raw.discussionPoints !== undefined &&
    (typeof raw.discussionPoints !== "string" ||
      raw.discussionPoints.length > 30_000)
  ) {
    throw new Error("Invalid discussion points.");
  }

  return {
    cycleId:
      typeof raw.cycleId === "string" ? raw.cycleId.trim() || null : null,
    kind: kind as SessionKind,
    scheduledAt,
    durationMinutes,
    discussionPoints:
      typeof raw.discussionPoints === "string"
        ? raw.discussionPoints.trim() || null
        : null,
    attendeeUserIds,
  };
}

export async function createSession(data: SessionCreateInput) {
  const parsed = parseSessionCreateData(data);
  const actor = await requireUser();
  await authorizeSessionAttendees({
    actor,
    attendeeUserIds: parsed.attendeeUserIds,
    cycleId: parsed.cycleId,
    invalidMessage: "Invalid attendees for this Session.",
  });

  const result = await prisma.$transaction(async (tx) => {
    const context = await revalidateSessionAttendeesInTransaction(tx, {
      actor,
      attendeeUserIds: parsed.attendeeUserIds,
      cycleId: parsed.cycleId,
      invalidMessage: "Invalid attendees for this Session.",
    });
    const session = await tx.session.create({
      data: {
        cycleId: context.cycleId,
        mentorshipId: context.mentorshipId,
        organizerId: actor.id,
        kind: parsed.kind,
        scheduledAt: parsed.scheduledAt,
        durationMinutes: parsed.durationMinutes,
        discussionPoints: parsed.discussionPoints,
        meetingUrl: generateMeetingUrl(),
        attendees: {
          create: parsed.attendeeUserIds.map((userId) => ({ userId })),
        },
      },
      include: organizerSessionInclude,
    });
    const events = await persistSessionEvent(tx, {
      sessionId: session.id,
      actorId: actor.id,
      type: "session_scheduled",
    });
    return { session, events };
  });

  dispatchPersistedNotificationEvents(result.events);
  return withAttendeeFormat(result.session);
}

// HMAC-authenticated webhook counterpart. It cannot rely on a browser session,
// so it re-resolves the organizer and relationships before every write.
export async function createSessionFromResolvedActors(data: {
  webhookSecret: string;
  organizerId: string;
  kind?: SessionKind;
  scheduledAt: Date;
  durationMinutes?: number;
  attendeeUserIds: string[];
  calcomBookingUid: string;
}) {
  assertWebhookCapability(data.webhookSecret);
  const attendeeUserIds = normalizeSessionAttendeeIds(data.attendeeUserIds);
  assertSessionAttendeeCardinality(attendeeUserIds);
  if (
    data.kind !== undefined &&
    !SESSION_KIND_KEYS.includes(data.kind)
  ) {
    throw new Error("Invalid Session kind.");
  }
  if (Number.isNaN(data.scheduledAt.getTime())) {
    throw new Error("Invalid Session date.");
  }
  const durationMinutes = data.durationMinutes ?? 60;
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 1_440
  ) {
    throw new Error("Invalid Session duration.");
  }
  if (
    typeof data.calcomBookingUid !== "string" ||
    !data.calcomBookingUid.trim()
  ) {
    throw new Error("Invalid booking UID.");
  }

  const actor = await prisma.user.findUnique({
    where: { id: data.organizerId },
    select: { id: true },
  });
  if (!actor) throw new Error("Invalid Session organizer.");
  await authorizeSessionAttendees({
    actor,
    attendeeUserIds,
    invalidMessage: "Invalid attendees for this Session.",
  });

  const result = await prisma.$transaction(async (tx) => {
    const context = await revalidateSessionAttendeesInTransaction(tx, {
      actor,
      attendeeUserIds,
      invalidMessage: "Invalid attendees for this Session.",
    });
    const session = await tx.session.create({
      data: {
        mentorshipId: context.mentorshipId,
        organizerId: actor.id,
        kind: data.kind ?? "checkpoint",
        scheduledAt: data.scheduledAt,
        durationMinutes,
        meetingUrl: generateMeetingUrl(),
        calcomBookingUid: data.calcomBookingUid,
        calcomBookingReferences: {
          create: { uid: data.calcomBookingUid },
        },
        attendees: { create: attendeeUserIds.map((userId) => ({ userId })) },
      },
      include: organizerSessionInclude,
    });
    const events = await persistSessionEvent(tx, {
      sessionId: session.id,
      actorId: actor.id,
      type: "session_scheduled",
    });
    return { session, events };
  });

  dispatchPersistedNotificationEvents(result.events);
  return withAttendeeFormat(result.session);
}

export async function cancelSessionFromWebhook(
  sessionId: string,
  webhookSecret: string,
): Promise<{ id: string; alreadyCancelled: boolean } | null> {
  assertWebhookCapability(webhookSecret);
  const transitionId = randomUUID();
  const result = await prisma.$transaction(async (tx) => {
    const beforeRows = await tx.$queryRaw<
      Array<{
        organizerId: string;
        status: SessionStatus;
        kind: SessionKind;
        scheduledAt: Date;
        durationMinutes: number;
        meetingUrl: string | null;
      }>
    >(Prisma.sql`
      SELECT
        "mentorId" AS "organizerId",
        "status",
        "kind",
        "scheduledAt",
        "durationMinutes",
        "meetingUrl"
      FROM "sessions"
      WHERE "id" = ${sessionId}
      FOR UPDATE
    `);
    const before = beforeRows[0] ?? null;
    if (!before) return { response: null, events: [] };
    if (before.status === "cancelled") {
      return {
        response: { id: sessionId, alreadyCancelled: true },
        events: [],
      };
    }

    const updated = await tx.session.update({
      where: { id: sessionId },
      data: { status: "cancelled" },
      select: {
        status: true,
        kind: true,
        scheduledAt: true,
        durationMinutes: true,
        meetingUrl: true,
      },
    });
    const events = await persistSessionEvent(tx, {
      sessionId,
      actorId: before.organizerId,
      type: "session_cancelled",
      dedupeScope: sessionTransitionDedupeScope(
        before,
        updated,
        transitionId,
      ),
    });
    return {
      response: { id: sessionId, alreadyCancelled: false },
      events,
    };
  });

  dispatchPersistedNotificationEvents(result.events);
  return result.response;
}

export async function rescheduleSessionFromWebhook(
  sessionId: string,
  webhookSecret: string,
  data: {
    scheduledAt: Date;
    durationMinutes: number;
    calcomBookingUid: string;
  },
): Promise<{ id: string; alreadyCurrent: boolean } | null> {
  assertWebhookCapability(webhookSecret);
  if (Number.isNaN(data.scheduledAt.getTime())) {
    throw new Error("Invalid Session date.");
  }
  if (
    !Number.isInteger(data.durationMinutes) ||
    data.durationMinutes < 15 ||
    data.durationMinutes > 1_440
  ) {
    throw new Error("Invalid Session duration.");
  }
  const calcomBookingUid = data.calcomBookingUid.trim();
  if (!calcomBookingUid) {
    throw new Error("Invalid booking UID.");
  }

  const transitionId = randomUUID();
  const result = await prisma.$transaction(async (tx) => {
    const beforeRows = await tx.$queryRaw<
      Array<{
        organizerId: string;
        status: SessionStatus;
        kind: SessionKind;
        scheduledAt: Date;
        durationMinutes: number;
        meetingUrl: string | null;
        calcomBookingUid: string | null;
      }>
    >(Prisma.sql`
      SELECT
        "mentorId" AS "organizerId",
        "status",
        "kind",
        "scheduledAt",
        "durationMinutes",
        "meetingUrl",
        "calcomBookingUid"
      FROM "sessions"
      WHERE "id" = ${sessionId}
      FOR UPDATE
    `);
    const before = beforeRows[0] ?? null;
    if (!before) return { response: null, events: [] };

    const bookingReference = await tx.calcomBookingReference.upsert({
      where: { uid: calcomBookingUid },
      create: { sessionId, uid: calcomBookingUid },
      update: {},
      select: { sessionId: true },
    });
    if (bookingReference.sessionId !== sessionId) {
      throw new Error("Booking UID belongs to a different Session.");
    }

    // A reschedule cannot resurrect a Session whose cancellation/completion
    // already won. Replayed webhook deliveries are also no-ops once the
    // requested calendar state is current.
    if (
      before.status !== "scheduled" ||
      (before.scheduledAt.getTime() === data.scheduledAt.getTime() &&
        before.durationMinutes === data.durationMinutes &&
        before.calcomBookingUid === calcomBookingUid)
    ) {
      return {
        response: { id: sessionId, alreadyCurrent: true },
        events: [],
      };
    }

    const updated = await tx.session.update({
      where: { id: sessionId },
      data: {
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        calcomBookingUid,
      },
      select: {
        status: true,
        kind: true,
        scheduledAt: true,
        durationMinutes: true,
        meetingUrl: true,
      },
    });
    const events = await persistSessionEvent(tx, {
      sessionId,
      actorId: before.organizerId,
      type: "session_updated",
      dedupeScope: sessionTransitionDedupeScope(
        before,
        updated,
        transitionId,
      ),
    });
    return {
      response: { id: sessionId, alreadyCurrent: false },
      events,
    };
  });

  dispatchPersistedNotificationEvents(result.events);
  return result.response;
}

type SessionUpdatePayload = {
  status?: SessionStatus;
  kind?: SessionKind;
  discussionPoints?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetingUrl?: string | null;
};

type ParsedSessionUpdate = Omit<SessionUpdatePayload, "scheduledAt"> & {
  scheduledAt?: Date;
};

const SESSION_UPDATE_KEYS = new Set<keyof SessionUpdatePayload>([
  "status",
  "kind",
  "discussionPoints",
  "scheduledAt",
  "durationMinutes",
  "meetingUrl",
]);
const SESSION_STATUS_KEYS: readonly SessionStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
];

function parseSessionUpdateData(input: unknown): ParsedSessionUpdate {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid Session data.");
  }
  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!SESSION_UPDATE_KEYS.has(key as keyof SessionUpdatePayload)) {
      throw new Error("Invalid Session fields.");
    }
  }

  const parsed: ParsedSessionUpdate = {};
  if (raw.status !== undefined) {
    if (
      typeof raw.status !== "string" ||
      !SESSION_STATUS_KEYS.includes(raw.status as SessionStatus)
    ) {
      throw new Error("Invalid Session status.");
    }
    parsed.status = raw.status as SessionStatus;
  }
  if (raw.kind !== undefined) {
    if (
      typeof raw.kind !== "string" ||
      !SESSION_KIND_KEYS.includes(
        raw.kind as (typeof SESSION_KIND_KEYS)[number],
      )
    ) {
      throw new Error("Invalid Session kind.");
    }
    parsed.kind = raw.kind as SessionKind;
  }
  if (raw.discussionPoints !== undefined) {
    if (
      typeof raw.discussionPoints !== "string" ||
      raw.discussionPoints.length > 30_000
    ) {
      throw new Error("Invalid discussion points.");
    }
    parsed.discussionPoints = raw.discussionPoints.trim();
  }
  if (raw.scheduledAt !== undefined) {
    if (typeof raw.scheduledAt !== "string" || !raw.scheduledAt.trim()) {
      throw new Error("Invalid Session date.");
    }
    const scheduledAt = new Date(raw.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error("Invalid Session date.");
    }
    parsed.scheduledAt = scheduledAt;
  }
  if (raw.durationMinutes !== undefined) {
    if (
      typeof raw.durationMinutes !== "number" ||
      !Number.isInteger(raw.durationMinutes) ||
      raw.durationMinutes < 15 ||
      raw.durationMinutes > 1_440
    ) {
      throw new Error("Invalid Session duration.");
    }
    parsed.durationMinutes = raw.durationMinutes;
  }
  if (raw.meetingUrl !== undefined) {
    if (raw.meetingUrl !== null && typeof raw.meetingUrl !== "string") {
      throw new Error("Invalid Session link.");
    }
    const trimmed = raw.meetingUrl?.trim() ?? "";
    parsed.meetingUrl = trimmed ? normalizeMeetingUrl(trimmed) : null;
  }
  return parsed;
}

export async function updateSession(
  sessionId: string,
  rawData: SessionUpdatePayload,
) {
  const { actorId } = await assertSessionOrganizer(sessionId);
  const data = parseSessionUpdateData(rawData);
  const transitionId = randomUUID();
  const result = await prisma.$transaction(async (tx) => {
    const needsBeforeSnapshot =
      data.scheduledAt !== undefined ||
      data.status !== undefined ||
      data.kind !== undefined ||
      data.durationMinutes !== undefined ||
      data.meetingUrl !== undefined;
    const before = needsBeforeSnapshot
      ? (
          await tx.$queryRaw<
            Array<{
              kind: SessionKind;
              scheduledAt: Date;
              durationMinutes: number;
              status: SessionStatus;
              meetingUrl: string | null;
            }>
          >(Prisma.sql`
            SELECT
              "kind",
              "scheduledAt",
              "durationMinutes",
              "status",
              "meetingUrl"
            FROM "sessions"
            WHERE "id" = ${sessionId}
            FOR UPDATE
          `)
        )[0] ?? null
      : null;

    const updated = await tx.session.update({
      where: { id: sessionId },
      data,
      select: {
        id: true,
        kind: true,
        scheduledAt: true,
        durationMinutes: true,
        status: true,
        meetingUrl: true,
      },
    });
    const justCancelled =
      data.status === "cancelled" &&
      before !== null &&
      before.status !== "cancelled";
    const reactivated =
      data.status === "scheduled" &&
      before !== null &&
      before.status !== "scheduled" &&
      updated.status === "scheduled";
    const scheduleChanged =
      !justCancelled &&
      !reactivated &&
      before !== null &&
      ((data.scheduledAt !== undefined &&
        before.scheduledAt.getTime() !== updated.scheduledAt.getTime()) ||
        (data.durationMinutes !== undefined &&
          before.durationMinutes !== updated.durationMinutes));
    const meetingUrlChanged =
      !justCancelled &&
      !reactivated &&
      !scheduleChanged &&
      data.meetingUrl !== undefined &&
      before !== null &&
      before.meetingUrl !== updated.meetingUrl;
    const kindChanged =
      !justCancelled &&
      !reactivated &&
      !scheduleChanged &&
      !meetingUrlChanged &&
      data.kind !== undefined &&
      before !== null &&
      before.kind !== updated.kind;

    let events: PersistedNotificationEvent[] = [];
    if (before) {
      const dedupeScope = sessionTransitionDedupeScope(
        before,
        updated,
        transitionId,
      );
      if (justCancelled) {
        events = await persistSessionEvent(tx, {
          sessionId,
          actorId,
          type: "session_cancelled",
          dedupeScope,
        });
      } else if (reactivated) {
        events = await persistSessionEvent(tx, {
          sessionId,
          actorId,
          type: "session_scheduled",
          dedupeScope,
        });
      } else if (
        updated.status === "scheduled" &&
        (scheduleChanged || meetingUrlChanged || kindChanged)
      ) {
        events = await persistSessionEvent(tx, {
          sessionId,
          actorId,
          type: "session_updated",
          dedupeScope,
        });
      }
    }
    return { id: updated.id, events };
  });

  dispatchPersistedNotificationEvents(result.events);
  return { id: result.id };
}

export async function setAttendance(
  sessionId: string,
  userId: string,
  attended: boolean,
) {
  await assertSessionOrganizer(sessionId);
  return prisma.sessionAttendee.update({
    where: { sessionId_userId: { sessionId, userId } },
    data: { attended },
  });
}

export async function updateSessionAttendee(
  sessionId: string,
  userId: string,
  rawData: {
    attended?: boolean;
    privateNote?: string;
    sharedNote?: string;
    sharedNotePublished?: boolean;
    outcome?: string;
  },
) {
  const { actorId } = await assertSessionOrganizer(sessionId);
  const data = parseSessionAttendeeUpdate(rawData);
  const result = await prisma.$transaction(async (tx) => {
    const touchesAttendeeVisibleFollowup =
      data.sharedNote !== undefined ||
      data.sharedNotePublished !== undefined ||
      data.outcome !== undefined;
    const beforeRows = touchesAttendeeVisibleFollowup
      ? await tx.$queryRaw<
          Array<{
            sharedNote: string | null;
            sharedNotePublished: boolean;
            outcome: string | null;
            followupRevision: number;
          }>
        >(Prisma.sql`
          SELECT
            "sharedNote",
            "sharedNotePublished",
            "outcome",
            "followupRevision"
          FROM "session_attendees"
          WHERE "sessionId" = ${sessionId}
            AND "userId" = ${userId}
          FOR UPDATE
        `)
      : [];
    const before = beforeRows[0] ?? null;
    if (touchesAttendeeVisibleFollowup && !before) {
      throw new Error("Invalid attendee update.");
    }

    const nextSharedNotePublished =
      data.sharedNotePublished ?? before?.sharedNotePublished ?? false;
    const nextSharedNote = data.sharedNote ?? before?.sharedNote ?? null;
    if (nextSharedNotePublished && !nextSharedNote?.trim()) {
      throw new Error("A published shared note cannot be empty.");
    }
    const sharedNoteVisibilityChanged = Boolean(
      before &&
        (before.sharedNotePublished !== nextSharedNotePublished ||
          (nextSharedNotePublished &&
            data.sharedNote !== undefined &&
            before.sharedNote?.trim() !== (nextSharedNote ?? "").trim())),
    );
    const outcomeChanged = Boolean(
      before &&
        data.outcome !== undefined &&
        before.outcome?.trim() !== data.outcome.trim(),
    );
    const attendeeVisibleFollowupChanged =
      sharedNoteVisibilityChanged || outcomeChanged;
    const updated = await tx.sessionAttendee.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: attendeeVisibleFollowupChanged
        ? { ...data, followupRevision: { increment: 1 } }
        : data,
    });
    const events = attendeeVisibleFollowupChanged && before
      ? await persistSessionFollowupUpdatedEvent(tx, {
          sessionId,
          recipientId: userId,
          actorId,
          transitionScope: `${before.followupRevision}->${updated.followupRevision}`,
        })
      : [];
    return { updated, events };
  });

  dispatchPersistedNotificationEvents(result.events);
  return result.updated;
}

type SessionAttendeeUpdate = {
  attended?: boolean;
  privateNote?: string;
  sharedNote?: string;
  sharedNotePublished?: boolean;
  outcome?: string;
};

const SESSION_ATTENDEE_UPDATE_KEYS = new Set<keyof SessionAttendeeUpdate>([
  "attended",
  "privateNote",
  "sharedNote",
  "sharedNotePublished",
  "outcome",
]);

function parseSessionAttendeeUpdate(input: unknown): SessionAttendeeUpdate {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid attendee update.");
  }
  const raw = input as Record<string, unknown>;
  const keys = Object.keys(raw);
  if (keys.length === 0) throw new Error("Invalid attendee update.");
  for (const key of keys) {
    if (!SESSION_ATTENDEE_UPDATE_KEYS.has(key as keyof SessionAttendeeUpdate)) {
      throw new Error("Invalid attendee update fields.");
    }
  }

  const parsed: SessionAttendeeUpdate = {};
  for (const key of ["attended", "sharedNotePublished"] as const) {
    if (raw[key] !== undefined) {
      if (typeof raw[key] !== "boolean") {
        throw new Error("Invalid attendee update.");
      }
      parsed[key] = raw[key];
    }
  }

  const textLimits = {
    privateNote: 30_000,
    sharedNote: 30_000,
    outcome: 10_000,
  } as const;
  for (const key of Object.keys(textLimits) as Array<keyof typeof textLimits>) {
    if (raw[key] !== undefined) {
      if (
        typeof raw[key] !== "string" ||
        raw[key].length > textLimits[key]
      ) {
        throw new Error("Invalid attendee update.");
      }
      parsed[key] = raw[key].trim();
    }
  }

  return parsed;
}
