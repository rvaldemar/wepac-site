"use server";

import { prisma } from "@/lib/db";
import type { SessionKind, SessionStatus, SessionType } from "@prisma/client";
import {
  assertMentorOfCohort,
  getMentoredCohortIds,
  requireRole,
  requireUser,
  resolveSessionAttendeeAuthorization,
  type SessionAttendeeAuthorization,
} from "@/lib/wepacker/guards";
import { SESSION_KIND_KEYS, SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import {
  buildSessionCancelIcs,
  buildSessionInviteIcs,
  nextIcsSequence,
  type IcsPerson,
} from "@/lib/wepacker/ics";
import {
  sendSessionCancelEmail,
  sendSessionInviteEmail,
  sendSharedNotePublishedEmail,
} from "@/lib/email";
import { logSafeError } from "@/lib/wepacker/log-safe-error";
import { generateMeetingUrl } from "@/lib/wepacker/meeting-url";

// Full attendee shape — mentor-facing only. Includes every field,
// including privateNote, so this must never be reused for a member-facing
// read path.
const mentorSessionInclude = {
  attendees: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
  mentor: { select: { id: true, name: true } },
  transcriptUploadedBy: { select: { id: true, name: true } },
  // Presence-only — lets the sessions list show "Ver debrief" vs "Gerar
  // debrief" without a second query. The payload itself is never
  // included here.
  debrief: { select: { id: true } },
} as const;

// The Sessions index needs lifecycle metadata and editable attendee fields,
// but never the raw transcript body. Keep this as a top-level select so a new
// sensitive Session scalar cannot silently ride into every list response.
const mentorSessionListSelect = {
  id: true,
  cohortId: true,
  sessionType: true,
  kind: true,
  scheduledAt: true,
  durationMinutes: true,
  status: true,
  notes: true,
  notesPublished: true,
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
  mentor: { select: { id: true, name: true } },
  debrief: { select: { id: true } },
} as const;

// Member-facing session shape: an explicit top-level `select` (default-
// deny) enumerating only member-safe Session scalars, instead of an
// `include` — an `include` returns every Session scalar column
// automatically, which would silently leak any future sensitive column
// (transcript, transcriptUploadedAt, transcriptUploadedById) to a member
// the moment it's added to the schema. Attendees are scoped to the
// requesting user's own row only (never another attendee's), and never
// select privateNote — that field is mentor-only and must not cross the
// server/client boundary. sharedNote/sharedNotePublished are still
// selected raw here; callers must run the result through
// `maskUnpublishedNotes` before returning.
function ownAttendeeSessionSelect(userId: string) {
  return {
    id: true,
    cohortId: true,
    sessionType: true,
    kind: true,
    scheduledAt: true,
    durationMinutes: true,
    status: true,
    notes: true,
    notesPublished: true,
    discussionPoints: true,
    // Inert to the member — no privacy concerns like privateNote — so it's
    // safe to select here unlike transcript/transcriptUploadedAt below.
    meetingUrl: true,
    // transcript / transcriptUploadedAt / transcriptUploadedById are
    // deliberately NOT selected — mentor-only, never member-visible.
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
    mentor: { select: { id: true, name: true } },
  } as const;
}

type OwnAttendeeSession = {
  attendees: {
    id: string;
    attended: boolean;
    outcome: string | null;
    sharedNote: string | null;
    sharedNotePublished: boolean;
    user: { id: string; name: string };
  }[];
};

// A member should only ever see their shared note once the mentor has
// published it — hide it otherwise, even though it was fetched. The same
// applies to the legacy session-level notes blob: unpublished notes must
// not cross the server/client boundary at all.
function maskUnpublishedNotes<
  T extends OwnAttendeeSession & {
    notes: string | null;
    notesPublished: boolean;
    discussionPoints: string | null;
  },
>(session: T): T {
  return {
    ...session,
    notes: session.notesPublished ? session.notes : null,
    discussionPoints: session.notesPublished ? session.discussionPoints : null,
    attendees: session.attendees.map((a) =>
      a.sharedNotePublished ? a : { ...a, sharedNote: null },
    ),
  };
}

// A session's mentor gate: cohort-scoped sessions defer to the cohort
// guard; a session without a cohort (a personal mentoring session) is
// only editable by the mentor who created it, or an admin. Exported so
// other action modules (e.g. task creation from a session outcome) can
// reuse the exact same check instead of re-deriving it.
export async function assertMentorOfSession(sessionId: string): Promise<{
  cohortId: string | null;
  mentorshipId: string | null;
  mentorId: string;
}> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { cohortId: true, mentorshipId: true, mentorId: true },
  });
  if (!session) throw new Error("Sessão não encontrada.");

  // A direct Mentorship Session remains private to its organizer even when it
  // also carries optional Cycle context. Routing it through the broad legacy
  // Cohort guard would expose transcript, debrief, and private attendee notes
  // to every co-mentor in that Cycle.
  if (session.mentorshipId) {
    const actor = await requireUser();
    if (actor.role !== "admin" && actor.id !== session.mentorId) {
      throw new Error("Sem permissão.");
    }
  } else if (session.cohortId) {
    await assertMentorOfCohort(session.cohortId);
  } else {
    const actor = await requireUser();
    if (actor.role !== "admin" && actor.id !== session.mentorId) {
      throw new Error("Sem permissão.");
    }
  }
  return session;
}

// Raw transcripts and AI-derived debriefs are organizer-private. Neither a
// broad Admin role nor being another facilitator in the same legacy Cohort is
// an Artifact Grant. A future audited break-glass flow must use a separate,
// explicit capability rather than weakening this guard.
export async function assertSessionOrganizer(sessionId: string): Promise<{
  cohortId: string | null;
  mentorshipId: string | null;
  mentorId: string;
  actorId: string;
}> {
  const actor = await requireRole(["mentor", "admin"]);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { cohortId: true, mentorshipId: true, mentorId: true },
  });
  if (!session) throw new Error("Sessão não encontrada.");
  if (session.mentorId !== actor.id) throw new Error("Sem permissão.");
  return { ...session, actorId: actor.id };
}

export async function getMySessions() {
  const user = await requireUser();
  const sessions = await prisma.session.findMany({
    where: {
      attendees: { some: { userId: user.id } },
    },
    select: ownAttendeeSessionSelect(user.id),
    orderBy: { scheduledAt: "desc" },
  });
  return sessions.map(maskUnpublishedNotes);
}

export async function getNextSession() {
  const user = await requireUser();
  const session = await prisma.session.findFirst({
    where: {
      status: "scheduled",
      attendees: { some: { userId: user.id } },
    },
    select: ownAttendeeSessionSelect(user.id),
    orderBy: { scheduledAt: "asc" },
  });
  return session ? maskUnpublishedNotes(session) : null;
}

// Read-only support preview for one explicit attendee of one organizer-owned
// Session. This is deliberately not a general `asUserId` path: it returns the
// same narrow projection used by the attendee-facing Sessions UI, without
// changing cookies/JWT identity or exposing any mutable member action.
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
      sessionType: true,
      kind: true,
      status: true,
      notes: true,
      notesPublished: true,
      discussionPoints: true,
      meetingUrl: true,
      mentor: { select: { id: true, name: true } },
      attendees: {
        where: { userId: attendeeUserId },
        select: {
          outcome: true,
          sharedNote: true,
          sharedNotePublished: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  const attendee = session?.attendees[0];
  if (!session || !attendee) return null;

  return {
    viewer: { id: actorId, name: session.mentor.name },
    attendee: attendee.user,
    session: {
      id: session.id,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      sessionType: session.sessionType,
      kind: session.kind,
      status: session.status,
      mentorName: session.mentor.name,
      notes: session.notesPublished ? session.notes : null,
      notesPublished: session.notesPublished,
      discussionPoints: session.notesPublished
        ? session.discussionPoints
        : null,
      outcome: attendee.outcome,
      sharedNote: attendee.sharedNotePublished ? attendee.sharedNote : null,
      meetingUrl: session.meetingUrl,
    },
  };
}

// Single session, mentor-facing, with the transcript lifecycle metadata
// and any existing debrief draft — powers the transcript/debrief review
// workspace at mentor/sessions/[id]. The stricter organizer guard prevents a
// co-facilitator or broad Admin role from reading its transcript/debrief.
export async function getMentoredSessionDetail(sessionId: string) {
  await assertSessionOrganizer(sessionId);
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: { ...mentorSessionInclude, debrief: true },
  });
}

// Sessions across every cohort the actor mentors, plus every personal
// (cohort-less) session they created themselves (admin sees all).
export async function getMentoredSessions() {
  const actor = await requireUser();
  if (actor.role === "admin") {
    return prisma.session.findMany({
      select: mentorSessionListSelect,
      orderBy: { scheduledAt: "desc" },
    });
  }
  const mentoredCohortIds = await getMentoredCohortIds(actor.id);
  return prisma.session.findMany({
    where: {
      OR: [
        { cohortId: { in: mentoredCohortIds }, mentorshipId: null },
        { mentorId: actor.id },
      ],
    },
    select: mentorSessionListSelect,
    orderBy: { scheduledAt: "desc" },
  });
}

// Every person (deduplicated) available to the actor for Session scheduling.
// Active, fully accepted Mentorships are the primary source; active legacy
// Cohort mentor/member pairs remain a measured compatibility fallback during
// migration. Admin sees every other user directly.
export async function getMentoredMembers() {
  const actor = await requireRole(["mentor", "admin"]);
  if (actor.role === "admin") {
    return prisma.user.findMany({
      where: { id: { not: actor.id } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
  }

  const [mentorships, mentoredCohortIds] = await Promise.all([
    prisma.mentorship.findMany({
      where: {
        mentorId: actor.id,
        menteeId: { not: actor.id },
        status: "active",
        reviewRequired: false,
        mentorAcceptedAt: { not: null },
        menteeAcceptedAt: { not: null },
        activatedAt: { not: null },
        endedAt: null,
      },
      select: {
        menteeId: true,
        mentee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { activatedAt: "asc" },
    }),
    getMentoredCohortIds(actor.id),
  ]);

  const memberships = await prisma.cohortMembership.findMany({
    where: {
      role: "member",
      status: "active",
      userId: { not: actor.id },
      cohortId: { in: mentoredCohortIds },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const byUser = new Map<string, { id: string; name: string; email: string }>();
  for (const mentorship of mentorships) {
    if (!byUser.has(mentorship.menteeId)) {
      byUser.set(mentorship.menteeId, mentorship.mentee);
    }
  }

  let legacyOnlyCount = 0;
  for (const m of memberships) {
    if (!byUser.has(m.userId)) {
      byUser.set(m.userId, m.user);
      legacyOnlyCount += 1;
    }
  }
  if (legacyOnlyCount > 0) {
    console.info("[session discovery] legacy_cohort_fallback", {
      attendeeCount: legacyOnlyCount,
    });
  }
  return Array.from(byUser.values());
}

interface CalendarPerson extends IcsPerson {
  id: string;
  name: string;
  email: string;
}

// Minimal, email-sending-only read of a session — deliberately separate
// from mentorSessionInclude/ownAttendeeSessionSelect above so that adding
// `email` here never leaks into any mentor- or member-facing query
// result; this data only ever feeds an outbound calendar invite.
async function getSessionCalendarContext(sessionId: string): Promise<{
  mentor: CalendarPerson;
  attendees: CalendarPerson[];
  kind: SessionKind;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string | null;
} | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      kind: true,
      scheduledAt: true,
      durationMinutes: true,
      meetingUrl: true,
      mentor: { select: { id: true, name: true, email: true } },
      attendees: {
        select: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!session) return null;
  return {
    mentor: session.mentor,
    attendees: session.attendees.map((a) => a.user),
    kind: session.kind,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
    meetingUrl: session.meetingUrl,
  };
}

// Best-effort calendar invite fan-out for createSession (new booking) and
// updateSession (reschedule/cancel). Never throws — a flaky SMTP relay
// must never roll back or block a session action — and never logs
// anything beyond the sessionId and a scrubbed error message (no
// attendee name/email in the log line).
async function sendSessionCalendarEmails(
  sessionId: string,
  method: "REQUEST" | "CANCEL",
): Promise<void> {
  try {
    const ctx = await getSessionCalendarContext(sessionId);
    if (!ctx) return;

    const recipients: CalendarPerson[] = [ctx.mentor, ...ctx.attendees];
    const sequence = nextIcsSequence();
    const kindLabel = SESSION_KIND_LABELS[ctx.kind]?.label ?? ctx.kind;

    const sharedIcsInput = {
      sessionId,
      kind: ctx.kind,
      scheduledAt: ctx.scheduledAt,
      durationMinutes: ctx.durationMinutes,
      meetingUrl: ctx.meetingUrl,
      // Must match the sending mailbox (SMTP_FROM) — Exchange/Outlook
      // validate that the iMIP sender equals ORGANIZER and may otherwise
      // drop the invite. Each recipient, including the mentor, is added as
      // the sole attendee in their own calendar payload below.
      organizer: {
        name: "WEPAC",
        email: (process.env.SMTP_FROM || "info@wepac.pt").replace(
          /^.*<|>.*$/g,
          "",
        ),
      },
      sequence,
    };
    const sendOne =
      method === "REQUEST" ? sendSessionInviteEmail : sendSessionCancelEmail;

    await Promise.all(
      recipients.map((person) => {
        // Build one calendar payload per recipient. Reusing a single VEVENT
        // with every participant as ATTENDEE exposes the names and email
        // addresses of the whole group to each recipient when they inspect
        // the invite. The organizer remains the WEPAC sending mailbox, while
        // the only ATTENDEE is the person receiving this copy.
        const recipientIcsInput = {
          ...sharedIcsInput,
          attendees: [person],
        };
        const ics =
          method === "REQUEST"
            ? buildSessionInviteIcs(recipientIcsInput)
            : buildSessionCancelIcs(recipientIcsInput);

        return sendOne({
          to: person.email,
          recipientName: person.name,
          kindLabel,
          scheduledAt: ctx.scheduledAt,
          meetingUrl: ctx.meetingUrl,
          ics,
        }).catch((err) => {
          console.error("Session calendar email failed", {
            sessionId,
            ...logSafeError(err),
          });
        });
      }),
    );
  } catch (err) {
    console.error("Session calendar email failed", {
      sessionId,
      ...logSafeError(err),
    });
  }
}

function normalizeSessionAttendeeIds(userIds: string[]): string[] {
  const normalized = (Array.isArray(userIds) ? userIds : [])
    .filter((userId): userId is string => typeof userId === "string")
    .map((userId) => userId.trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function assertSessionAttendeeCardinality(
  sessionType: SessionType,
  attendeeUserIds: string[],
): void {
  if (attendeeUserIds.length === 0) {
    throw new Error("Escolhe pelo menos um participante.");
  }
  if (sessionType === "individual" && attendeeUserIds.length !== 1) {
    throw new Error(
      "Uma Session individual requer exatamente um participante.",
    );
  }
  if (sessionType === "group" && attendeeUserIds.length < 2) {
    throw new Error("Uma Group Session requer pelo menos dois participantes.");
  }
  if (sessionType !== "individual" && sessionType !== "group") {
    throw new Error("Formato de Session inválido.");
  }
}

async function authorizeSessionAttendees({
  actor,
  attendeeUserIds,
  legacyCohortId,
  invalidMessage,
}: {
  actor: { id: string; role: "member" | "mentor" | "admin" };
  attendeeUserIds: string[];
  legacyCohortId?: string;
  invalidMessage: string;
}): Promise<{ mentorshipId: string | null }> {
  if (attendeeUserIds.includes(actor.id)) {
    throw new Error(invalidMessage);
  }

  // A persisted legacy Cycle context must be truthful: context never adds
  // attendees, and neither Mentorship nor the admin role may attach a Person
  // who is not an active participant of that exact Cycle. Cohortless Sessions
  // continue through the Mentorship-first authorization below.
  if (legacyCohortId) {
    const activeParticipants = await prisma.cohortMembership.findMany({
      where: {
        cohortId: legacyCohortId,
        userId: { in: attendeeUserIds, not: actor.id },
        role: "member",
        status: "active",
      },
      select: { userId: true },
    });
    if (
      new Set(activeParticipants.map((membership) => membership.userId))
        .size !== attendeeUserIds.length
    ) {
      throw new Error(invalidMessage);
    }
  }

  let authorizations: SessionAttendeeAuthorization[] = [];
  if (actor.role === "admin") {
    const users = await prisma.user.findMany({
      where: { id: { in: attendeeUserIds, not: actor.id } },
      select: { id: true },
    });
    if (new Set(users.map((user) => user.id)).size !== attendeeUserIds.length) {
      throw new Error(invalidMessage);
    }

    // Admin may schedule with any other Person. We still resolve a sole
    // attendee through the same narrow predicate so a genuine active
    // Mentorship is attached when one exists; unrelated admin Sessions stay
    // unlinked.
    if (attendeeUserIds.length === 1) {
      authorizations = [
        await resolveSessionAttendeeAuthorization(
          actor.id,
          attendeeUserIds[0],
          {
            legacyCohortId,
          },
        ),
      ];
    }
  } else {
    authorizations = await Promise.all(
      attendeeUserIds.map((attendeeUserId) =>
        resolveSessionAttendeeAuthorization(actor.id, attendeeUserId, {
          legacyCohortId,
        }),
      ),
    );
    if (authorizations.some((authorization) => !authorization.authorized)) {
      throw new Error(invalidMessage);
    }
  }

  const legacyFallbackCount = authorizations.filter(
    (authorization) => authorization.source === "legacy_cohort",
  ).length;
  if (legacyFallbackCount > 0) {
    console.info("[session authorization] legacy_cohort_fallback", {
      attendeeCount: legacyFallbackCount,
    });
  }

  const soleAuthorization =
    attendeeUserIds.length === 1 ? authorizations[0] : undefined;
  return {
    mentorshipId:
      soleAuthorization?.source === "mentorship"
        ? soleAuthorization.mentorshipId
        : null,
  };
}

export async function createSession(data: {
  cohortId?: string;
  sessionType: SessionType;
  kind?: SessionKind;
  scheduledAt: string;
  durationMinutes?: number;
  discussionPoints?: string;
  attendeeUserIds: string[];
}) {
  const attendeeUserIds = normalizeSessionAttendeeIds(data.attendeeUserIds);
  assertSessionAttendeeCardinality(data.sessionType, attendeeUserIds);

  let actor;
  if (data.cohortId) {
    actor = await assertMentorOfCohort(data.cohortId);
  } else {
    actor = await requireRole(["mentor", "admin"]);
  }

  const { mentorshipId } = await authorizeSessionAttendees({
    actor,
    attendeeUserIds,
    legacyCohortId: data.cohortId,
    invalidMessage: data.cohortId
      ? "Participantes inválidos para este Cycle."
      : "Participantes inválidos para esta sessão.",
  });

  const session = await prisma.session.create({
    data: {
      cohortId: data.cohortId,
      mentorshipId,
      mentorId: actor.id,
      sessionType: data.sessionType,
      kind: data.kind ?? "checkpoint",
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes ?? 60,
      discussionPoints: data.discussionPoints,
      meetingUrl: generateMeetingUrl(),
      attendees: {
        create: attendeeUserIds.map((userId) => ({ userId })),
      },
    },
    include: mentorSessionInclude,
  });

  // Fire-and-forget — see sendSessionCalendarEmails; never blocks or
  // fails session creation.
  void sendSessionCalendarEmails(session.id, "REQUEST");

  return session;
}

// Guard-free counterpart to createSession's write path, for the Cal.com
// webhook receiver (src/app/api/wepacker/calcom-webhook/route.ts). There is
// no HTTP session on a server-to-server webhook delivery, so
// browser-session guards cannot run here. The caller must first verify the
// Cal.com HMAC signature; this function independently re-checks organizer and
// attendee authorization before writing because a valid signature proves only
// payload origin, not the self-asserted attendee's relationship.
//
// calcomBookingUid is passed straight to `create` (not pre-checked with a
// findFirst) so the @unique constraint is the single idempotency anchor:
// Cal.com is at-least-once delivery, so two concurrent deliveries for the
// same booking must race into the same P2002 here rather than both pass a
// separate existence check. The caller (route.ts) catches P2002 and
// responds 200 { duplicate: true }.
export async function createSessionFromResolvedActors(data: {
  cohortId?: string | null;
  mentorId: string;
  sessionType: SessionType;
  kind?: SessionKind;
  scheduledAt: Date;
  durationMinutes?: number;
  attendeeUserIds: string[];
  calcomBookingUid: string;
}) {
  const attendeeUserIds = normalizeSessionAttendeeIds(data.attendeeUserIds);
  assertSessionAttendeeCardinality(data.sessionType, attendeeUserIds);

  // This exported write is used by an HMAC-authenticated webhook and cannot
  // rely on a browser/NextAuth session. Re-resolve the organizer and every
  // attendee here so the write itself still fails closed if a caller forgets
  // the route-level checks.
  const actor = await prisma.user.findUnique({
    where: { id: data.mentorId },
    select: { id: true, role: true },
  });
  if (!actor || (actor.role !== "mentor" && actor.role !== "admin")) {
    throw new Error("Organizador inválido para esta sessão.");
  }
  const { mentorshipId } = await authorizeSessionAttendees({
    actor,
    attendeeUserIds,
    legacyCohortId: data.cohortId ?? undefined,
    invalidMessage: "Participantes inválidos para esta sessão.",
  });

  const session = await prisma.session.create({
    data: {
      cohortId: data.cohortId ?? undefined,
      mentorshipId,
      mentorId: data.mentorId,
      sessionType: data.sessionType,
      kind: data.kind ?? "checkpoint",
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes ?? 60,
      meetingUrl: generateMeetingUrl(),
      calcomBookingUid: data.calcomBookingUid,
      attendees: {
        create: attendeeUserIds.map((userId) => ({ userId })),
      },
    },
    include: mentorSessionInclude,
  });

  // Fire-and-forget — see sendSessionCalendarEmails; never blocks or fails
  // session creation. Only reached once `create` above has actually
  // succeeded, so a P2002 (duplicate booking) never double-sends.
  void sendSessionCalendarEmails(session.id, "REQUEST");

  return session;
}

// Guard-free counterpart to updateSession's cancel path, for the same
// Cal.com webhook receiver — mirrors updateSession's justCancelled branch
// (status flip + CANCEL invite) without the assertMentorOfSession call,
// which throws on a cohort-less session because it falls through to
// requireUser()/NextAuth, and there is no HTTP session here. Idempotent:
// Cal.com's BOOKING_CANCELLED can also be delivered more than once — a
// session already cancelled is left alone and no second CANCEL email
// fires.
export async function cancelSessionFromWebhook(
  sessionId: string,
): Promise<{ id: string; alreadyCancelled: boolean } | null> {
  const before = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (!before) return null;
  if (before.status === "cancelled") {
    return { id: sessionId, alreadyCancelled: true };
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: "cancelled" },
  });
  void sendSessionCalendarEmails(sessionId, "CANCEL");

  return { id: sessionId, alreadyCancelled: false };
}

type SessionUpdatePayload = {
  status?: SessionStatus;
  kind?: SessionKind;
  notes?: string;
  notesPublished?: boolean;
  discussionPoints?: string;
  scheduledAt?: string;
  meetingUrl?: string;
};

type ParsedSessionUpdate = Omit<SessionUpdatePayload, "scheduledAt"> & {
  scheduledAt?: Date;
};

const SESSION_UPDATE_KEYS = new Set<keyof SessionUpdatePayload>([
  "status",
  "kind",
  "notes",
  "notesPublished",
  "discussionPoints",
  "scheduledAt",
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
    throw new Error("Dados de Session inválidos.");
  }

  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!SESSION_UPDATE_KEYS.has(key as keyof SessionUpdatePayload)) {
      throw new Error("Campos de Session inválidos.");
    }
  }

  const parsed: ParsedSessionUpdate = {};
  if (raw.status !== undefined) {
    if (
      typeof raw.status !== "string" ||
      !SESSION_STATUS_KEYS.includes(raw.status as SessionStatus)
    ) {
      throw new Error("Estado de Session inválido.");
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
      throw new Error("Tipo de Session inválido.");
    }
    parsed.kind = raw.kind as SessionKind;
  }
  if (raw.notes !== undefined) {
    if (typeof raw.notes !== "string" || raw.notes.length > 300_000) {
      throw new Error("Notas de Session inválidas.");
    }
    parsed.notes = raw.notes;
  }
  if (raw.notesPublished !== undefined) {
    if (typeof raw.notesPublished !== "boolean") {
      throw new Error("Publicação de notas inválida.");
    }
    parsed.notesPublished = raw.notesPublished;
  }
  if (raw.discussionPoints !== undefined) {
    if (
      typeof raw.discussionPoints !== "string" ||
      raw.discussionPoints.length > 300_000
    ) {
      throw new Error("Pontos de discussão inválidos.");
    }
    parsed.discussionPoints = raw.discussionPoints;
  }
  if (raw.scheduledAt !== undefined) {
    if (typeof raw.scheduledAt !== "string" || !raw.scheduledAt.trim()) {
      throw new Error("Data da Session inválida.");
    }
    const scheduledAt = new Date(raw.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error("Data da Session inválida.");
    }
    parsed.scheduledAt = scheduledAt;
  }
  if (raw.meetingUrl !== undefined) {
    if (typeof raw.meetingUrl !== "string" || raw.meetingUrl.length > 2_048) {
      throw new Error("Link da Session inválido.");
    }
    parsed.meetingUrl = raw.meetingUrl;
  }

  return parsed;
}

export async function updateSession(
  sessionId: string,
  // Keep the public type narrow for normal callers, while the parser below
  // treats the serialized Server Action payload as untrusted at runtime.
  rawData: SessionUpdatePayload,
) {
  await assertMentorOfSession(sessionId);
  const data = parseSessionUpdateData(rawData);

  // Snapshot taken before the write so we can tell whether this call
  // actually changed the schedule/status/meeting link (vs. e.g. only
  // editing notes), and only send a calendar email when it did.
  const needsBeforeSnapshot =
    data.scheduledAt !== undefined ||
    data.status !== undefined ||
    data.meetingUrl !== undefined;
  const before = needsBeforeSnapshot
    ? await prisma.session.findUnique({
        where: { id: sessionId },
        select: { scheduledAt: true, status: true, meetingUrl: true },
      })
    : null;

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data,
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      meetingUrl: true,
    },
  });

  const justCancelled =
    data.status === "cancelled" &&
    before !== null &&
    before.status !== "cancelled";
  const rescheduled =
    !justCancelled &&
    data.scheduledAt !== undefined &&
    before !== null &&
    before.scheduledAt.getTime() !== updated.scheduledAt.getTime();
  // A meeting-link-only edit (e.g. mentor swaps in a manual Zoom link)
  // still needs to reach attendees' calendars, but only when it isn't
  // already covered by a cancel or reschedule invite above.
  const meetingUrlChanged =
    !justCancelled &&
    !rescheduled &&
    data.meetingUrl !== undefined &&
    before !== null &&
    before.meetingUrl !== updated.meetingUrl;

  // Fire-and-forget — see sendSessionCalendarEmails; never blocks or
  // fails the update. Cancellation takes priority: if both status and
  // scheduledAt changed in the same call, send only the CANCEL, not a
  // REQUEST immediately followed by a CANCEL. Same reasoning extends to
  // a meeting-link change bundled with either.
  if (justCancelled) {
    void sendSessionCalendarEmails(sessionId, "CANCEL");
  } else if (rescheduled || meetingUrlChanged) {
    void sendSessionCalendarEmails(sessionId, "REQUEST");
  }

  // Server Action responses are observable by the caller. Never return the
  // full Session row here: it contains organizer-private transcript fields.
  return { id: updated.id };
}

export async function setAttendance(
  sessionId: string,
  userId: string,
  attended: boolean,
) {
  await assertMentorOfSession(sessionId);
  return prisma.sessionAttendee.update({
    where: { sessionId_userId: { sessionId, userId } },
    data: { attended },
  });
}

// Best-effort "your mentor shared a note" notification for the member.
// Mirrors sendSessionCalendarEmails: never blocks or fails the update,
// and never logs anything beyond the sessionId/userId and a scrubbed
// error (no name/email in the log line).
async function sendSharedNoteNotification({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<void> {
  try {
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (!recipient) return;
    await sendSharedNotePublishedEmail({
      to: recipient.email,
      recipientName: recipient.name,
    });
  } catch (err) {
    console.error("Shared note email failed", {
      sessionId,
      ...logSafeError(err),
    });
  }
}

// Per-person session notes and outcome — the mentor-facing counterpart
// to setAttendance. privateNote is mentor-only and never returned to the
// member; sharedNote only reaches the member once sharedNotePublished.
export async function updateSessionAttendee(
  sessionId: string,
  userId: string,
  data: {
    attended?: boolean;
    privateNote?: string;
    sharedNote?: string;
    sharedNotePublished?: boolean;
    outcome?: string;
  },
) {
  await assertMentorOfSession(sessionId);

  // Snapshot before the write so the notification only fires on the
  // false -> true transition, not on every subsequent edit that happens
  // to pass `sharedNotePublished: true` again (e.g. tweaking the note
  // text after it's already published).
  const before =
    data.sharedNotePublished !== undefined
      ? await prisma.sessionAttendee.findUnique({
          where: { sessionId_userId: { sessionId, userId } },
          select: { sharedNotePublished: true },
        })
      : null;

  const updated = await prisma.sessionAttendee.update({
    where: { sessionId_userId: { sessionId, userId } },
    data,
  });

  const justPublished =
    data.sharedNotePublished === true && before?.sharedNotePublished === false;

  // Fire-and-forget — see sendSharedNoteNotification; never blocks or
  // fails the update.
  if (justPublished) {
    void sendSharedNoteNotification({ sessionId, userId });
  }

  return updated;
}
