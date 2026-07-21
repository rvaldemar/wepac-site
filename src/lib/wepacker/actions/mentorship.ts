"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getMentoredCohortIds,
  requireRole,
  requireUser,
} from "@/lib/wepacker/guards";
import {
  sendMentorshipAcceptedEmail,
  sendMentorshipInvitationEmail,
} from "@/lib/email";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

const LIVE_MENTORSHIP_STATUSES = ["pending", "active", "paused"] as const;

function assertMentorshipWritesEnabled() {
  if (process.env.MENTORSHIP_WRITES_ENABLED !== "true") {
    throw new Error(
      "Mentorship invitations are temporarily disabled pending the age and care-consent policy."
    );
  }
}

function revalidateMentorshipSurfaces() {
  revalidatePath("/wepacker/mentorships");
  revalidatePath("/wepacker/mentor/sessions");
}

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function sendInvitationNotification(input: {
  mentorshipId: string;
  to: string;
  recipientName: string;
  mentorName: string;
}) {
  void sendMentorshipInvitationEmail(input).catch((error) => {
    console.error("Mentorship invitation email failed", {
      mentorshipId: input.mentorshipId,
      ...logSafeError(error),
    });
  });
}

function sendAcceptedNotification(input: {
  mentorshipId: string;
  to: string;
  recipientName: string;
  menteeName: string;
}) {
  void sendMentorshipAcceptedEmail(input).catch((error) => {
    console.error("Mentorship accepted email failed", {
      mentorshipId: input.mentorshipId,
      ...logSafeError(error),
    });
  });
}

export async function getMyMentorships() {
  const actor = await requireUser();
  const rows = await prisma.mentorship.findMany({
    where: {
      OR: [{ mentorId: actor.id }, { menteeId: actor.id }],
    },
    select: {
      id: true,
      status: true,
      invitedById: true,
      reviewRequired: true,
      invitedAt: true,
      activatedAt: true,
      endedAt: true,
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    ...row,
    invitedAt: row.invitedAt.toISOString(),
    activatedAt: row.activatedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
  }));
}

export async function getMentorshipInviteCandidates() {
  assertMentorshipWritesEnabled();
  const actor = await requireRole(["mentor", "admin"]);
  const live = await prisma.mentorship.findMany({
    where: {
      mentorId: actor.id,
      status: { in: [...LIVE_MENTORSHIP_STATUSES] },
    },
    select: { menteeId: true },
  });
  const excludedIds = [actor.id, ...live.map((row) => row.menteeId)];

  if (actor.role === "admin") {
    return prisma.user.findMany({
      where: { id: { notIn: excludedIds } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
  }

  const cohortIds = await getMentoredCohortIds(actor.id);
  if (cohortIds.length === 0) return [];
  const rows = await prisma.cohortMembership.findMany({
    where: {
      cohortId: { in: cohortIds },
      role: "member",
      status: "active",
      userId: { notIn: excludedIds },
    },
    select: {
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return Array.from(new Map(rows.map((row) => [row.userId, row.user])).values());
}

async function assertCanInviteMentee(
  actor: { id: string; role: "member" | "mentor" | "admin" },
  menteeId: string
) {
  if (!menteeId || menteeId === actor.id) {
    throw new Error("Escolhe outra pessoa.");
  }

  const mentee = await prisma.user.findUnique({
    where: { id: menteeId },
    select: { id: true, name: true, email: true },
  });
  if (!mentee) throw new Error("Pessoa não encontrada.");
  if (actor.role === "admin") return mentee;

  const cohortIds = await getMentoredCohortIds(actor.id);
  const legacyRelationship = await prisma.cohortMembership.findFirst({
    where: {
      userId: menteeId,
      cohortId: { in: cohortIds },
      role: "member",
      status: "active",
    },
    select: { id: true },
  });
  if (!legacyRelationship) throw new Error("Sem permissão.");
  return mentee;
}

export async function inviteMentee(menteeId: string) {
  assertMentorshipWritesEnabled();
  const actor = await requireRole(["mentor", "admin"]);
  const mentee = await assertCanInviteMentee(actor, menteeId);
  const mentor = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { name: true },
  });
  if (!mentor) throw new Error("Mentor não encontrado.");

  const now = new Date();
  try {
    const mentorship = await prisma.mentorship.create({
      data: {
        mentorId: actor.id,
        menteeId,
        invitedById: actor.id,
        status: "pending",
        source: "invitation",
        reviewRequired: false,
        invitedAt: now,
        mentorAcceptedAt: now,
      },
      select: { id: true },
    });

    sendInvitationNotification({
      mentorshipId: mentorship.id,
      to: mentee.email,
      recipientName: mentee.name,
      mentorName: mentor.name,
    });
    revalidateMentorshipSurfaces();
    return mentorship;
  } catch (error) {
    if (isPrismaUniqueConflict(error)) {
      throw new Error("Já existe uma Mentorship pendente ou ativa com esta pessoa.");
    }
    throw error;
  }
}

export async function respondToMentorship(
  mentorshipId: string,
  response: "accept" | "decline"
) {
  if (response !== "accept" && response !== "decline") {
    throw new Error("Invalid Mentorship response.");
  }
  // New capability grants stay fail-closed until age verification and the
  // Parent/Guardian consent policy exist. Refusing an invitation is always
  // available: consent must never depend on an operational feature flag.
  if (response === "accept") assertMentorshipWritesEnabled();
  const actor = await requireUser();
  const now = new Date();

  const updated = await prisma.mentorship.updateMany({
    where: {
      id: mentorshipId,
      menteeId: actor.id,
      status: "pending",
      reviewRequired: false,
      ...(response === "accept"
        ? { mentorAcceptedAt: { not: null } }
        : {}),
    },
    data:
      response === "accept"
        ? {
            status: "active",
            menteeAcceptedAt: now,
            activatedAt: now,
          }
        : {
            status: "declined",
            endedAt: now,
          },
  });
  if (updated.count !== 1) {
    throw new Error("Invitation indisponível ou sem permissão.");
  }

  if (response === "accept") {
    const relationship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      select: {
        mentor: { select: { name: true, email: true } },
        mentee: { select: { name: true } },
      },
    });
    if (relationship) {
      sendAcceptedNotification({
        mentorshipId,
        to: relationship.mentor.email,
        recipientName: relationship.mentor.name,
        menteeName: relationship.mentee.name,
      });
    }
  }

  revalidateMentorshipSurfaces();
}

export async function endMentorship(mentorshipId: string) {
  // Revocation must remain available even when new invitations/acceptance are
  // frozen; otherwise an already-active edge could keep authorizing Sessions.
  const actor = await requireUser();
  const updated = await prisma.mentorship.updateMany({
    where: {
      id: mentorshipId,
      status: { in: [...LIVE_MENTORSHIP_STATUSES] },
      OR: [{ mentorId: actor.id }, { menteeId: actor.id }],
    },
    data: { status: "ended", endedAt: new Date() },
  });
  if (updated.count !== 1) {
    throw new Error("Mentorship indisponível ou sem permissão.");
  }
  revalidateMentorshipSurfaces();
}
