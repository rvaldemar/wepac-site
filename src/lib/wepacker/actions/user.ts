"use server";

import { prisma } from "@/lib/db";
import { getMyMembership, requireUser } from "@/lib/wepacker/guards";

// Signed-in user's profile + active membership context (or null when the
// user has no active membership — e.g. a freshly invited admin).
export async function getMyContext() {
  const sessionUser = await requireUser();
  const now = new Date();
  const [user, membership, stagePlacement] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        bio: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    getMyMembership(),
    prisma.stagePlacement.findFirst({
      where: {
        userId: sessionUser.id,
        status: "active",
        reviewRequired: false,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      select: { stage: true },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);
  if (!user) throw new Error("Utilizador não encontrado.");
  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    membership,
    stage: stagePlacement?.stage ?? null,
  };
}

export async function updateMyProfile(data: {
  name: string;
  bio?: string;
  phone?: string;
}) {
  const user = await requireUser();
  if (!data.name.trim()) throw new Error("Nome obrigatório.");
  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name.trim(), bio: data.bio, phone: data.phone },
  });
}

export async function getSidebarCounts() {
  const user = await requireUser();
  const membership = await getMyMembership();
  const [unreadMessages, pendingTasks, pendingMentorships] = await Promise.all([
    prisma.message.count({
      where: {
        conversation: { participants: { some: { userId: user.id } } },
        userId: { not: user.id },
        readAt: null,
      },
    }),
    membership
      ? prisma.task.count({
          where: {
            membershipId: membership.membershipId,
            status: { not: "done" },
          },
        })
      : Promise.resolve(0),
    prisma.mentorship.count({
      where: {
        menteeId: user.id,
        status: "pending",
        reviewRequired: false,
      },
    }),
  ]);
  return { unreadMessages, pendingTasks, pendingMentorships };
}
