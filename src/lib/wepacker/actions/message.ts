"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import {
  dispatchPersistedNotificationEvents,
  persistNewMessageEvent,
} from "@/lib/wepacker/notifications";

const MAX_MESSAGE_BODY_LENGTH = 10_000;
const MAX_ID_LENGTH = 191;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function parseId(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  const id = value.trim();
  if (!id || id.length > MAX_ID_LENGTH || !ID_PATTERN.test(id)) {
    throw new Error(`Invalid ${label}.`);
  }
  return id;
}

function parseMessageBody(value: unknown): string {
  if (typeof value !== "string") throw new Error("Mensagem inválida.");
  const body = value.trim();
  if (!body) throw new Error("Mensagem vazia.");
  if (body.length > MAX_MESSAGE_BODY_LENGTH) {
    throw new Error(
      `Mensagem demasiado longa (máx. ${MAX_MESSAGE_BODY_LENGTH.toLocaleString("pt-PT")} caracteres).`,
    );
  }
  return body;
}

// A sender's messages inside one conversation only trigger one "new
// message" event per rolling 30-minute window, not one per message —
// otherwise a fast back-and-forth would spam the recipient's inbox.
// There's no in-memory state to debounce against across serverless
// invocations, so the heuristic is a query instead: does the sender
// already have an earlier message in this conversation within the last
// 30 minutes? If so, the recipient already received the in-app/email event
// for this burst. The first message of a burst stages both channels.
const MESSAGE_NOTIFICATION_DEBOUNCE_MINUTES = 30;

const conversationInclude = {
  participants: {
    include: { user: { select: { id: true, name: true } } },
  },
  messages: { orderBy: { createdAt: "asc" as const } },
} as const;

function serialize(
  c: {
    id: string;
    participants: {
      user: { id: string; name: string };
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
  return [] as Array<{ id: string; name: string }>;
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

export async function sendMessage(
  conversationIdValue: unknown,
  bodyValue: unknown,
) {
  const user = await requireUser();
  const conversationId = parseId(conversationIdValue, "Conversation ID");
  const body = parseMessageBody(bodyValue);
  const result = await prisma.$transaction(async (tx) => {
    // Serialize one sender's burst within one Conversation across processes.
    // Without this transaction-scoped advisory lock, two concurrent first
    // messages can both miss the other's uncommitted insert and stage duplicate
    // in-app/email intents for the same 30-minute window.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${conversationId}:${user.id}`}, 0))`;

    const participant = await tx.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new Error("Sem permissão.");

    // Read before inserting the current Message. Comparing to the inserted
    // row's createdAt is unsafe because PostgreSQL's default now() is the
    // transaction-start timestamp: two serialized transactions may still get
    // equal or reverse timestamps. clock_timestamp() observes actual database
    // wall time after the advisory lock has been acquired and the prior writer
    // has committed.
    const recentPriorMessages = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "messages"
      WHERE "conversationId" = ${conversationId}
        AND "userId" = ${user.id}
        AND "createdAt" >= clock_timestamp()
          - (${MESSAGE_NOTIFICATION_DEBOUNCE_MINUTES} * INTERVAL '1 minute')
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 1
    `;

    const message = await tx.message.create({
      data: { conversationId, userId: user.id, body },
    });
    if (recentPriorMessages.length > 0) return { message, events: [] };

    const recipients = await tx.conversationParticipant.findMany({
      where: { conversationId, userId: { not: user.id } },
      select: { userId: true },
    });
    const events = [];
    for (const recipient of recipients) {
      events.push(
        ...(await persistNewMessageEvent(tx, {
          conversationId,
          messageId: message.id,
          recipientId: recipient.userId,
          actorId: user.id,
        })),
      );
    }
    return { message, events };
  });

  dispatchPersistedNotificationEvents(result.events);
  return result.message;
}

export async function markAsRead(messageIdValue: unknown) {
  const user = await requireUser();
  const messageId = parseId(messageIdValue, "Message ID");
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
