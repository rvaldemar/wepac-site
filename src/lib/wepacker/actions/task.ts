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
import { sendTaskCreatedEmail } from "@/lib/email";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

// Best-effort "new task" notification for the member it was assigned to.
// Mirrors sendSessionCalendarEmails: never blocks or fails task creation,
// and never logs anything beyond the taskId and a scrubbed error (no
// name/email in the log line).
async function sendTaskCreatedNotification({
  taskId,
  ownerUserId,
  title,
  deadline,
}: {
  taskId: string;
  ownerUserId: string;
  title: string;
  deadline: string;
}): Promise<void> {
  try {
    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { name: true, email: true },
    });
    if (!owner) return;
    await sendTaskCreatedEmail({
      to: owner.email,
      recipientName: owner.name,
      title,
      deadline,
    });
  } catch (err) {
    console.error("Task created email failed", {
      taskId,
      ...logSafeError(err),
    });
  }
}

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
  const isMentorAssigned = actor.id !== ownerUserId;
  const task = await prisma.task.create({
    data: {
      membershipId: data.membershipId,
      assignedById: isMentorAssigned ? actor.id : null,
      title: data.title,
      description: data.description,
      origin: isMentorAssigned ? "mentor" : data.origin,
      goalId: data.goalId,
      deadline: data.deadline,
    },
  });

  // Fire-and-forget — see sendTaskCreatedNotification; only fires when a
  // mentor assigns the task to someone else, never for a self-created one.
  if (isMentorAssigned) {
    void sendTaskCreatedNotification({
      taskId: task.id,
      ownerUserId,
      title: task.title,
      deadline: task.deadline,
    });
  }

  return task;
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

  // Idempotent by (sourceSessionId, membershipId, title): the review
  // workspace doesn't persist per-item "already approved" state, so a
  // page refresh (or a second mentor opening the same debrief) re-renders
  // every task suggestion as pending. Without this guard, clicking "Criar
  // tarefa" again would INSERT a duplicate Task row.
  const existing = await prisma.task.findFirst({
    where: { sourceSessionId: data.sessionId, membershipId: membership.id, title: data.title },
  });
  if (existing) return existing;

  const task = await prisma.task.create({
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

  // Fire-and-forget — see sendTaskCreatedNotification; a session-derived
  // task is mentor-created by definition, so always notify (unlike
  // createTask's self-created path, which never fires this).
  void sendTaskCreatedNotification({
    taskId: task.id,
    ownerUserId: data.userId,
    title: task.title,
    deadline: task.deadline,
  });

  return task;
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
