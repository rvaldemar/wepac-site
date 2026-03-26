"use server";

import { prisma } from "@/lib/db";

export async function getSidebarCounts(userId: string) {
  const [unreadMessages, pendingTasks] = await Promise.all([
    prisma.message.count({
      where: {
        conversation: {
          participants: { some: { userId } },
        },
        userId: { not: userId },
        readAt: null,
      },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { not: "done" },
      },
    }),
  ]);

  return { unreadMessages, pendingTasks };
}
