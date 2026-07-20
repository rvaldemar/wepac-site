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

const sessionInclude = {
  attendees: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
  mentor: { select: { id: true, name: true } },
} as const;

// A session's mentor gate: cohort-scoped sessions defer to the cohort
// guard; a session without a cohort (a personal mentoring session) is
// only editable by the mentor who created it, or an admin.
async function assertMentorOfSession(
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
  return prisma.session.findMany({
    where: {
      attendees: { some: { userId: user.id } },
    },
    include: sessionInclude,
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getNextSession() {
  const { user } = await requireMembership();
  return prisma.session.findFirst({
    where: {
      status: "scheduled",
      attendees: { some: { userId: user.id } },
    },
    include: sessionInclude,
    orderBy: { scheduledAt: "asc" },
  });
}

// Sessions across every cohort the actor mentors, plus every personal
// (cohort-less) session they created themselves (admin sees all).
export async function getMentoredSessions() {
  const actor = await requireUser();
  if (actor.role === "admin") {
    return prisma.session.findMany({
      include: sessionInclude,
      orderBy: { scheduledAt: "desc" },
    });
  }
  const mentoredCohortIds = await getMentoredCohortIds(actor.id);
  return prisma.session.findMany({
    where: {
      OR: [{ cohortId: { in: mentoredCohortIds } }, { mentorId: actor.id }],
    },
    include: sessionInclude,
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
    include: sessionInclude,
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
