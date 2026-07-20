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

// ===== PERSON-LEVEL GUARDS (PPV / diagnosis / strategic plan) =====
//
// Evaluation, LifePlan, StrategicPlan and StrategicMapScore hang on the
// User, not a CohortMembership — one person has a single diagnosis/PPV
// history spanning every pack they join. Access follows the same shape
// as the membership guards above, keyed by userId instead: the owner
// themselves, an admin, or a mentor of at least one of that user's
// cohort memberships (any status — mirrors assertMembershipAccess,
// which never filtered the target membership's own status).
async function isMentoredUser(actorId: string, userId: string): Promise<boolean> {
  const mentoredCohortIds = await getMentoredCohortIds(actorId);
  if (mentoredCohortIds.length === 0) return false;
  const membership = await prisma.cohortMembership.findFirst({
    where: { userId, cohortId: { in: mentoredCohortIds } },
    select: { id: true },
  });
  return membership !== null;
}

// Central ownership check for person-level data: accessible to its
// owner, to admins, and to mentors of any of the owner's memberships.
export async function assertUserAccess(
  userId: string
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  if (actor.role !== "admin" && userId !== actor.id) {
    if (!(await isMentoredUser(actor.id, userId))) {
      throw new Error("Sem permissão.");
    }
  }
  return { actor, ownerUserId: userId };
}

// Like assertUserAccess but only owner or admin (no mentor) — for
// member-authored writes (e.g. the PPV / life plan text).
export async function assertUserOwner(
  userId: string
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  if (actor.role !== "admin" && userId !== actor.id) {
    throw new Error("Sem permissão.");
  }
  return { actor, ownerUserId: userId };
}

// Mentor (of at least one of the user's memberships) or admin — for
// mentor-only writes on a person (mentor evaluation, strategic map score).
export async function assertMentorOfUser(
  userId: string
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  if (actor.role !== "admin") {
    if (!(await isMentoredUser(actor.id, userId))) {
      throw new Error("Sem permissão.");
    }
  }
  return { actor, ownerUserId: userId };
}
