import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { MembershipContext, UserRole } from "@/lib/wepacker/types";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

// Guards throw instead of redirecting so they are safe both in pages
// (error boundary) and in server actions invoked as raw POSTs.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("Sem permissão.");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["admin"]);
}

const membershipContextInclude = {
  cohort: { include: { pack: true } },
} as const;

type MembershipWithCohort = Prisma.CohortMembershipGetPayload<{
  include: typeof membershipContextInclude;
}>;

function toContext(m: MembershipWithCohort): MembershipContext {
  return {
    membershipId: m.id,
    role: m.role,
    level: m.level,
    currentPhase: m.currentPhase,
    cohortId: m.cohortId,
    cohortName: m.cohort.name,
    packId: m.cohort.packId,
    packSlug: m.cohort.pack.slug,
    packName: m.cohort.pack.name,
    domainLabel: m.cohort.pack.domainLabel,
  };
}

// The signed-in user's active membership (most recent if several).
export async function getMyMembership(): Promise<MembershipContext | null> {
  const user = await requireUser();
  const membership = await prisma.cohortMembership.findFirst({
    where: { userId: user.id, status: "active" },
    include: membershipContextInclude,
    orderBy: { joinedAt: "desc" },
  });
  return membership ? toContext(membership) : null;
}

export async function requireMembership(): Promise<{
  user: SessionUser;
  membership: MembershipContext;
}> {
  const user = await requireUser();
  const membership = await getMyMembership();
  if (!membership) throw new Error("Sem membership ativa.");
  return { user, membership };
}

// Cohort ids where the actor participates as mentor.
export async function getMentoredCohortIds(userId: string): Promise<string[]> {
  const rows = await prisma.cohortMembership.findMany({
    where: { userId, role: "mentor", status: "active" },
    select: { cohortId: true },
  });
  return rows.map((r) => r.cohortId);
}

// Central ownership check: a membership is accessible to its owner, to
// admins, and to mentors of the same cohort. Returns the membership with
// cohort+pack context or throws.
export async function assertMembershipAccess(
  membershipId: string
): Promise<{ actor: SessionUser; membership: MembershipContext; ownerUserId: string }> {
  const actor = await requireUser();
  const membership = await prisma.cohortMembership.findUnique({
    where: { id: membershipId },
    include: membershipContextInclude,
  });
  if (!membership) throw new Error("Membership não encontrada.");

  if (actor.role !== "admin" && membership.userId !== actor.id) {
    const mentored = await getMentoredCohortIds(actor.id);
    if (!mentored.includes(membership.cohortId)) {
      throw new Error("Sem permissão.");
    }
  }
  return {
    actor,
    membership: toContext(membership),
    ownerUserId: membership.userId,
  };
}

// Like assertMembershipAccess but only owner or admin (no mentor).
export async function assertMembershipOwner(
  membershipId: string
): Promise<{ actor: SessionUser; membership: MembershipContext }> {
  const actor = await requireUser();
  const membership = await prisma.cohortMembership.findUnique({
    where: { id: membershipId },
    include: membershipContextInclude,
  });
  if (!membership) throw new Error("Membership não encontrada.");
  if (actor.role !== "admin" && membership.userId !== actor.id) {
    throw new Error("Sem permissão.");
  }
  return { actor, membership: toContext(membership) };
}

// Mentor (of the cohort) or admin — for mentor-only writes on a member.
export async function assertMentorOfMembership(
  membershipId: string
): Promise<{ actor: SessionUser; membership: MembershipContext; ownerUserId: string }> {
  const actor = await requireUser();
  const membership = await prisma.cohortMembership.findUnique({
    where: { id: membershipId },
    include: membershipContextInclude,
  });
  if (!membership) throw new Error("Membership não encontrada.");
  if (actor.role !== "admin") {
    const mentored = await getMentoredCohortIds(actor.id);
    if (!mentored.includes(membership.cohortId)) {
      throw new Error("Sem permissão.");
    }
  }
  return {
    actor,
    membership: toContext(membership),
    ownerUserId: membership.userId,
  };
}

// Mentor of the cohort or admin — for cohort-scoped writes (sessions).
export async function assertMentorOfCohort(
  cohortId: string
): Promise<SessionUser> {
  const actor = await requireUser();
  if (actor.role === "admin") return actor;
  const mentored = await getMentoredCohortIds(actor.id);
  if (!mentored.includes(cohortId)) throw new Error("Sem permissão.");
  return actor;
}
