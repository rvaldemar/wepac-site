"use server";

import type { PersonConnectionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import {
  dispatchPersistedNotificationEvents,
  persistConnectionNotificationEvent,
  type PersistedNotificationEvent,
} from "@/lib/wepacker/notifications";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_ID_LENGTH = 128;
const CONNECTION_TYPES = [
  "friend",
  "family",
  "partner",
  "professional",
  "collaborator",
  "other",
] as const satisfies readonly PersonConnectionType[];

export type ConnectionRequestType = (typeof CONNECTION_TYPES)[number];
export type ConnectionResponse = "accept" | "decline";

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("Email inválido.");
  const email = value.trim().toLowerCase();
  if (
    email.length === 0 ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email)
  ) {
    throw new Error("Email inválido.");
  }
  return email;
}

function assertConnectionType(value: unknown): asserts value is ConnectionRequestType {
  if (
    typeof value !== "string" ||
    !(CONNECTION_TYPES as readonly string[]).includes(value)
  ) {
    throw new Error("Relationship type inválido.");
  }
}

function assertResourceId(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_ID_LENGTH
  ) {
    throw new Error("Connection indisponível ou sem permissão.");
  }
}

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function canonicalPair(firstId: string, secondId: string) {
  return firstId < secondId
    ? { firstUserId: firstId, secondUserId: secondId }
    : { firstUserId: secondId, secondUserId: firstId };
}

function revalidateConnectionSurfaces() {
  revalidatePath("/wepacker/connections");
}

/** Lists only connections where the current Person is an explicit endpoint. */
export async function getMyConnections() {
  const actor = await requireUser();
  const rows = await prisma.personConnection.findMany({
    where: {
      OR: [
        {
          status: "active",
          OR: [{ firstUserId: actor.id }, { secondUserId: actor.id }],
        },
        {
          status: "pending",
          requestedById: { not: actor.id },
          OR: [{ firstUserId: actor.id }, { secondUserId: actor.id }],
        },
      ],
    },
    select: {
      id: true,
      type: true,
      status: true,
      requestedById: true,
      requestedAt: true,
      acceptedAt: true,
      firstUser: { select: { id: true, name: true } },
      secondUser: { select: { id: true, name: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    requestedById: row.requestedById,
    requestedAt: row.requestedAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    otherPerson:
      row.firstUser.id === actor.id ? row.secondUser : row.firstUser,
  }));
}

/**
 * Submit a consent request by exact normalized email. Valid missing, self,
 * duplicate, active and blocked targets all produce the same response, so the
 * endpoint is not an account-discovery oracle.
 */
export async function requestConnection(
  emailInput: string,
  typeInput: ConnectionRequestType,
) {
  const email = normalizeEmail(emailInput);
  assertConnectionType(typeInput);
  const actor = await requireUser();
  const submitted = { submitted: true as const };

  let person: { id: string } | null;
  try {
    person = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  } catch {
    throw new Error("Não foi possível submeter este pedido.");
  }
  if (!person || person.id === actor.id) return submitted;

  const pair = canonicalPair(actor.id, person.id);
  const now = new Date();
  let notificationEvent: PersistedNotificationEvent | null = null;
  try {
    notificationEvent = await prisma.$transaction(async (tx) => {
      const existing = await tx.personConnection.findUnique({
        where: { firstUserId_secondUserId: pair },
        select: { id: true, status: true },
      });

      if (!existing) {
        const created = await tx.personConnection.create({
          data: {
            ...pair,
            requestedById: actor.id,
            type: typeInput,
            status: "pending",
            source: "explicit",
            requestedAt: now,
          },
          select: { id: true },
        });
        return persistConnectionNotificationEvent(tx, {
          connectionId: created.id,
          recipientId: person.id,
          actorId: actor.id,
          type: "connection_requested",
          dedupeScope: now.toISOString(),
        });
      }

      // A target-controlled refusal is terminal. Only a previously accepted
      // Connection that one endpoint voluntarily ended can receive a new
      // request; neither legacy `declined` nor current `blocked` records are
      // reopened by an inviter.
      if (existing.status !== "ended") {
        return null;
      }
      const updated = await tx.personConnection.updateMany({
        where: {
          id: existing.id,
          status: "ended",
        },
        data: {
          requestedById: actor.id,
          type: typeInput,
          status: "pending",
          source: "explicit",
          requestedAt: now,
          acceptedAt: null,
          endedAt: null,
        },
      });
      if (updated.count !== 1) return null;
      return persistConnectionNotificationEvent(tx, {
        connectionId: existing.id,
        recipientId: person.id,
        actorId: actor.id,
        type: "connection_requested",
        dedupeScope: now.toISOString(),
      });
    });
  } catch (error) {
    if (!isPrismaUniqueConflict(error)) {
      throw new Error("Não foi possível submeter este pedido.");
    }
  }

  if (notificationEvent) {
    dispatchPersistedNotificationEvents([notificationEvent]);
  }
  revalidateConnectionSurfaces();
  return submitted;
}

export async function respondToConnection(
  connectionId: string,
  response: ConnectionResponse,
) {
  assertResourceId(connectionId);
  if (response !== "accept" && response !== "decline") {
    throw new Error("Resposta inválida.");
  }
  const actor = await requireUser();
  const now = new Date();

  let notificationEvent: PersistedNotificationEvent | null = null;
  try {
    notificationEvent = await prisma.$transaction(async (tx) => {
      const request = await tx.personConnection.findFirst({
        where: {
          id: connectionId,
          status: "pending",
          requestedById: { not: actor.id },
          OR: [{ firstUserId: actor.id }, { secondUserId: actor.id }],
        },
        select: { requestedById: true },
      });
      if (!request?.requestedById) {
        throw new Error("Connection indisponível ou sem permissão.");
      }

      const updated = await tx.personConnection.updateMany({
        where: {
          id: connectionId,
          status: "pending",
          requestedById: request.requestedById,
          OR: [{ firstUserId: actor.id }, { secondUserId: actor.id }],
        },
        data:
          response === "accept"
            ? { status: "active", acceptedAt: now, endedAt: null }
            : { status: "blocked", acceptedAt: null, endedAt: now },
      });
      if (updated.count !== 1) {
        throw new Error("Connection indisponível ou sem permissão.");
      }

      await tx.notification.updateMany({
        where: {
          recipientId: actor.id,
          type: "connection_requested",
          resourceId: connectionId,
          readAt: null,
        },
        data: { readAt: now },
      });
      if (response !== "accept") return null;
      return persistConnectionNotificationEvent(tx, {
        connectionId,
        recipientId: request.requestedById,
        actorId: actor.id,
        type: "connection_accepted",
        dedupeScope: now.toISOString(),
      });
    });
  } catch {
    throw new Error("Connection indisponível ou sem permissão.");
  }
  if (notificationEvent) {
    dispatchPersistedNotificationEvents([notificationEvent]);
  }

  revalidateConnectionSurfaces();
}

/** Either explicit endpoint can revoke an active edge. */
export async function endConnection(connectionId: string) {
  assertResourceId(connectionId);
  const actor = await requireUser();
  let updated: { count: number };
  try {
    updated = await prisma.personConnection.updateMany({
      where: {
        id: connectionId,
        status: "active",
        OR: [{ firstUserId: actor.id }, { secondUserId: actor.id }],
      },
      data: { status: "ended", endedAt: new Date() },
    });
  } catch {
    throw new Error("Connection indisponível ou sem permissão.");
  }
  if (updated.count !== 1) {
    throw new Error("Connection indisponível ou sem permissão.");
  }

  revalidateConnectionSurfaces();
}
