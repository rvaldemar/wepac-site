"use server";

import { prisma } from "@/lib/db";
import type { AreaKey, GoalScope, GoalStatus, TaskStatus } from "@prisma/client";
import {
  assertUserAccess,
  assertUserOwner,
  assertMentorOfUser,
} from "@/lib/wepacker/guards";

// ===== LIFE PLAN =====

export async function getLifePlan(userId: string) {
  await assertUserAccess(userId);
  return prisma.lifePlan.findUnique({ where: { userId } });
}

export async function getLifePlanVersions(userId: string) {
  await assertUserAccess(userId);
  return prisma.lifePlanVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

type LifePlanFields = {
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
};

// Shared write path: snapshots the current Life Plan into history (if any)
// before writing the new content. Used both by direct edits and by
// restoring a past version — restoring never rewrites history, it just
// becomes the new "current" through the same append-only mechanism.
async function snapshotAndSaveLifePlan(userId: string, data: LifePlanFields) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.lifePlan.findUnique({ where: { userId } });
    if (previous) {
      await tx.lifePlanVersion.create({
        data: {
          userId: previous.userId,
          whoIAm: previous.whoIAm,
          whereIAm: previous.whereIAm,
          whereIGo: previous.whereIGo,
          whyIDo: previous.whyIDo,
          commitments: previous.commitments,
        },
      });
    }
    return tx.lifePlan.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  });
}

export async function upsertLifePlan(userId: string, data: LifePlanFields) {
  await assertUserOwner(userId);
  return snapshotAndSaveLifePlan(userId, data);
}

// Restores a past Life Plan version as the current one. Append-only: the
// version being replaced is snapshotted into history by
// snapshotAndSaveLifePlan exactly like a normal edit — nothing is deleted
// or rewritten, the selected version just becomes current again.
export async function restoreLifePlanVersion(userId: string, versionId: string) {
  await assertUserAccess(userId);
  const version = await prisma.lifePlanVersion.findUnique({
    where: { id: versionId },
  });
  if (!version || version.userId !== userId) {
    throw new Error("Versão não encontrada.");
  }
  return snapshotAndSaveLifePlan(userId, {
    whoIAm: version.whoIAm,
    whereIAm: version.whereIAm,
    whereIGo: version.whereIGo,
    whyIDo: version.whyIDo,
    commitments: version.commitments,
  });
}

// ===== STRATEGIC PLAN =====

export async function getStrategicPlan(userId: string) {
  await assertUserAccess(userId);
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

export async function upsertStrategicPlan(
  userId: string,
  data: {
    quarter: string;
    longTermVision: string;
    positioning: string;
    focusAreas: AreaKey[];
    quarterlyReflection: string;
  }
) {
  await assertUserAccess(userId);
  const existing = await prisma.strategicPlan.findFirst({
    where: { userId, quarter: data.quarter },
  });
  if (existing) {
    return prisma.strategicPlan.update({ where: { id: existing.id }, data });
  }
  return prisma.strategicPlan.create({ data: { userId, ...data } });
}

async function assertPlanAccess(strategicPlanId: string) {
  const plan = await prisma.strategicPlan.findUnique({
    where: { id: strategicPlanId },
    select: { userId: true },
  });
  if (!plan) throw new Error("Plano não encontrado.");
  await assertUserAccess(plan.userId);
  return plan;
}

export async function createGoal(data: {
  strategicPlanId: string;
  scope: GoalScope;
  title: string;
  description?: string;
  successCriteria?: string;
  deadline: string;
}) {
  await assertPlanAccess(data.strategicPlanId);
  return prisma.goal.create({
    data: {
      strategicPlanId: data.strategicPlanId,
      scope: data.scope,
      title: data.title,
      description: data.description ?? "",
      successCriteria: data.successCriteria ?? "",
      deadline: data.deadline,
    },
  });
}

export async function updateGoalStatus(goalId: string, status: GoalStatus) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { strategicPlanId: true },
  });
  if (!goal) throw new Error("Objetivo não encontrado.");
  await assertPlanAccess(goal.strategicPlanId);
  return prisma.goal.update({ where: { id: goalId }, data: { status } });
}

export async function createMonthlyAction(data: {
  strategicPlanId: string;
  month: string;
  title: string;
  goalId?: string;
  deadline: string;
}) {
  await assertPlanAccess(data.strategicPlanId);
  return prisma.monthlyAction.create({ data });
}

export async function updateMonthlyActionStatus(
  actionId: string,
  status: TaskStatus
) {
  const action = await prisma.monthlyAction.findUnique({
    where: { id: actionId },
    select: { strategicPlanId: true },
  });
  if (!action) throw new Error("Ação não encontrada.");
  await assertPlanAccess(action.strategicPlanId);
  return prisma.monthlyAction.update({
    where: { id: actionId },
    data: { status },
  });
}

// ===== STRATEGIC MAP SCORE =====

export async function getStrategicMapScores(userId: string) {
  await assertUserAccess(userId);
  return prisma.strategicMapScore.findMany({
    where: { userId },
    orderBy: { month: "asc" },
  });
}

export async function submitStrategicMapScore(data: {
  userId: string;
  month: string;
  longTermScore: number;
  annualScore: number;
  quarterlyScore: number;
  monthlyScore: number;
  notes?: string;
}) {
  const { actor } = await assertMentorOfUser(data.userId);
  return prisma.strategicMapScore.create({
    data: { ...data, evaluatorId: actor.id },
  });
}
