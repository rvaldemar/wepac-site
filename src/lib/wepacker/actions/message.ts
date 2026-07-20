"use server";

import { prisma } from "@/lib/db";
import { getMentoredCohortIds, requireUser } from "@/lib/wepacker/guards";

const conversationInclude = {
  participants: {
    include: { user: { select: { id: true, name: true, role: true } } },
  },
  messages: { orderBy: { createdAt: "asc" as const } },
} as const;

function serialize(
  c: {
    id: string;
    participants: {
      user: { id: string; name: string; role: string };
    }[];
    messages: {
      id: string;
      conversationId: string;
      userId: string;
      body: string;
      readAt: Date | null;
      createdAt: Date;
    }[];
  }
) {
  return {
    id: c.id,
    participants: c.participants.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      role: p.user.role,
    })),
    messages: c.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      userId: m.userId,
      body: m.body,
      readAt: m.readAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function getMyConversations() {
  const user = await requireUser();
  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: conversationInclude,
  });
  return convos.map(serialize);
}

// Users the actor can start a conversation with: people sharing a cohort,
// plus mentors/admins for members (and members of mentored cohorts for
// mentors). Admin can reach everyone.
export async function getMessagingContacts() {
  const user = await requireUser();

  if (user.role === "admin") {
    return prisma.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
  }

  const myCohorts = await prisma.cohortMembership.findMany({
    where: { userId: user.id, status: "active" },
    select: { cohortId: true },
  });
  const cohortIds = myCohorts.map((c) => c.cohortId);

  const peers = await prisma.cohortMembership.findMany({
    where: {
      cohortId: { in: cohortIds },
      status: "active",
      userId: { not: user.id },
    },
    select: { user: { select: { id: true, name: true, role: true } } },
  });
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true, role: true },
  });

  const seen = new Set<string>();
  const contacts: { id: string; name: string; role: string }[] = [];
  for (const c of [...peers.map((p) => p.user), ...admins]) {
    if (c.id !== user.id && !seen.has(c.id)) {
      seen.add(c.id);
      contacts.push(c);
    }
  }
  return contacts.sort((a, b) => a.name.localeCompare(b.name));
}

export async function startConversation(withUserId: string) {
  const user = await requireUser();
  if (withUserId === user.id) throw new Error("Conversa inválida.");

  const contacts = await getMessagingContacts();
  if (!contacts.some((c) => c.id === withUserId)) {
    throw new Error("Sem permissão.");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: withUserId } } },
      ],
    },
    include: conversationInclude,
  });
  if (existing) return serialize(existing);

  const convo = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: user.id }, { userId: withUserId }],
      },
    },
    include: conversationInclude,
  });
  return serialize(convo);
}

export async function sendMessage(conversationId: string, body: string) {
  const user = await requireUser();
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) throw new Error("Sem permissão.");
  if (!body.trim()) throw new Error("Mensagem vazia.");
  return prisma.message.create({
    data: { conversationId, userId: user.id, body: body.trim() },
  });
}

export async function markAsRead(messageId: string) {
  const user = await requireUser();
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { conversationId: true, userId: true },
  });
  if (!message) throw new Error("Mensagem não encontrada.");
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: message.conversationId,
        userId: user.id,
      },
    },
  });
  if (!participant || message.userId === user.id) {
    throw new Error("Sem permissão.");
  }
  return prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });
}

// Conversations of members in cohorts the actor mentors — mentor inbox view.
export async function getMentoredConversations() {
  const actor = await requireUser();
  if (actor.role === "admin") {
    const convos = await prisma.conversation.findMany({
      include: conversationInclude,
    });
    return convos.map(serialize);
  }
  const cohortIds = await getMentoredCohortIds(actor.id);
  const memberIds = (
    await prisma.cohortMembership.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  const convos = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: { in: [...memberIds, actor.id] } },
      },
    },
    include: conversationInclude,
  });
  return convos.map(serialize);
}
