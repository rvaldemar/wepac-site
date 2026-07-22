"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";

const PROFILE_KEYS = new Set(["name", "bio", "phone"]);
const MAX_NAME_LENGTH = 200;
const MAX_BIO_LENGTH = 10_000;
const MAX_PHONE_LENGTH = 64;

type InputRecord = Record<string, unknown>;

function parseProfileInput(value: unknown): {
  name: string;
  bio?: string | null;
  phone?: string | null;
} {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Profile input must be an object.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Profile input has an invalid prototype.");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !PROFILE_KEYS.has(key)) {
      throw new Error("Profile input contains an unsupported field.");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      throw new Error("Profile input contains an invalid field.");
    }
  }

  const record = value as InputRecord;
  if (!Object.prototype.hasOwnProperty.call(record, "name")) {
    throw new Error("Nome obrigatório.");
  }
  if (typeof record.name !== "string") {
    throw new Error("Nome inválido.");
  }
  const name = record.name.trim();
  if (!name) throw new Error("Nome obrigatório.");
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Nome não pode exceder ${MAX_NAME_LENGTH} caracteres.`);
  }

  const parseOptionalText = (
    key: "bio" | "phone",
    maxLength: number,
  ): string | null | undefined => {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return undefined;
    const raw = record[key];
    if (raw === undefined) return undefined;
    if (typeof raw !== "string") throw new Error(`${key} inválido.`);
    const normalized = raw.trim();
    if (normalized.length > maxLength) {
      throw new Error(`${key} não pode exceder ${maxLength} caracteres.`);
    }
    return normalized || null;
  };

  return {
    name,
    bio: parseOptionalText("bio", MAX_BIO_LENGTH),
    phone: parseOptionalText("phone", MAX_PHONE_LENGTH),
  };
}

// Signed-in Person plus the current Stage placement. Pack belonging, Cycle
// enrollment, and Mentorship are independent contexts and must not be
// inferred here.
export async function getMyContext() {
  const sessionUser = await requireUser();
  const now = new Date();
  const [user, stagePlacement] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        bio: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.stagePlacement.findFirst({
      where: {
        userId: sessionUser.id,
        status: "active",
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      select: { stage: true },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);
  if (!user) throw new Error("Utilizador não encontrado.");
  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    stage: stagePlacement?.stage ?? null,
  };
}

export async function updateMyProfile(input: unknown) {
  const user = await requireUser();
  const data = parseProfileInput(input);
  await prisma.user.update({
    where: { id: user.id },
    data,
  });
}

export async function getSidebarCounts() {
  const user = await requireUser();
  const [
    unreadMessages,
    pendingActions,
    pendingMentorships,
    unreadNotifications,
  ] = await Promise.all([
    prisma.message.count({
      where: {
        conversation: { participants: { some: { userId: user.id } } },
        userId: { not: user.id },
        readAt: null,
      },
    }),
    prisma.action.count({
      where: {
        assigneeId: user.id,
        status: { in: ["pending", "in_progress"] },
      },
    }),
    prisma.mentorship.count({
      where: {
        menteeId: user.id,
        status: "pending",
      },
    }),
    prisma.notification.count({
      where: { recipientId: user.id, readAt: null },
    }),
  ]);
  return {
    unreadMessages,
    pendingActions,
    pendingMentorships,
    unreadNotifications,
  };
}
