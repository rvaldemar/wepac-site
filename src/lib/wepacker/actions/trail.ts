"use server";

import { prisma } from "@/lib/db";
import type { PillarKey, TrailStatus } from "@prisma/client";
import {
  assertUserAccess,
  assertUserOwner,
  requireUser,
} from "@/lib/wepacker/guards";

const MAX_ID_LENGTH = 191;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_TITLE_LENGTH = 200;
const MAX_NARRATIVE_LENGTH = 10_000;
const PILLAR_KEYS = new Set<string>([
  "physical",
  "emotional",
  "character",
  "spiritual",
  "intellectual",
  "social",
]);
const TRAIL_STATUSES = new Set<string>([
  "active",
  "paused",
  "completed",
  "abandoned",
]);
const TRAIL_CREATE_KEYS = new Set([
  "title",
  "purpose",
  "whyItMatters",
  "destination",
  "areas",
]);
const TRAIL_UPDATE_KEYS = new Set(TRAIL_CREATE_KEYS);

type TrailFields = {
  title: string;
  purpose: string;
  whyItMatters: string;
  destination: string;
  areas: PillarKey[];
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

function parseString(
  record: InputRecord,
  key: string,
  maxLength: number,
  allowEmpty: boolean,
): string {
  if (!hasOwn(record, key)) throw new Error(`${key} is required.`);
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  const normalized = value.trim();
  if (!allowEmpty && !normalized) throw new Error(`${key} is required.`);
  if (normalized.length > maxLength) {
    throw new Error(`${key} cannot exceed ${maxLength} characters.`);
  }
  return normalized;
}

function parsePillars(value: unknown): PillarKey[] {
  if (!Array.isArray(value)) throw new Error("areas must be an array.");
  if (value.length > PILLAR_KEYS.size) {
    throw new Error("areas contains too many Pillars.");
  }
  const areas = value.map((entry) => {
    if (typeof entry !== "string" || !PILLAR_KEYS.has(entry)) {
      throw new Error("areas contains an invalid Pillar.");
    }
    return entry as PillarKey;
  });
  if (new Set(areas).size !== areas.length) {
    throw new Error("areas cannot contain duplicate Pillars.");
  }
  return areas;
}

function parseTrailFields(value: unknown): TrailFields {
  const record = parseExactRecord(value, TRAIL_CREATE_KEYS, "Trail input");
  return {
    title: parseString(record, "title", MAX_TITLE_LENGTH, false),
    purpose: parseString(record, "purpose", MAX_NARRATIVE_LENGTH, true),
    whyItMatters: parseString(
      record,
      "whyItMatters",
      MAX_NARRATIVE_LENGTH,
      true,
    ),
    destination: parseString(record, "destination", MAX_NARRATIVE_LENGTH, true),
    areas: parsePillars(record.areas),
  };
}

function parseTrailUpdate(value: unknown): Partial<TrailFields> {
  const record = parseExactRecord(value, TRAIL_UPDATE_KEYS, "Trail update");
  if (Reflect.ownKeys(record).length === 0) {
    throw new Error("Trail update must include at least one field.");
  }

  const data: Partial<TrailFields> = {};
  if (hasOwn(record, "title")) {
    data.title = parseString(record, "title", MAX_TITLE_LENGTH, false);
  }
  if (hasOwn(record, "purpose")) {
    data.purpose = parseString(record, "purpose", MAX_NARRATIVE_LENGTH, true);
  }
  if (hasOwn(record, "whyItMatters")) {
    data.whyItMatters = parseString(
      record,
      "whyItMatters",
      MAX_NARRATIVE_LENGTH,
      true,
    );
  }
  if (hasOwn(record, "destination")) {
    data.destination = parseString(
      record,
      "destination",
      MAX_NARRATIVE_LENGTH,
      true,
    );
  }
  if (hasOwn(record, "areas")) data.areas = parsePillars(record.areas);
  return data;
}

// ===== TRAIL =====
//
// A Trail belongs directly to the person (User). One person can run several
// transformation Trails across life, independently of communities,
// relationships and Cycles (see prisma/schema.prisma).

export async function getTrails(userIdValue: unknown) {
  const userId = parseId(userIdValue, "Person ID");
  await assertUserAccess(userId);
  return prisma.trail.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTrail(userIdValue: unknown, input: unknown) {
  const userId = parseId(userIdValue, "Person ID");
  const data = parseTrailFields(input);
  const { ownerUserId } = await assertUserOwner(userId);
  return prisma.trail.create({ data: { ...data, userId: ownerUserId } });
}

// Resolve through an owner-scoped predicate so a caller cannot enumerate a
// foreign Trail before authorization runs.
async function assertTrailAccess(trailIdValue: unknown) {
  const trailId = parseId(trailIdValue, "Trail ID");
  const actor = await requireUser();
  const trail = await prisma.trail.findFirst({
    where: { id: trailId, userId: actor.id },
    select: { id: true },
  });
  if (!trail) throw new Error("Trail unavailable.");
  return trailId;
}

export async function updateTrail(trailIdValue: unknown, input: unknown) {
  const data = parseTrailUpdate(input);
  const trailId = await assertTrailAccess(trailIdValue);
  return prisma.trail.update({ where: { id: trailId }, data });
}

export async function updateTrailStatus(
  trailIdValue: unknown,
  statusValue: unknown,
) {
  if (typeof statusValue !== "string" || !TRAIL_STATUSES.has(statusValue)) {
    throw new Error("Invalid Trail status.");
  }
  const trailId = await assertTrailAccess(trailIdValue);
  const status = statusValue as TrailStatus;
  return prisma.trail.update({ where: { id: trailId }, data: { status } });
}
