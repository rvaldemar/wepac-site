"use server";

import { prisma } from "@/lib/db";
import type { SessionStatus, SessionType } from "@prisma/client";
import {
  assertMentorOfCohort,
  getMentoredCohortIds,
  requireMembership,
  requireUser,
} from "@/lib/wepacker/guards";

const sessionInclude = {
  attendees: {
    include: {
      membership: {
        select: { id: true, user: { select: { id: true, name: true } } },
      },
    },
  },
  mentor: { select: { id: true, name: true } },
} as const;

export async function getMySessions() {
  const { membership } = await requireMembership();
  return prisma.session.findMany({
    where: {
      attendees: { some: { membershipId: membership.membershipId } },
    },
    include: sessionInclude,
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getNextSession() {
  const { membership } = await requireMembership();
  return prisma.session.findFirst({
    where: {
      status: "scheduled",
      attendees: { some: { membershipId: membership.membershipId } },
    },
    include: sessionInclude,
    orderBy: { scheduledAt: "asc" },
  });
}

// Sessions across every cohort the actor mentors (admin sees all).
export async function getMentoredSessions() {
  const actor = await requireUser();
  const where =
    actor.role === "admin"
      ? {}
      : { cohortId: { in: await getMentoredCohortIds(actor.id) } };
  return prisma.session.findMany({
    where,
    include: sessionInclude,
    orderBy: { scheduledAt: "desc" },
  });
}

export async function createSession(data: {
  cohortId: string;
  sessionType: SessionType;
  scheduledAt: string;
  durationMinutes?: number;
  discussionPoints?: string;
  attendeeMembershipIds: string[];
}) {
  const actor = await assertMentorOfCohort(data.cohortId);

  // Attendees must belong to the same cohort.
  const valid = await prisma.cohortMembership.findMany({
    where: { id: { in: data.attendeeMembershipIds }, cohortId: data.cohortId },
    select: { id: true },
  });
  if (valid.length !== data.attendeeMembershipIds.length) {
    throw new Error("Participantes inválidos para esta cohort.");
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
        create: data.attendeeMembershipIds.map((membershipId) => ({
          membershipId,
        })),
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
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { cohortId: true },
  });
  if (!session) throw new Error("Sessão não encontrada.");
  await assertMentorOfCohort(session.cohortId);
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
  membershipId: string,
  attended: boolean
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { cohortId: true },
  });
  if (!session) throw new Error("Sessão não encontrada.");
  await assertMentorOfCohort(session.cohortId);
  return prisma.sessionAttendee.update({
    where: { sessionId_membershipId: { sessionId, membershipId } },
    data: { attended },
  });
}
