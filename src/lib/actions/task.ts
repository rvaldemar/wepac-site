"use server";

import { prisma } from "@/lib/db";
import type { TaskStatus, TaskOrigin } from "@prisma/client";

export async function getUserTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { deadline: "asc" },
  });
}

export async function getAllTasks() {
  return prisma.task.findMany({
    include: { user: { select: { id: true, name: true } } },
    orderBy: { deadline: "asc" },
  });
}

export async function createTask(data: {
  userId: string;
  assignedById?: string;
  title: string;
  description?: string;
  origin: TaskOrigin;
  goalId?: string;
  deadline: string;
}) {
  return prisma.task.create({ data });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  return prisma.task.update({ where: { id: taskId }, data: { status } });
}
