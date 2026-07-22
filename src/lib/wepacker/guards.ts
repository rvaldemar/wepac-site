import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  sessionVersion: number;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // The JWT proves which account originally authenticated; it is not the
  // current authorization source. Roles, onboarding state and even account
  // existence can change while a JWT is still valid, so every protected
  // server read/action resolves the current Person from the database.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      sessionVersion: true,
    },
  });
  if (
    !user ||
    typeof session.user.sessionVersion !== "number" ||
    user.sessionVersion !== session.user.sessionVersion
  ) {
    return null;
  }
  return user;
}

// Authentication-only boundary for the onboarding flow. Product reads and
// writes must use requireUser below so a stale JWT cannot bypass a revoked
// onboarding state.
export async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

// Guards throw instead of redirecting so they are safe in Server Actions.
// Every platform capability resolves the current onboarding state from the
// database; the JWT is identity evidence only.
export async function requireUser(): Promise<SessionUser> {
  const user = await requireAuthenticatedUser();
  if (!user.onboarded) throw new Error("Onboarding incompleto.");
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

// ===== SESSION-ONLY MENTORSHIP AUTHORIZATION =====
//
// An active, fully accepted Mentorship grants only the minimum capability
// needed to schedule explicit Sessions. Community Packs, Cycles and account
// roles never imply this relationship. Admin authorization is handled by the
// resource action, not hidden inside this relationship resolver.
export type SessionAttendeeAuthorization =
  | {
      authorized: true;
      source: "mentorship";
      mentorshipId: string;
    }
  | {
      authorized: false;
      source: null;
      mentorshipId: null;
    };

export async function resolveSessionAttendeeAuthorization(
  organizerId: string,
  attendeeUserId: string,
): Promise<SessionAttendeeAuthorization> {
  if (organizerId === attendeeUserId) {
    return { authorized: false, source: null, mentorshipId: null };
  }

  const mentorship = await prisma.mentorship.findFirst({
    where: {
      mentorId: organizerId,
      menteeId: attendeeUserId,
      status: "active",
      mentorAcceptedAt: { not: null },
      menteeAcceptedAt: { not: null },
      activatedAt: { not: null },
      endedAt: null,
    },
    select: { id: true },
  });

  return mentorship
    ? {
        authorized: true,
        source: "mentorship",
        mentorshipId: mentorship.id,
      }
    : { authorized: false, source: null, mentorshipId: null };
}

// Person-level data is owner-only until a dedicated, accepted and revocable
// artifact grant exists. Admin, Mentorship, Cycle and Pack context are not
// grants.
export async function assertUserAccess(
  userId: string,
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  const actor = await requireUser();
  if (userId !== actor.id) throw new Error("Sem permissão.");
  return { actor, ownerUserId: userId };
}

export async function assertUserOwner(
  userId: string,
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  return assertUserAccess(userId);
}

// Cross-person artifact writes remain unavailable until their own grant model
// and acceptance flow exist. Session authorization uses the resolver above.
export async function assertMentorOfUser(
  userId: string,
): Promise<{ actor: SessionUser; ownerUserId: string }> {
  await requireUser();
  void userId;
  throw new Error("Explicit artifact grant required.");
}

export async function assertMentorOfUsers(userIds: string[]): Promise<SessionUser> {
  await requireUser();
  void userIds;
  throw new Error("Explicit artifact grant required.");
}
