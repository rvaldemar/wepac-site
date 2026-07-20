"use server";

import { prisma } from "@/lib/db";
import type { AreaKey, GoalScope, GoalStatus, TaskStatus } from "@prisma/client";
import {
  assertMembershipAccess,
  assertMembershipOwner,
  assertMentorOfMembership,
} from "@/lib/wepacker/guards";

// ===== LIFE PLAN =====

export async function getLifePlan(membershipId: string) {
  await assertMembershipAccess(membershipId);
  return prisma.lifePlan.findFirst({
    where: { membershipId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertLifePlan(
  membershipId: string,
  data: {
    whoIAm: string;
    whereIAm: string;
    whereIGo: string;
    whyIDo: string;
    commitments: string;
  }
) {
  await assertMembershipOwner(membershipId);
  const existing = await prisma.lifePlan.findFirst({ where: { membershipId } });
  if (existing) {
    return prisma.lifePlan.update({ where: { id: existing.id }, data });
  }
  return prisma.lifePlan.create({ data: { membershipId, ...data } });
}

// ===== STRATEGIC PLAN =====

export async function getStrategicPlan(membershipId: string) {
  await assertMembershipAccess(membershipId);
  return prisma.strategicPlan.findFirst({
    where: { membershipId },
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
  membershipId: string,
  data: {
    quarter: string;
    longTermVision: string;
    positioning: string;
    focusAreas: AreaKey[];
    quarterlyReflection: string;
  }
) {
  await assertMembershipAccess(membershipId);
  const existing = await prisma.strategicPlan.findFirst({
    where: { membershipId, quarter: data.quarter },
  });
  if (existing) {
    return prisma.strategicPlan.update({ where: { id: existing.id }, data });
  }
  return prisma.strategicPlan.create({ data: { membershipId, ...data } });
}

async function assertPlanAccess(strategicPlanId: string) {
  const plan = await prisma.strategicPlan.findUnique({
    where: { id: strategicPlanId },
    select: { membershipId: true },
  });
  if (!plan) throw new Error("Plano não encontrado.");
  await assertMembershipAccess(plan.membershipId);
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

// ===== STRATEGIC MAP (PPV) =====

export async function getStrategicMapScores(membershipId: string) {
  await assertMembershipAccess(membershipId);
  return prisma.strategicMapScore.findMany({
    where: { membershipId },
    orderBy: { month: "asc" },
  });
}

export async function submitStrategicMapScore(data: {
  membershipId: string;
  month: string;
  longTermScore: number;
  annualScore: number;
  quarterlyScore: number;
  monthlyScore: number;
  notes?: string;
}) {
  const { actor } = await assertMentorOfMembership(data.membershipId);
  return prisma.strategicMapScore.create({
    data: { ...data, evaluatorId: actor.id },
  });
}
