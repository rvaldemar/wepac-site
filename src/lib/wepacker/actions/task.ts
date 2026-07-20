"use server";

import { prisma } from "@/lib/db";
import type { TaskOrigin, TaskStatus } from "@prisma/client";
import {
  assertMembershipAccess,
  getMentoredCohortIds,
  requireMembership,
  requireUser,
} from "@/lib/wepacker/guards";
import { assertMentorOfSession } from "@/lib/wepacker/actions/session";

export async function getMyTasks() {
  const { membership } = await requireMembership();
  return prisma.task.findMany({
    where: { membershipId: membership.membershipId },
    orderBy: { deadline: "asc" },
  });
}

export async function getTasksForMembership(membershipId: string) {
  await assertMembershipAccess(membershipId);
  return prisma.task.findMany({
    where: { membershipId },
    orderBy: { deadline: "asc" },
  });
}

// Tasks across every membership the actor mentors (admin sees all).
export async function getMentoredTasks() {
  const actor = await requireUser();
  const where =
    actor.role === "admin"
      ? {}
      : { membership: { cohortId: { in: await getMentoredCohortIds(actor.id) } } };
  return prisma.task.findMany({
    where,
    include: {
      membership: {
        select: { id: true, user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { deadline: "asc" },
  });
}

export async function createTask(data: {
  membershipId: string;
  title: string;
  description?: string;
  origin: TaskOrigin;
  goalId?: string;
  deadline: string;
}) {
  const { actor, membership, ownerUserId } = await assertMembershipAccess(
    data.membershipId
  );
  void membership;
  return prisma.task.create({
    data: {
      membershipId: data.membershipId,
      assignedById: actor.id === ownerUserId ? null : actor.id,
      title: data.title,
      description: data.description,
      origin: actor.id === ownerUserId ? data.origin : "mentor",
      goalId: data.goalId,
      deadline: data.deadline,
    },
  });
}

// Mentor-side task creation from a session outcome: activates the
// otherwise-dead TaskOrigin.session by linking the task back to the
// session it came from. Reuses the exact same mentor-of-session guard as
// updateSessionAttendee (assertMentorOfSession), so only a mentor who
// could already write that session's per-attendee notes can spin a task
// off of it. Unlike createTask (which is keyed by membershipId, known
// on the member-detail page), the sessions UI only knows the attendee's
// userId, so this resolves the attendee's active membership itself.
export async function createTaskFromSession(data: {
  sessionId: string;
  userId: string;
  title: string;
  description?: string;
  deadline: string;
}) {
  const session = await assertMentorOfSession(data.sessionId);
  const actor = await requireUser();

  const isAttendee = await prisma.sessionAttendee.findUnique({
    where: { sessionId_userId: { sessionId: data.sessionId, userId: data.userId } },
    select: { id: true },
  });
  if (!isAttendee) {
    throw new Error("Esta pessoa não é participante desta sessão.");
  }

  // Cohort session: the task belongs to that cohort's membership (the
  // mentor-of-cohort check already passed in assertMentorOfSession).
  // Personal session: resolve the latest active membership, then require
  // the actor to pass the same membership boundary createTask enforces —
  // otherwise a mentor could write into a cohort they do not mentor.
  const membership = await prisma.cohortMembership.findFirst({
    where: {
      userId: data.userId,
      status: "active",
      ...(session.cohortId ? { cohortId: session.cohortId } : {}),
    },
    orderBy: { joinedAt: "desc" },
  });
  if (!membership) {
    throw new Error("Este membro não tem uma membership ativa.");
  }
  if (!session.cohortId) {
    await assertMembershipAccess(membership.id);
  }

  return prisma.task.create({
    data: {
      membershipId: membership.id,
      assignedById: actor.id,
      title: data.title,
      description: data.description,
      origin: "session",
      deadline: data.deadline,
      sourceSessionId: data.sessionId,
    },
  });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { membershipId: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");
  await assertMembershipAccess(task.membershipId);
  return prisma.task.update({ where: { id: taskId }, data: { status } });
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { membershipId: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");
  await assertMembershipAccess(task.membershipId);
  await prisma.task.delete({ where: { id: taskId } });
}

// ===== COMMENTS =====

export async function getTaskComments(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { membershipId: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");
  await assertMembershipAccess(task.membershipId);
  return prisma.comment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTaskComment(taskId: string, body: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { membershipId: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");
  const { actor } = await assertMembershipAccess(task.membershipId);
  return prisma.comment.create({
    data: {
      userId: actor.id,
      taskId,
      commentableType: "task",
      commentableId: taskId,
      body,
    },
  });
}
