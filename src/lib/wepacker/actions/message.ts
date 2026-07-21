"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import { sendNewMessageEmail } from "@/lib/email";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

// A sender's messages inside one conversation only trigger one "new
// message" email per rolling 30-minute window, not one per message —
// otherwise a fast back-and-forth would spam the recipient's inbox.
// There's no in-memory state to debounce against across serverless
// invocations, so the heuristic is a query instead: does the sender
// already have an earlier message in this conversation within the last
// 30 minutes? If so, the recipient was already emailed for this burst
// and this call skips sending. The first message of a burst always
// sends immediately.
const MESSAGE_EMAIL_DEBOUNCE_MS = 30 * 60 * 1000;

// Best-effort "new message" notification for every other participant in
// the conversation. Mirrors sendSessionCalendarEmails: never blocks or
// fails sendMessage, and never logs anything beyond the conversationId
// and a scrubbed error (no name/email/body in the log line).
async function sendNewMessageNotification({
  conversationId,
  senderId,
  senderName,
  messageCreatedAt,
}: {
  conversationId: string;
  senderId: string;
  senderName: string;
  messageCreatedAt: Date;
}): Promise<void> {
  try {
    const recentPriorMessage = await prisma.message.findFirst({
      where: {
        conversationId,
        userId: senderId,
        createdAt: {
          gte: new Date(messageCreatedAt.getTime() - MESSAGE_EMAIL_DEBOUNCE_MS),
          lt: messageCreatedAt,
        },
      },
      select: { id: true },
    });
    if (recentPriorMessage) return;

    const recipients = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { user: { select: { name: true, email: true } } },
    });

    await Promise.all(
      recipients.map((r) =>
        sendNewMessageEmail({
          to: r.user.email,
          recipientName: r.user.name,
          senderName,
        }).catch((err) => {
          console.error("New message email failed", {
            conversationId,
            ...logSafeError(err),
          });
        })
      )
    );
  } catch (err) {
    console.error("New message email failed", {
      conversationId,
      ...logSafeError(err),
    });
  }
}

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

// Existing conversations remain explicit participant grants. Starting a new
// conversation is disabled until a dedicated, consented Message grant exists.
export async function getMessagingContacts() {
  await requireUser();
  return [] as Array<{ id: string; name: string; role: string }>;
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
  const message = await prisma.message.create({
    data: { conversationId, userId: user.id, body: body.trim() },
  });

  // Fire-and-forget — see sendNewMessageNotification; never blocks or
  // fails sendMessage.
  void sendNewMessageNotification({
    conversationId,
    senderId: user.id,
    senderName: user.name,
    messageCreatedAt: message.createdAt,
  });

  return message;
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

// Reading conversations across People is admin-only. Mentors can still read
// conversations in which they are explicit participants via getMyConversations.
export async function getMentoredConversations() {
  await requireUser();
  throw new Error("Explicit Message grant required.");
}
