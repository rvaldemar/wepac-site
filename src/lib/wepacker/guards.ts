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

// Legacy membership artifacts are private to their owner. Admin status is not
// an artifact grant or an implicit break-glass path.
export async function assertMembershipAccess(
  membershipId: string
): Promise<{ actor: SessionUser; membership: MembershipContext; ownerUserId: string }> {
  const actor = await requireUser();
  const membership = await prisma.cohortMembership.findUnique({
    where: { id: membershipId },
    include: membershipContextInclude,
  });
  if (!membership) throw new Error("Membership não encontrada.");

  if (membership.userId !== actor.id) {
    throw new Error("Sem permissão.");
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

// ===== SESSION-ONLY MENTORING AUTHORIZATION =====
//
// This resolver is deliberately separate from isMentoredUser and the generic
// person-data guards below. An active Mentorship grants only the minimum
// capability needed to discover a Mentee for scheduling and create an explicit
// Session with them. It must never become an implicit grant for Life Map,
// Trails, Assessments, Tasks, Messages, or any other personal data.
export type SessionAttendeeAuthorization =
  | {
      authorized: true;
      source: "mentorship";
      mentorshipId: string;
    }
  | {
      authorized: true;
      source: "legacy_cohort";
      mentorshipId: null;
    }
  | {
      authorized: false;
      source: null;
      mentorshipId: null;
    };

export async function resolveSessionAttendeeAuthorization(
  mentorId: string,
  attendeeUserId: string,
  options: { legacyCohortId?: string } = {}
): Promise<SessionAttendeeAuthorization> {
  if (mentorId === attendeeUserId) {
    return { authorized: false, source: null, mentorshipId: null };
  }

  const mentorship = await prisma.mentorship.findFirst({
    where: {
      mentorId,
      menteeId: attendeeUserId,
      status: "active",
      reviewRequired: false,
      mentorAcceptedAt: { not: null },
      menteeAcceptedAt: { not: null },
      activatedAt: { not: null },
      endedAt: null,
    },
    select: { id: true },
  });
  if (mentorship) {
    return {
      authorized: true,
      source: "mentorship",
      mentorshipId: mentorship.id,
    };
  }

  const mentoredCohortIds = options.legacyCohortId
    ? [options.legacyCohortId]
    : await getMentoredCohortIds(mentorId);
  if (mentoredCohortIds.length === 0) {
    return { authorized: false, source: null, mentorshipId: null };
  }

  // Transitional compatibility only: both ends of the legacy relationship
  // must still be active, and the attendee must be a member participant. The
  // result identifies its source so callers can measure and eventually remove
  // this fallback without widening any generic access guard.
  const legacyMembership = await prisma.cohortMembership.findFirst({
    where: {
      userId: attendeeUserId,
      role: "member",
      status: "active",
      cohortId: { in: mentoredCohortIds },
      cohort: {
        memberships: {
          some: {
            userId: mentorId,
            role: "mentor",
            status: "active",
          },
        },
      },
    },
    select: { id: true },
  });

  return legacyMembership
    ? { authorized: true, source: "legacy_cohort", mentorshipId: null }
    : { authorized: false, source: null, mentorshipId: null };
}

// ===== LEGACY RELATIONSHIP LOOKUP =====
//
// Retained only for measured transitional compatibility where a caller names
// that legacy source explicitly. It is not a capability resolver and must not
// be used for Life Map, Trails, Assessments, Tasks, Messages, or other private
// Person data.
export async function isMentoredUser(actorId: string, userId: string): Promise<boolean> {
  const mentoredCohortIds = await getMentoredCohortIds(actorId);
  if (mentoredCohortIds.length === 0) return false;
  const membership = await prisma.cohortMembership.findFirst({
    where: { userId, cohortId: { in: mentoredCohortIds } },
    select: { id: true },
  });
  return membership !== null;
}

// Person-level data is owner-only until a dedicated, accepted and revocable
// artifact grant exists. Admin, Mentorship and Cycle context are not grants.
export async function assertUserAccess(
  userId: string
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  if (userId !== actor.id) {
    throw new Error("Sem permissão.");
  }
  return { actor, ownerUserId: userId };
}

// Owner-only guard for Person-authored writes such as Life Map text.
export async function assertUserOwner(
  userId: string
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  if (userId !== actor.id) {
    throw new Error("Sem permissão.");
  }
  return { actor, ownerUserId: userId };
}

// Cross-person writes are disabled until explicit artifact grants exist. The
// legacy name remains only to keep call sites fail-closed during migration.
export async function assertMentorOfUser(
  userId: string
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  void actor;
  void userId;
  throw new Error("Explicit artifact grant required.");
}

// Disabled cross-person guard. Session authorization has its own resolver and
// must never rely on this generic function.
export async function assertMentorOfUsers(
  userIds: string[]
): Promise<SessionUser> {
  const actor = await requireUser();
  void actor;
  void userIds;
  throw new Error("Explicit artifact grant required.");
}
