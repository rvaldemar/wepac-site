"use server";

import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendInviteEmail } from "@/lib/email";
import type {
  CohortStatus,
  MemberLevel,
  MemberPhase,
  MembershipRole,
  UserRole,
} from "@prisma/client";
import {
  getMentoredCohortIds,
  requireAdmin,
  requireRole,
  requireUser,
} from "@/lib/wepacker/guards";

// ===== PACKS =====

export async function getPacks() {
  await requireRole(["mentor", "admin"]);
  return prisma.pack.findMany({
    include: { cohorts: { include: { _count: { select: { memberships: true } } } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getActivePacksPublic() {
  return prisma.pack.findMany({
    where: { active: true },
    select: {
      slug: true,
      name: true,
      tagline: true,
      description: true,
      domainLabel: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createPack(data: {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  domainLabel: string;
}) {
  await requireAdmin();
  return prisma.pack.create({
    data: {
      slug: data.slug.trim().toLowerCase(),
      name: data.name.trim(),
      tagline: data.tagline ?? "",
      description: data.description ?? "",
      domainLabel: data.domainLabel.trim(),
    },
  });
}

export async function updatePack(
  packId: string,
  data: {
    name?: string;
    tagline?: string;
    description?: string;
    domainLabel?: string;
    active?: boolean;
  }
) {
  await requireAdmin();
  return prisma.pack.update({ where: { id: packId }, data });
}

// ===== COHORTS =====

export async function getCohorts() {
  const actor = await requireRole(["mentor", "admin"]);
  const where =
    actor.role === "admin"
      ? {}
      : { id: { in: await getMentoredCohortIds(actor.id) } };
  return prisma.cohort.findMany({
    where,
    include: {
      pack: true,
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCohort(data: {
  packId: string;
  name: string;
  startsAt?: string;
  endsAt?: string;
}) {
  await requireAdmin();
  return prisma.cohort.create({
    data: {
      packId: data.packId,
      name: data.name.trim(),
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });
}

export async function updateCohortStatus(cohortId: string, status: CohortStatus) {
  await requireAdmin();
  return prisma.cohort.update({ where: { id: cohortId }, data: { status } });
}

// ===== MEMBERSHIPS =====

export async function addMembership(data: {
  cohortId: string;
  userId: string;
  role: MembershipRole;
}) {
  await requireAdmin();
  return prisma.cohortMembership.create({ data });
}

export async function updateMembership(
  membershipId: string,
  data: {
    level?: MemberLevel;
    currentPhase?: MemberPhase;
    status?: "active" | "paused" | "exited";
  }
) {
  // Mentors of the cohort may update level/phase; only admin changes status.
  const actor = await requireUser();
  const membership = await prisma.cohortMembership.findUnique({
    where: { id: membershipId },
    select: { cohortId: true },
  });
  if (!membership) throw new Error("Membership não encontrada.");
  if (actor.role !== "admin") {
    const mentored = await getMentoredCohortIds(actor.id);
    if (!mentored.includes(membership.cohortId) || data.status !== undefined) {
      throw new Error("Sem permissão.");
    }
  }
  return prisma.cohortMembership.update({
    where: { id: membershipId },
    data,
  });
}

// Memberships visible to the actor: all (admin) or mentored cohorts only.
export async function getMemberships() {
  const actor = await requireRole(["mentor", "admin"]);
  const where =
    actor.role === "admin"
      ? { role: "member" as MembershipRole }
      : {
          role: "member" as MembershipRole,
          cohortId: { in: await getMentoredCohortIds(actor.id) },
        };
  return prisma.cohortMembership.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          onboarded: true,
          inviteToken: true,
        },
      },
      cohort: { include: { pack: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function getMembershipDetail(membershipId: string) {
  const actor = await requireRole(["mentor", "admin"]);
  const membership = await prisma.cohortMembership.findUnique({
    where: { id: membershipId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          bio: true,
          onboarded: true,
        },
      },
      cohort: { include: { pack: true } },
    },
  });
  if (!membership) throw new Error("Membership não encontrada.");
  if (actor.role !== "admin") {
    const mentored = await getMentoredCohortIds(actor.id);
    if (!mentored.includes(membership.cohortId)) {
      throw new Error("Sem permissão.");
    }
  }
  return membership;
}

// ===== USERS & INVITES =====

export async function getAllUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      phone: true,
      inviteToken: true,
      createdAt: true,
      memberships: {
        where: { status: "active" },
        include: { cohort: { include: { pack: true } } },
      },
      // Surfaced so the admin can see the cascade blast radius (sessions
      // and evaluations are Cascade-deleted with the user, not just their
      // own membership data) before confirming deletion.
      _count: { select: { sessionsMentored: true, evaluationsGiven: true } },
    },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
}

// Hard delete (RGPD-style, same pattern as leads/applications) — no soft
// delete column exists. Cascades per schema: memberships, agreements,
// messages, comments and password reset tokens the user owns; sessions
// they mentored and evaluations they gave as evaluator are ALSO deleted
// (Cascade on Session.mentorId / Evaluation.evaluatorId), which can
// affect other members' history, not just this user's own data.
export async function deleteUser(userId: string) {
  const actor = await requireAdmin();
  if (actor.id === userId) {
    throw new Error("Não podes eliminar a tua própria conta.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) throw new Error("Utilizador não encontrado.");

  if (target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      throw new Error("Não é possível eliminar o último admin.");
    }
  }

  await prisma.user.delete({ where: { id: userId } });
}

// Creates a user with an invite token and any number of memberships
// (multi-pack / multi-cohort), then emails the invite link.
export async function createInvite(data: {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  memberships?: { cohortId: string; role: MembershipRole }[];
}) {
  await requireAdmin();

  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email já registado.");

  const memberships = (data.memberships ?? []).filter((m) => m.cohortId);
  const uniqueCohorts = new Set(memberships.map((m) => m.cohortId));
  if (uniqueCohorts.size !== memberships.length) {
    throw new Error("Journeys duplicadas no convite.");
  }

  const token = randomUUID();
  const inviteExpiresAt = new Date();
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      phone: data.phone || null,
      role: data.role,
      inviteToken: token,
      inviteExpiresAt,
      onboarded: false,
      ...(memberships.length > 0
        ? {
            memberships: {
              create: memberships.map((m) => ({
                cohortId: m.cohortId,
                role: m.role,
              })),
            },
          }
        : {}),
    },
  });

  const appUrl = process.env.APP_URL || "https://wepac.pt";
  const inviteUrl = `${appUrl}/wepacker/invite/${token}`;

  try {
    await sendInviteEmail(email, data.name, inviteUrl);
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }

  return {
    userId: user.id,
    inviteUrl,
    whatsappUrl: data.phone
      ? `https://wa.me/${data.phone.replace(/[\s\-()+"]/g, "")}?text=${encodeURIComponent(
          `Olá ${data.name.split(" ")[0]}, foste convidado/a para o WEPACKER. Cria a tua conta aqui: ${inviteUrl}`
        )}`
      : null,
  };
}
