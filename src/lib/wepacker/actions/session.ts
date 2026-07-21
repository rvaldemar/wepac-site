"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { SessionKind, SessionStatus, SessionType } from "@prisma/client";
import {
  assertMentorOfCohort,
  assertMentorOfUsers,
  getMentoredCohortIds,
  requireMembership,
  requireRole,
  requireUser,
} from "@/lib/wepacker/guards";
import { SESSION_KIND_LABELS } from "@/lib/wepacker/types";
import {
  buildSessionCancelIcs,
  buildSessionInviteIcs,
  nextIcsSequence,
  type IcsPerson,
} from "@/lib/wepacker/ics";
import { sendSessionCancelEmail, sendSessionInviteEmail } from "@/lib/email";

// Defaults to the public Jitsi instance — see .env.example. Will migrate to
// a self-hosted instance later; reading this at call time (not module load)
// keeps it test-friendly and lets it pick up runtime env changes.
function meetingBaseUrl(): string {
  return process.env.MEETING_BASE_URL || "https://meet.jit.si";
}

// Auto-generated video call link for a new session. The room slug is a
// non-guessable crypto-random token, deliberately NOT the session's own id
// — the session id is exposed in URLs/APIs to any attendee, and reusing it
// as the meeting slug would let anyone who can see a session id also guess
// (or worse, enumerate) its meeting room.
export function generateMeetingUrl(baseUrl: string = meetingBaseUrl()): string {
  const token = randomBytes(8).toString("hex"); // 16 hex chars
  return `${baseUrl}/wepac-${token}`;
}

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
  T extends OwnAttendeeSession & { notes: string | null; notesPublished: boolean },
>(session: T): T {
  return {
    ...session,
    notes: session.notesPublished ? session.notes : null,
    attendees: session.attendees.map((a) =>
      a.sharedNotePublished ? a : { ...a, sharedNote: null }
    ),
  };
}

// A session's mentor gate: cohort-scoped sessions defer to the cohort
// guard; a session without a cohort (a personal mentoring session) is
// only editable by the mentor who created it, or an admin. Exported so
// other action modules (e.g. task creation from a session outcome) can
// reuse the exact same check instead of re-deriving it.
export async function assertMentorOfSession(
  sessionId: string
): Promise<{ cohortId: string | null; mentorId: string }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { cohortId: true, mentorId: true },
  });
  if (!session) throw new Error("Sessão não encontrada.");
  if (session.cohortId) {
    await assertMentorOfCohort(session.cohortId);
  } else {
    const actor = await requireUser();
    if (actor.role !== "admin" && actor.id !== session.mentorId) {
      throw new Error("Sem permissão.");
    }
  }
  return session;
}

export async function getMySessions() {
  const { user } = await requireMembership();
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
  const { user } = await requireMembership();
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

// Single session, mentor-facing, with the transcript lifecycle metadata
// and any existing debrief draft — powers the transcript/debrief review
// workspace at mentor/sessions/[id]. Reuses assertMentorOfSession, so
// only a mentor who could already write this session's per-attendee
// notes can read its transcript/debrief.
export async function getMentoredSessionDetail(sessionId: string) {
  await assertMentorOfSession(sessionId);
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
      include: mentorSessionInclude,
      orderBy: { scheduledAt: "desc" },
    });
  }
  const mentoredCohortIds = await getMentoredCohortIds(actor.id);
  return prisma.session.findMany({
    where: {
      OR: [{ cohortId: { in: mentoredCohortIds } }, { mentorId: actor.id }],
    },
    include: mentorSessionInclude,
    orderBy: { scheduledAt: "desc" },
  });
}

// Every person (deduplicated) the actor mentors across every cohort —
// used to populate the participant picker for sessions that aren't
// scoped to one specific Journey (admin sees every member, same as
// getCohorts).
export async function getMentoredMembers() {
  const actor = await requireRole(["mentor", "admin"]);
  const where =
    actor.role === "admin"
      ? { role: "member" as const }
      : {
          role: "member" as const,
          cohortId: { in: await getMentoredCohortIds(actor.id) },
        };
  const memberships = await prisma.cohortMembership.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const byUser = new Map<string, { id: string; name: string }>();
  for (const m of memberships) {
    if (!byUser.has(m.userId)) byUser.set(m.userId, m.user);
  }
  return Array.from(byUser.values());
}

// SMTP rejections routinely embed the recipient address in the server
// response line, so raw err.message must never reach the logs (GDPR).
// Log only the error class and, when present, the SMTP response code.
function logSafeError(err: unknown): { kind: string; smtpCode: number | null } {
  return {
    kind: err instanceof Error ? err.name : "unknown",
    smtpCode:
      typeof (err as { responseCode?: unknown })?.responseCode === "number"
        ? ((err as { responseCode: number }).responseCode)
        : null,
  };
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
  method: "REQUEST" | "CANCEL"
): Promise<void> {
  try {
    const ctx = await getSessionCalendarContext(sessionId);
    if (!ctx) return;

    const recipients: CalendarPerson[] = [ctx.mentor, ...ctx.attendees];
    const sequence = nextIcsSequence();
    const kindLabel = SESSION_KIND_LABELS[ctx.kind]?.label ?? ctx.kind;

    const icsInput = {
      sessionId,
      kind: ctx.kind,
      scheduledAt: ctx.scheduledAt,
      durationMinutes: ctx.durationMinutes,
      meetingUrl: ctx.meetingUrl,
      // Must match the sending mailbox (SMTP_FROM) — Exchange/Outlook
      // validate that the iMIP sender equals ORGANIZER and may otherwise
      // drop the invite. The mentor is already among the attendees.
      organizer: {
        name: "WEPAC",
        email: (process.env.SMTP_FROM || "info@wepac.pt").replace(/^.*<|>.*$/g, ""),
      },
      attendees: recipients,
      sequence,
    };
    const ics =
      method === "REQUEST"
        ? buildSessionInviteIcs(icsInput)
        : buildSessionCancelIcs(icsInput);
    const sendOne =
      method === "REQUEST" ? sendSessionInviteEmail : sendSessionCancelEmail;

    await Promise.all(
      recipients.map((person) =>
        sendOne({
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
        })
      )
    );
  } catch (err) {
    console.error("Session calendar email failed", {
      sessionId,
      ...logSafeError(err),
    });
  }
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
  let actor;
  if (data.cohortId) {
    actor = await assertMentorOfCohort(data.cohortId);

    // Attendees must belong to the same cohort.
    const valid = await prisma.cohortMembership.findMany({
      where: { userId: { in: data.attendeeUserIds }, cohortId: data.cohortId },
      select: { userId: true },
    });
    const validUserIds = new Set(valid.map((v) => v.userId));
    if (data.attendeeUserIds.some((id) => !validUserIds.has(id))) {
      throw new Error("Participantes inválidos para esta Journey.");
    }
  } else {
    actor = await assertMentorOfUsers(data.attendeeUserIds);
  }

  const session = await prisma.session.create({
    data: {
      cohortId: data.cohortId,
      mentorId: actor.id,
      sessionType: data.sessionType,
      kind: data.kind ?? "checkpoint",
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes ?? 60,
      discussionPoints: data.discussionPoints,
      meetingUrl: generateMeetingUrl(),
      attendees: {
        create: data.attendeeUserIds.map((userId) => ({ userId })),
      },
    },
    include: mentorSessionInclude,
  });

  // Fire-and-forget — see sendSessionCalendarEmails; never blocks or
  // fails session creation.
  void sendSessionCalendarEmails(session.id, "REQUEST");

  return session;
}

export async function updateSession(
  sessionId: string,
  data: {
    status?: SessionStatus;
    kind?: SessionKind;
    notes?: string;
    notesPublished?: boolean;
    discussionPoints?: string;
    scheduledAt?: string;
    // Mentor can paste a manual Zoom/Teams/etc link here to replace the
    // auto-generated one.
    meetingUrl?: string;
  }
) {
  await assertMentorOfSession(sessionId);

  // Snapshot taken before the write so we can tell whether this call
  // actually changed the schedule/status (vs. e.g. only editing notes),
  // and only send a calendar email when it did.
  const needsBeforeSnapshot =
    data.scheduledAt !== undefined || data.status !== undefined;
  const before = needsBeforeSnapshot
    ? await prisma.session.findUnique({
        where: { id: sessionId },
        select: { scheduledAt: true, status: true },
      })
    : null;

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
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

  // Fire-and-forget — see sendSessionCalendarEmails; never blocks or
  // fails the update. Cancellation takes priority: if both status and
  // scheduledAt changed in the same call, send only the CANCEL, not a
  // REQUEST immediately followed by a CANCEL.
  if (justCancelled) {
    void sendSessionCalendarEmails(sessionId, "CANCEL");
  } else if (rescheduled) {
    void sendSessionCalendarEmails(sessionId, "REQUEST");
  }

  return updated;
}

export async function setAttendance(
  sessionId: string,
  userId: string,
  attended: boolean
) {
  await assertMentorOfSession(sessionId);
  return prisma.sessionAttendee.update({
    where: { sessionId_userId: { sessionId, userId } },
    data: { attended },
  });
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
  }
) {
  await assertMentorOfSession(sessionId);
  return prisma.sessionAttendee.update({
    where: { sessionId_userId: { sessionId, userId } },
    data,
  });
}
