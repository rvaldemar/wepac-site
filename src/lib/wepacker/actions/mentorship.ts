"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import {
  dispatchPersistedNotificationEvents,
  persistMentorshipEvent,
} from "@/lib/wepacker/notifications";

const LIVE_MENTORSHIP_STATUSES = ["pending", "active", "paused"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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

export async function getMyMentorships() {
  const actor = await requireUser();
  const rows = await prisma.mentorship.findMany({
    where: {
      OR: [
        { menteeId: actor.id },
        // Outgoing pending rows stay undiscoverable after the generic invite
        // acknowledgement. Otherwise a refresh would turn this read into the
        // account-enumeration oracle the write deliberately avoids.
        { mentorId: actor.id, status: { not: "pending" } },
      ],
    },
    select: {
      id: true,
      status: true,
      invitedById: true,
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

export async function inviteMentee(menteeEmail: string) {
  assertMentorshipWritesEnabled();
  const actor = await requireUser();
  const email = normalizeEmail(menteeEmail);
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Email inválido.");
  }

  const mentee = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  // Keep not-found and self-invite indistinguishable to avoid turning this
  // write endpoint into an account-enumeration oracle.
  if (!mentee || mentee.id === actor.id) {
    return { submitted: true } as const;
  }

  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const mentorship = await tx.mentorship.create({
        data: {
          mentorId: actor.id,
          menteeId: mentee.id,
          invitedById: actor.id,
          status: "pending",
          source: "invitation",
          invitedAt: now,
          mentorAcceptedAt: now,
        },
        select: { id: true },
      });
      const events = await persistMentorshipEvent(tx, {
        mentorshipId: mentorship.id,
        recipientId: mentee.id,
        actorId: actor.id,
        type: "mentorship_invited",
      });
      return { events };
    });

    dispatchPersistedNotificationEvents(result.events);
    revalidateMentorshipSurfaces();
    return { submitted: true } as const;
  } catch (error) {
    if (isPrismaUniqueConflict(error)) {
      // Missing, self, and an existing live edge all receive the same
      // acknowledgement. The caller cannot use this action to confirm whether
      // an account or relationship exists.
      return { submitted: true } as const;
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

  const events = await prisma.$transaction(async (tx) => {
    const updated = await tx.mentorship.updateMany({
      where: {
        id: mentorshipId,
        menteeId: actor.id,
        status: "pending",
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
    await tx.notification.updateMany({
      where: {
        recipientId: actor.id,
        resourceId: mentorshipId,
        type: "mentorship_invited",
        readAt: null,
      },
      data: { readAt: now },
    });
    if (response !== "accept") return [];

    const relationship = await tx.mentorship.findUnique({
      where: { id: mentorshipId },
      select: { mentorId: true, menteeId: true },
    });
    if (!relationship || relationship.menteeId !== actor.id) {
      throw new Error("Invitation indisponível ou sem permissão.");
    }
    return persistMentorshipEvent(tx, {
      mentorshipId,
      recipientId: relationship.mentorId,
      actorId: actor.id,
      type: "mentorship_accepted",
    });
  });

  if (events.length > 0) {
    dispatchPersistedNotificationEvents(events);
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
