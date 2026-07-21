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
} from "@/lib/wepacker/guards";
import { hasDedicatedIndicators } from "@/lib/wepacker/types";

// ===== PACKS =====

export async function getPacks() {
  await requireAdmin();
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
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createPack(data: {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
}) {
  await requireAdmin();
  return prisma.pack.create({
    data: {
      slug: data.slug.trim().toLowerCase(),
      name: data.name.trim(),
      tagline: data.tagline ?? "",
      description: data.description ?? "",
      // Explicit override of the schema's @default(true) — a pack must
      // never be publicly visible (getActivePacksPublic) before it has
      // dedicated indicators and is deliberately activated via updatePack.
      active: false,
    },
  });
}

export async function updatePack(
  packId: string,
  data: {
    name?: string;
    tagline?: string;
    description?: string;
    active?: boolean;
  }
) {
  await requireAdmin();
  if (data.active === true) {
    // Read the slug FRESH from the DB — never trust client-supplied data —
    // to close the dia-zero exposure gap (see pack-activation-gate.test.ts).
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      select: { slug: true },
    });
    if (!pack) throw new Error("Legacy track not found.");
    if (!hasDedicatedIndicators(pack.slug)) {
      throw new Error(
        "This legacy track has no verified Assessment instrument and cannot be activated."
      );
    }
  }
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
        where: { status: "active" },
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
  if (status === "active") {
    // Closes the parallel path: a cohort could go "active" — the
    // operational signal this is really running — while its pack has no
    // dedicated indicators, bypassing the updatePack gate entirely.
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      select: { pack: { select: { slug: true, name: true } } },
    });
    if (!cohort) throw new Error("Legacy cohort not found.");
    if (!hasDedicatedIndicators(cohort.pack.slug)) {
      throw new Error(
        `Cannot activate this legacy cohort: legacy track "${cohort.pack.name}" has no verified Assessment instrument.`
      );
    }
  }
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
  await requireAdmin();
  return prisma.cohortMembership.update({
    where: { id: membershipId },
    data,
  });
}

// Legacy membership records contain private contact and delivery data. They
// are admin-only; Mentorship and shared Cohort context grant no access.
export async function getMemberships() {
  await requireAdmin();
  return prisma.cohortMembership.findMany({
    where: { role: "member" as MembershipRole },
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
  await requireAdmin();
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
//
// When applicationId is set (invite created from an application's
// "Convidar para a plataforma" CTA), that application auto-advances to
// "invited" — closing the loop without a manual dropdown change. Best
// effort: a missing/mismatched application never fails invite creation.
export async function createInvite(data: {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  memberships?: { cohortId: string; role: MembershipRole }[];
  message?: string;
  applicationId?: string;
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
    await sendInviteEmail(email, data.name, inviteUrl, data.message);
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }

  if (data.applicationId) {
    try {
      await prisma.betaSignup.update({
        where: { id: data.applicationId },
        data: { status: "invited" },
      });
    } catch (e) {
      console.error("Failed to auto-advance application status:", e);
    }
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
