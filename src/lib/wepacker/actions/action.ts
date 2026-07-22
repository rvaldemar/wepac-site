"use server";

import type { ActionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";

const ACTION_STATUSES = new Set<string>([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_ID_LENGTH = 191;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_DATE_INPUT_LENGTH = 64;
const CREATE_ACTION_KEYS = new Set([
  "title",
  "description",
  "dueAt",
  "goalId",
  "trailId",
]);

type CreateActionFields = {
  title: string;
  description: string | null;
  dueAt: Date | null;
  goalId?: string;
  trailId?: string;
};

type InputRecord = Record<string, unknown>;

function parseExactRecord(value: unknown): InputRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Action input must be an object.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Action input has an invalid prototype.");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !CREATE_ACTION_KEYS.has(key)) {
      throw new Error("Action input contains an unsupported field.");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      throw new Error("Action input contains an invalid field.");
    }
  }
  return value as InputRecord;
}

function hasOwn(record: InputRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function parseId(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  const id = value.trim();
  if (!id || id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    throw new Error(`Invalid ${label}.`);
  }
  return id;
}

function normalizeTitle(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Action title must be a string.");
  const title = value.trim();
  if (!title) throw new Error("Action title is required.");
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(
      `Action title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
    );
  }
  return title;
}

function normalizeDescription(value: unknown): string | null {
  if (value !== undefined && typeof value !== "string") {
    throw new Error("Action description must be a string.");
  }
  const description = typeof value === "string" ? value.trim() : "";
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Action description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
    );
  }
  return description || null;
}

function parseDueAt(value: unknown): Date | null {
  if (value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error("Action due date must be a string.");
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_DATE_INPUT_LENGTH) {
    throw new Error("Invalid Action due date.");
  }
  const dueAt = new Date(normalized);
  if (Number.isNaN(dueAt.getTime()))
    throw new Error("Invalid Action due date.");
  return dueAt;
}

function parseOptionalContextId(
  record: InputRecord,
  key: "goalId" | "trailId",
): string | undefined {
  if (!hasOwn(record, key) || record[key] === undefined) return undefined;
  return parseId(record[key], key === "goalId" ? "Goal ID" : "Trail ID");
}

function parseCreateAction(value: unknown): CreateActionFields {
  const record = parseExactRecord(value);
  if (!hasOwn(record, "title")) throw new Error("Action title is required.");
  return {
    title: normalizeTitle(record.title),
    description: normalizeDescription(
      hasOwn(record, "description") ? record.description : undefined,
    ),
    dueAt: parseDueAt(hasOwn(record, "dueAt") ? record.dueAt : undefined),
    goalId: parseOptionalContextId(record, "goalId"),
    trailId: parseOptionalContextId(record, "trailId"),
  };
}

export async function getMyActions() {
  const actor = await requireUser();
  return prisma.action.findMany({
    where: { assigneeId: actor.id },
    select: {
      id: true,
      title: true,
      description: true,
      origin: true,
      status: true,
      dueAt: true,
      strategicPlanId: true,
      goalId: true,
      trailId: true,
      sourceSessionId: true,
      cycleId: true,
      mentorshipId: true,
      createdAt: true,
      updatedAt: true,
      goal: { select: { id: true, title: true } },
      trail: { select: { id: true, title: true } },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
}

export async function createAction(input: unknown) {
  const actor = await requireUser();
  const data = parseCreateAction(input);

  return prisma.$transaction(async (tx) => {
    const [goal, trail] = await Promise.all([
      data.goalId
        ? tx.goal.findFirst({
            where: {
              id: data.goalId,
              strategicPlan: { userId: actor.id },
            },
            select: { id: true, strategicPlanId: true },
          })
        : null,
      data.trailId
        ? tx.trail.findFirst({
            where: { id: data.trailId, userId: actor.id },
            select: { id: true },
          })
        : null,
    ]);

    if (data.goalId && !goal) throw new Error("Goal unavailable.");
    if (data.trailId && !trail) throw new Error("Trail unavailable.");

    return tx.action.create({
      data: {
        assigneeId: actor.id,
        createdById: actor.id,
        title: data.title,
        description: data.description,
        origin: "self",
        status: "pending",
        dueAt: data.dueAt,
        strategicPlanId: goal?.strategicPlanId ?? null,
        goalId: goal?.id ?? null,
        trailId: trail?.id ?? null,
      },
    });
  });
}

export async function updateActionStatus(
  actionIdValue: unknown,
  statusValue: unknown,
) {
  const actor = await requireUser();
  const actionId = parseId(actionIdValue, "Action ID");
  if (typeof statusValue !== "string" || !ACTION_STATUSES.has(statusValue)) {
    throw new Error("Invalid Action status.");
  }
  const status = statusValue as ActionStatus;

  const updated = await prisma.action.updateMany({
    where: { id: actionId, assigneeId: actor.id },
    data: { status },
  });
  if (updated.count !== 1) throw new Error("Action unavailable.");
  return { id: actionId, status };
}

export async function deleteAction(actionIdValue: unknown) {
  const actor = await requireUser();
  const actionId = parseId(actionIdValue, "Action ID");
  const deleted = await prisma.action.deleteMany({
    where: { id: actionId, assigneeId: actor.id },
  });
  if (deleted.count !== 1) throw new Error("Action unavailable.");
}
