"use server";

import { prisma } from "@/lib/db";

export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { attendees: { some: { userId } } },
    include: { attendees: true },
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getAllSessions() {
  return prisma.session.findMany({
    include: { attendees: true },
    orderBy: { scheduledAt: "desc" },
  });
}

export async function getNextSession(userId: string) {
  return prisma.session.findFirst({
    where: {
      status: "scheduled",
      attendees: { some: { userId } },
    },
    include: { attendees: true },
    orderBy: { scheduledAt: "asc" },
  });
}
