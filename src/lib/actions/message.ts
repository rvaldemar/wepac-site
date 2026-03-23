"use server";

import { prisma } from "@/lib/db";

export async function getUserConversations(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { select: { userId: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return convos.map((c) => ({
    id: c.id,
    participants: c.participants.map((p) => p.userId),
    messages: c.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      userId: m.userId,
      body: m.body,
      readAt: m.readAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
  }));
}

export async function getAllConversations() {
  const convos = await prisma.conversation.findMany({
    include: {
      participants: { select: { userId: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return convos.map((c) => ({
    id: c.id,
    participants: c.participants.map((p) => p.userId),
    messages: c.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      userId: m.userId,
      body: m.body,
      readAt: m.readAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
  }));
}

export async function sendMessage(conversationId: string, userId: string, body: string) {
  return prisma.message.create({
    data: { conversationId, userId, body },
  });
}

export async function markAsRead(messageId: string) {
  return prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });
}

export async function getLatestMessage(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const allMessages = convos.flatMap((c) => c.messages);
  const latest = allMessages.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];

  if (!latest) return null;
  return {
    id: latest.id,
    conversationId: latest.conversationId,
    userId: latest.userId,
    body: latest.body,
    readAt: latest.readAt?.toISOString(),
    createdAt: latest.createdAt.toISOString(),
  };
}
