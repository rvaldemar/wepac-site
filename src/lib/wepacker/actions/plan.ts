"use server";

import type { GoalScope, GoalStatus, PillarKey } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assertUserAccess,
  assertUserOwner,
  requireUser,
} from "@/lib/wepacker/guards";

const MAX_ID_LENGTH = 191;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_SHORT_TEXT_LENGTH = 200;
const MAX_NARRATIVE_LENGTH = 10_000;
const MAX_DEADLINE_LENGTH = 100;

const PILLAR_KEYS = new Set<string>([
  "physical",
  "emotional",
  "character",
  "spiritual",
  "intellectual",
  "social",
]);
const GOAL_SCOPES = new Set<string>(["annual", "quarterly"]);
const GOAL_STATUSES = new Set<string>([
  "not_started",
  "in_progress",
  "completed",
]);
const LIFE_MAP_KEYS = new Set([
  "whoIAm",
  "whereIAm",
  "whereIGo",
  "whyIDo",
  "commitments",
]);
const STRATEGIC_PLAN_KEYS = new Set([
  "quarter",
  "longTermVision",
  "positioning",
  "focusAreas",
  "quarterlyReflection",
]);
const GOAL_KEYS = new Set([
  "strategicPlanId",
  "scope",
  "title",
  "description",
  "successCriteria",
  "deadline",
]);

type LifeMapFields = {
  whoIAm: string;
  whereIAm: string;
  whereIGo: string;
  whyIDo: string;
  commitments: string;
};

type StrategicPlanFields = {
  quarter: string;
  longTermVision: string;
  positioning: string;
  focusAreas: PillarKey[];
  quarterlyReflection: string;
};

type GoalFields = {
  strategicPlanId: string;
  scope: GoalScope;
  title: string;
  description: string;
  successCriteria: string;
  deadline: string;
};

type InputRecord = Record<string, unknown>;

function parseExactRecord(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
  label: string,
): InputRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} has an invalid prototype.`);
  }

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowedKeys.has(key)) {
      throw new Error(`${label} contains an unsupported field.`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      throw new Error(`${label} contains an invalid field.`);
    }
  }

  return value as InputRecord;
}

function parseRequiredString(
  record: InputRecord,
  key: string,
  maxLength: number,
  options: { trim?: boolean; allowEmpty?: boolean } = {},
): string {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    throw new Error(`${key} is required.`);
  }
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  const normalized = options.trim ? value.trim() : value;
  if (!options.allowEmpty && normalized.length === 0) {
    throw new Error(`${key} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${key} cannot exceed ${maxLength} characters.`);
  }
  return normalized;
}

function parseOptionalString(
  record: InputRecord,
  key: string,
  maxLength: number,
): string {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return "";
  const value = record[key];
  if (value === undefined) return "";
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${key} cannot exceed ${maxLength} characters.`);
  }
  return normalized;
}

function parseId(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  const id = value.trim();
  if (!id || id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    throw new Error(`Invalid ${label}.`);
  }
  return id;
}

function parsePillarKeys(value: unknown, label: string): PillarKey[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  if (value.length > PILLAR_KEYS.size) {
    throw new Error(`${label} contains too many Pillars.`);
  }
  const parsed = value.map((entry) => {
    if (typeof entry !== "string" || !PILLAR_KEYS.has(entry)) {
      throw new Error(`${label} contains an invalid Pillar.`);
    }
    return entry as PillarKey;
  });
  if (new Set(parsed).size !== parsed.length) {
    throw new Error(`${label} cannot contain duplicate Pillars.`);
  }
  return parsed;
}

function parseLifeMapFields(value: unknown): LifeMapFields {
  const record = parseExactRecord(value, LIFE_MAP_KEYS, "Life Map input");
  return {
    whoIAm: parseRequiredString(record, "whoIAm", MAX_NARRATIVE_LENGTH, {
      allowEmpty: true,
    }),
    whereIAm: parseRequiredString(record, "whereIAm", MAX_NARRATIVE_LENGTH, {
      allowEmpty: true,
    }),
    whereIGo: parseRequiredString(record, "whereIGo", MAX_NARRATIVE_LENGTH, {
      allowEmpty: true,
    }),
    whyIDo: parseRequiredString(record, "whyIDo", MAX_NARRATIVE_LENGTH, {
      allowEmpty: true,
    }),
    commitments: parseRequiredString(
      record,
      "commitments",
      MAX_NARRATIVE_LENGTH,
      { allowEmpty: true },
    ),
  };
}

function parseStrategicPlanFields(value: unknown): StrategicPlanFields {
  const record = parseExactRecord(
    value,
    STRATEGIC_PLAN_KEYS,
    "Strategic Plan input",
  );
  return {
    quarter: parseRequiredString(record, "quarter", MAX_SHORT_TEXT_LENGTH, {
      trim: true,
    }),
    longTermVision: parseRequiredString(
      record,
      "longTermVision",
      MAX_NARRATIVE_LENGTH,
      { allowEmpty: true },
    ),
    positioning: parseRequiredString(
      record,
      "positioning",
      MAX_NARRATIVE_LENGTH,
      { allowEmpty: true },
    ),
    focusAreas: parsePillarKeys(record.focusAreas, "focusAreas"),
    quarterlyReflection: parseRequiredString(
      record,
      "quarterlyReflection",
      MAX_NARRATIVE_LENGTH,
      { allowEmpty: true },
    ),
  };
}

function parseGoalFields(value: unknown): GoalFields {
  const record = parseExactRecord(value, GOAL_KEYS, "Goal input");
  if (typeof record.scope !== "string" || !GOAL_SCOPES.has(record.scope)) {
    throw new Error("Invalid Goal scope.");
  }
  return {
    strategicPlanId: parseId(record.strategicPlanId, "Strategic Plan ID"),
    scope: record.scope as GoalScope,
    title: parseRequiredString(record, "title", MAX_SHORT_TEXT_LENGTH, {
      trim: true,
    }),
    description: parseOptionalString(
      record,
      "description",
      MAX_NARRATIVE_LENGTH,
    ),
    successCriteria: parseOptionalString(
      record,
      "successCriteria",
      MAX_NARRATIVE_LENGTH,
    ),
    deadline: parseRequiredString(record, "deadline", MAX_DEADLINE_LENGTH, {
      trim: true,
    }),
  };
}

export async function getLifeMap(userIdValue: unknown) {
  const userId = parseId(userIdValue, "Person ID");
  await assertUserAccess(userId);
  return prisma.lifeMap.findUnique({ where: { userId } });
}

export async function getLifeMapVersions(userIdValue: unknown) {
  const userId = parseId(userIdValue, "Person ID");
  await assertUserAccess(userId);
  return prisma.lifeMapVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// Every write snapshots the previous map first. Restoring a version therefore
// creates a new current state without rewriting or erasing history.
async function snapshotAndSaveLifeMap(userId: string, data: LifeMapFields) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.lifeMap.findUnique({ where: { userId } });
    if (previous) {
      await tx.lifeMapVersion.create({
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
    return tx.lifeMap.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  });
}

export async function upsertLifeMap(userIdValue: unknown, input: unknown) {
  const userId = parseId(userIdValue, "Person ID");
  const data = parseLifeMapFields(input);
  const { ownerUserId } = await assertUserOwner(userId);
  return snapshotAndSaveLifeMap(ownerUserId, data);
}

export async function restoreLifeMapVersion(
  userIdValue: unknown,
  versionIdValue: unknown,
) {
  const userId = parseId(userIdValue, "Person ID");
  const versionId = parseId(versionIdValue, "Life Map version ID");
  const { ownerUserId } = await assertUserOwner(userId);
  const version = await prisma.lifeMapVersion.findUnique({
    where: { id: versionId },
  });
  if (!version || version.userId !== ownerUserId) {
    throw new Error("Versão não encontrada.");
  }
  return snapshotAndSaveLifeMap(ownerUserId, {
    whoIAm: version.whoIAm,
    whereIAm: version.whereIAm,
    whereIGo: version.whereIGo,
    whyIDo: version.whyIDo,
    commitments: version.commitments,
  });
}

export async function getStrategicPlan(userIdValue: unknown) {
  const userId = parseId(userIdValue, "Person ID");
  await assertUserAccess(userId);
  return prisma.strategicPlan.findFirst({
    where: { userId },
    include: {
      goals: { orderBy: { deadline: "asc" } },
      actions: {
        include: { goal: { select: { id: true, title: true } } },
        orderBy: [
          { dueAt: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
      },
    },
    orderBy: { quarter: "desc" },
  });
}

export async function upsertStrategicPlan(
  userIdValue: unknown,
  input: unknown,
) {
  const userId = parseId(userIdValue, "Person ID");
  const data = parseStrategicPlanFields(input);
  const { ownerUserId } = await assertUserOwner(userId);
  const existing = await prisma.strategicPlan.findFirst({
    where: { userId: ownerUserId, quarter: data.quarter },
    select: { id: true },
  });
  if (existing) {
    return prisma.strategicPlan.update({ where: { id: existing.id }, data });
  }
  return prisma.strategicPlan.create({
    data: { ...data, userId: ownerUserId },
  });
}

async function assertPlanOwner(strategicPlanIdValue: unknown) {
  const strategicPlanId = parseId(strategicPlanIdValue, "Strategic Plan ID");
  const actor = await requireUser();
  const plan = await prisma.strategicPlan.findFirst({
    where: { id: strategicPlanId, userId: actor.id },
    select: { id: true },
  });
  if (!plan) throw new Error("Strategic Plan unavailable.");
  return plan;
}

export async function createGoal(input: unknown) {
  const data = parseGoalFields(input);
  await assertPlanOwner(data.strategicPlanId);
  return prisma.goal.create({
    data: {
      strategicPlanId: data.strategicPlanId,
      scope: data.scope,
      title: data.title,
      description: data.description,
      successCriteria: data.successCriteria,
      deadline: data.deadline,
    },
  });
}

export async function updateGoalStatus(
  goalIdValue: unknown,
  statusValue: unknown,
) {
  const goalId = parseId(goalIdValue, "Goal ID");
  if (typeof statusValue !== "string" || !GOAL_STATUSES.has(statusValue)) {
    throw new Error("Invalid Goal status.");
  }
  const status = statusValue as GoalStatus;
  const actor = await requireUser();
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, strategicPlan: { userId: actor.id } },
    select: { strategicPlanId: true },
  });
  if (!goal) throw new Error("Goal unavailable.");
  return prisma.goal.update({ where: { id: goalId }, data: { status } });
}
