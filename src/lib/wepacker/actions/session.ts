"use server";

import { prisma } from "@/lib/db";
import type { SessionStatus, SessionType } from "@prisma/client";
import {
  assertMentorOfCohort,
  assertMentorOfUsers,
  getMentoredCohortIds,
  requireMembership,
  requireRole,
  requireUser,
} from "@/lib/wepacker/guards";

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
} as const;

// Member-facing attendee shape: scoped to the requesting user's own row
// only (never another attendee's), and never selects privateNote — that
// field is mentor-only and must not cross the server/client boundary.
// sharedNote/sharedNotePublished are still selected raw here; callers
// must run the result through `maskUnpublishedNotes` before returning.
function ownAttendeeSessionInclude(userId: string) {
  return {
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
    include: ownAttendeeSessionInclude(user.id),
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
    include: ownAttendeeSessionInclude(user.id),
    orderBy: { scheduledAt: "asc" },
  });
  return session ? maskUnpublishedNotes(session) : null;
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

export async function createSession(data: {
  cohortId?: string;
  sessionType: SessionType;
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

  return prisma.session.create({
    data: {
      cohortId: data.cohortId,
      mentorId: actor.id,
      sessionType: data.sessionType,
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes ?? 60,
      discussionPoints: data.discussionPoints,
      attendees: {
        create: data.attendeeUserIds.map((userId) => ({ userId })),
      },
    },
    include: mentorSessionInclude,
  });
}

export async function updateSession(
  sessionId: string,
  data: {
    status?: SessionStatus;
    notes?: string;
    notesPublished?: boolean;
    discussionPoints?: string;
    scheduledAt?: string;
  }
) {
  await assertMentorOfSession(sessionId);
  return prisma.session.update({
    where: { id: sessionId },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  });
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
