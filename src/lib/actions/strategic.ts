"use server";

import { prisma } from "@/lib/db";

export async function getStrategicMapScores(userId: string) {
  return prisma.strategicMapScore.findMany({
    where: { userId },
    orderBy: { month: "asc" },
  });
}

export async function getStrategicPlan(userId: string) {
  return prisma.strategicPlan.findFirst({
    where: { userId },
    include: {
      goals: { orderBy: { deadline: "asc" } },
      monthlyActions: {
        include: { goal: { select: { id: true, title: true } } },
        orderBy: { deadline: "asc" },
      },
    },
    orderBy: { quarter: "desc" },
  });
}

export async function getLifePlan(userId: string) {
  return prisma.lifePlan.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertLifePlan(
  userId: string,
  data: {
    whoIAm: string;
    whereIAm: string;
    whereIGo: string;
    whyIDo: string;
    commitments: string;
  }
) {
  const existing = await prisma.lifePlan.findFirst({ where: { userId } });
  if (existing) {
    return prisma.lifePlan.update({ where: { id: existing.id }, data });
  }
  return prisma.lifePlan.create({ data: { userId, ...data } });
}
