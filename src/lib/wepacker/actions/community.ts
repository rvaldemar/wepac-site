"use server";

import { Prisma, type PackStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import {
  dispatchPersistedNotificationEvents,
  persistPackNotificationEvent,
  type PersistedNotificationEvent,
} from "@/lib/wepacker/notifications";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;
const MAX_ID_LENGTH = 128;

export type PackInvitationResponse = "accept" | "decline";

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

function assertResourceId(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_ID_LENGTH
  ) {
    throw new Error("Community indisponível ou sem permissão.");
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

function revalidateCommunitySurfaces() {
  revalidatePath("/wepacker/communities");
}

async function syncPackActivation(
  tx: Prisma.TransactionClient,
  packId: string,
) {
  // Every membership transition reconciles the derived Pack status while
  // holding the same Pack-row lock. Once a waiter acquires this lock, its next
  // READ COMMITTED statement sees membership transitions committed by the
  // previous holder, so concurrent accept/leave operations cannot publish a
  // stale active/draft result.
  const lockedPacks = await tx.$queryRaw<
    Array<{
      status: PackStatus;
      activatedAt: Date | null;
      archivedAt: Date | null;
    }>
  >(Prisma.sql`
    SELECT "status", "activatedAt", "archivedAt"
    FROM "community_packs"
    WHERE "id" = ${packId}
    FOR UPDATE
  `);
  const pack = lockedPacks[0] ?? null;

  if (!pack || pack.status === "archived" || pack.archivedAt) return;

  const activePeople = await tx.packMembership.count({
    where: { packId, status: "active" },
  });

  const shouldBeActive = activePeople >= 2;
  const nextStatus = shouldBeActive ? "active" : "draft";
  if (pack.status === nextStatus) return;

  await tx.pack.updateMany({
    where: {
      id: packId,
      status: { in: ["draft", "active"] },
      archivedAt: null,
    },
    data: {
      status: nextStatus,
      activatedAt: shouldBeActive ? new Date() : null,
    },
  });
}

/**
 * Returns only the actor's own community edges. Joined Packs expose their
 * personal owner's display name, never email or another Person's Journey data.
 */
export async function getMyCommunities() {
  const actor = await requireUser();

  const [ownedPack, joinedMemberships] = await Promise.all([
    prisma.pack.findUnique({
      where: { personalOwnerId: actor.id },
      select: {
        id: true,
        description: true,
        status: true,
        createdAt: true,
        memberships: {
          // Pending invitees stay undisclosed to the owner until they consent.
          // Otherwise a refresh after exact-email submission would become an
          // account-enumeration side channel.
          where: { status: "active" },
          select: {
            id: true,
            status: true,
            role: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.packMembership.findMany({
      where: {
        userId: actor.id,
        status: { in: ["invited", "active"] },
        pack: {
          is: {
            archivedAt: null,
            OR: [
              { personalOwnerId: null },
              { personalOwnerId: { not: actor.id } },
            ],
          },
        },
      },
      select: {
        id: true,
        status: true,
        invitedAt: true,
        joinedAt: true,
        pack: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            personalOwner: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    ownedPack: ownedPack
      ? {
          ...ownedPack,
          createdAt: ownedPack.createdAt.toISOString(),
        }
      : null,
    joinedPacks: joinedMemberships.map((membership) => ({
      ...membership,
      invitedAt: membership.invitedAt.toISOString(),
      joinedAt: membership.joinedAt?.toISOString() ?? null,
    })),
  };
}

/** Create the actor's one personal community Pack and its explicit owner edge. */
export async function createMyPack() {
  const actor = await requireUser();
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.pack.findUnique({
        where: { personalOwnerId: actor.id },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };

      const pack = await tx.pack.create({
        data: {
          slug: `my-pack-${actor.id}`,
          name: `${actor.name}'s Pack`,
          status: "draft",
          source: "explicit",
          createdById: actor.id,
          personalOwnerId: actor.id,
        },
        select: { id: true },
      });

      await tx.packMembership.create({
        data: {
          packId: pack.id,
          userId: actor.id,
          invitedById: actor.id,
          role: "owner",
          status: "active",
          source: "explicit",
          invitedAt: now,
          joinedAt: now,
        },
      });

      return { id: pack.id, created: true };
    });
    revalidateCommunitySurfaces();
    return result;
  } catch (error) {
    if (isPrismaUniqueConflict(error)) {
      const existing = await prisma.pack.findUnique({
        where: { personalOwnerId: actor.id },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };
    }
    throw new Error("Não foi possível criar My Pack.");
  }
}

/**
 * Submit an invitation by exact normalized email. Every valid-email outcome
 * returns the same acknowledgement, so missing, self, duplicate and blocked
 * records cannot be distinguished through this action.
 */
export async function inviteToMyPack(packId: string, emailInput: string) {
  assertResourceId(packId);
  const email = normalizeEmail(emailInput);
  const actor = await requireUser();

  let pack: { id: string } | null;
  try {
    pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        personalOwnerId: actor.id,
        status: { in: ["draft", "active"] },
        archivedAt: null,
      },
      select: { id: true },
    });
  } catch {
    throw new Error("Community indisponível ou sem permissão.");
  }
  if (!pack) throw new Error("Community indisponível ou sem permissão.");

  const submitted = { submitted: true as const };
  let person: { id: string } | null;
  try {
    person = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  } catch {
    throw new Error("Não foi possível submeter este convite.");
  }
  if (!person || person.id === actor.id) return submitted;

  const now = new Date();
  let notificationEvent: PersistedNotificationEvent | null = null;
  try {
    notificationEvent = await prisma.$transaction(async (tx) => {
      const existing = await tx.packMembership.findFirst({
        where: { packId: pack.id, userId: person.id },
        select: { id: true, status: true, declinedAt: true },
      });

      if (!existing) {
        const created = await tx.packMembership.create({
          data: {
            packId: pack.id,
            userId: person.id,
            invitedById: actor.id,
            role: "member",
            status: "invited",
            source: "invitation",
            invitedAt: now,
          },
          select: { id: true },
        });
        return persistPackNotificationEvent(tx, {
          packMembershipId: created.id,
          recipientId: person.id,
          actorId: actor.id,
          type: "pack_invited",
          dedupeScope: now.toISOString(),
        });
      }

      if (
        (existing.status !== "left" && existing.status !== "removed") ||
        existing.declinedAt
      ) {
        return null;
      }
      const updated = await tx.packMembership.updateMany({
        where: {
          id: existing.id,
          status: { in: ["left", "removed"] },
          declinedAt: null,
        },
        data: {
          invitedById: actor.id,
          role: "member",
          status: "invited",
          source: "invitation",
          invitedAt: now,
          joinedAt: null,
          endedAt: null,
          declinedAt: null,
        },
      });
      if (updated.count !== 1) return null;
      return persistPackNotificationEvent(tx, {
        packMembershipId: existing.id,
        recipientId: person.id,
        actorId: actor.id,
        type: "pack_invited",
        dedupeScope: now.toISOString(),
      });
    });
  } catch (error) {
    if (!isPrismaUniqueConflict(error)) {
      throw new Error("Não foi possível submeter este convite.");
    }
  }

  if (notificationEvent) {
    dispatchPersistedNotificationEvents([notificationEvent]);
  }
  revalidateCommunitySurfaces();
  return submitted;
}

export async function respondToPackInvitation(
  packMembershipId: string,
  response: PackInvitationResponse,
) {
  assertResourceId(packMembershipId);
  if (response !== "accept" && response !== "decline") {
    throw new Error("Resposta inválida.");
  }
  const actor = await requireUser();
  const now = new Date();

  let notificationEvent: PersistedNotificationEvent | null = null;
  try {
    notificationEvent = await prisma.$transaction(async (tx) => {
      const invitation = await tx.packMembership.findFirst({
        where: {
          id: packMembershipId,
          userId: actor.id,
          role: "member",
          status: "invited",
        },
        select: {
          packId: true,
          pack: { select: { personalOwnerId: true } },
        },
      });
      if (!invitation) {
        throw new Error("Invitation indisponível ou sem permissão.");
      }

      const updated = await tx.packMembership.updateMany({
        where: {
          id: packMembershipId,
          userId: actor.id,
          role: "member",
          status: "invited",
        },
        data:
          response === "accept"
            ? {
                status: "active",
                joinedAt: now,
                endedAt: null,
                declinedAt: null,
              }
            : {
                status: "removed",
                joinedAt: null,
                endedAt: now,
                declinedAt: now,
              },
      });
      if (updated.count !== 1) {
        throw new Error("Invitation indisponível ou sem permissão.");
      }

      await tx.notification.updateMany({
        where: {
          recipientId: actor.id,
          type: "pack_invited",
          resourceId: packMembershipId,
          readAt: null,
        },
        data: { readAt: now },
      });
      await syncPackActivation(tx, invitation.packId);
      if (response !== "accept" || !invitation.pack.personalOwnerId) {
        return null;
      }
      return persistPackNotificationEvent(tx, {
        packMembershipId,
        recipientId: invitation.pack.personalOwnerId,
        actorId: actor.id,
        type: "pack_accepted",
        dedupeScope: now.toISOString(),
      });
    });
  } catch {
    throw new Error("Invitation indisponível ou sem permissão.");
  }

  if (notificationEvent) {
    dispatchPersistedNotificationEvents([notificationEvent]);
  }
  revalidateCommunitySurfaces();
}

export async function leavePack(packMembershipId: string) {
  assertResourceId(packMembershipId);
  const actor = await requireUser();

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.packMembership.findFirst({
        where: {
          id: packMembershipId,
          userId: actor.id,
          role: { in: ["member", "moderator"] },
          status: "active",
        },
        select: { packId: true },
      });
      if (!membership) {
        throw new Error("Community indisponível ou sem permissão.");
      }

      const updated = await tx.packMembership.updateMany({
        where: {
          id: packMembershipId,
          userId: actor.id,
          role: { in: ["member", "moderator"] },
          status: "active",
        },
        data: { status: "left", endedAt: new Date() },
      });
      if (updated.count !== 1) {
        throw new Error("Community indisponível ou sem permissão.");
      }

      await syncPackActivation(tx, membership.packId);
    });
  } catch {
    throw new Error("Community indisponível ou sem permissão.");
  }

  revalidateCommunitySurfaces();
}
