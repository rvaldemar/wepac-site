"use server";

import { prisma } from "@/lib/db";
import type { TaskOrigin, TaskStatus } from "@prisma/client";
import {
  assertMembershipAccess,
  requireMembership,
  requireUser,
} from "@/lib/wepacker/guards";
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

// Cross-person Task access is disabled until an explicit Task grant exists.
export async function getMentoredTasks() {
  await requireUser();
  throw new Error("Explicit Task grant required.");
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

// Session access is intentionally not a Task grant. Keep this legacy server
// action fail-closed until an explicit, accepted and revocable Task grant is
// implemented.
export async function createTaskFromSession(data: {
  sessionId: string;
  userId: string;
  title: string;
  description?: string;
  deadline: string;
}) {
  await requireUser();
  void data;
  throw new Error("Explicit Task grant required.");
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
