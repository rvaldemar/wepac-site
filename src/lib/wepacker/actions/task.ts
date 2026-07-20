"use server";

import { prisma } from "@/lib/db";
import type { TaskOrigin, TaskStatus } from "@prisma/client";
import {
  assertMembershipAccess,
  getMentoredCohortIds,
  requireMembership,
  requireUser,
} from "@/lib/wepacker/guards";

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
