import { describe, it, expect, vi, beforeEach } from "vitest";

// Story T1/M: a new message should email every other participant, but
// only once per rolling 30-minute window per sender — a fast
// back-and-forth must not spam the recipient's inbox on every message.

const participantFindUnique = vi.fn();
const messageCreate = vi.fn();
const participantFindMany = vi.fn();
const queryRaw = vi.fn();
const persistNewMessageEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const prismaTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      $queryRaw: (...args: unknown[]) => queryRaw(...args),
      conversationParticipant: {
        findUnique: (...args: unknown[]) => participantFindUnique(...args),
        findMany: (...args: unknown[]) => participantFindMany(...args),
      },
      message: {
        create: (...args: unknown[]) => messageCreate(...args),
      },
    }),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    conversationParticipant: {
      findUnique: (...args: unknown[]) => participantFindUnique(...args),
      findMany: (...args: unknown[]) => participantFindMany(...args),
    },
    message: {
      create: (...args: unknown[]) => messageCreate(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      prismaTransaction(callback),
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  getMentoredCohortIds: vi.fn(async () => []),
  requireUser: vi.fn(async () => ({ id: "sender-1", role: "member", name: "Sender One" })),
}));

vi.mock("@/lib/wepacker/notifications", () => ({
  persistNewMessageEvent: (...args: unknown[]) =>
    persistNewMessageEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
}));

import { sendMessage } from "@/lib/wepacker/actions/message";

describe("sendMessage — new message notification debounce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    participantFindUnique.mockResolvedValue({ id: "participant-1" });
    participantFindMany.mockResolvedValue([
      { userId: "recipient-1" },
    ]);
    persistNewMessageEvent.mockResolvedValue([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
  });

  it("stages both notification channels for the first message of a conversation burst", async () => {
    messageCreate.mockResolvedValueOnce({
      id: "message-1",
      createdAt: new Date("2026-08-01T10:00:00.000Z"),
    });
    queryRaw
      .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }])
      .mockResolvedValueOnce([]); // no recent prior message

    await sendMessage("conversation-1", "Olá!");

    expect(persistNewMessageEvent).toHaveBeenCalledWith(expect.any(Object), {
      conversationId: "conversation-1",
      messageId: "message-1",
      recipientId: "recipient-1",
      actorId: "sender-1",
    });
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
  });

  it("skips the email when the sender already messaged this conversation within 30 minutes", async () => {
    messageCreate.mockResolvedValueOnce({
      id: "message-2",
      createdAt: new Date("2026-08-01T10:05:00.000Z"),
    });
    queryRaw
      .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }])
      .mockResolvedValueOnce([{ id: "message-1" }]);

    await sendMessage("conversation-1", "Ainda aqui?");

    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(persistNewMessageEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([]);
  });

  it("sends again once the debounce window has elapsed", async () => {
    messageCreate.mockResolvedValueOnce({
      id: "message-3",
      createdAt: new Date("2026-08-01T11:00:00.000Z"),
    });
    queryRaw
      .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }])
      .mockResolvedValueOnce([]); // outside the window — none found

    await sendMessage("conversation-1", "De volta.");

    expect(persistNewMessageEvent).toHaveBeenCalledOnce();
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledOnce();
  });

  it("takes the sender+Conversation advisory lock and checks the burst before insert", async () => {
    const order: string[] = [];
    queryRaw
      .mockImplementationOnce(async () => {
        order.push("lock");
        return [{ pg_advisory_xact_lock: null }];
      })
      .mockImplementationOnce(async (...args: unknown[]) => {
        order.push("debounce-read");
        expect(String.raw(args[0] as TemplateStringsArray)).toContain(
          "clock_timestamp()",
        );
        return [];
      });
    messageCreate.mockImplementationOnce(async () => {
      order.push("create");
      return {
        id: "message-concurrent",
        createdAt: new Date("2026-08-01T10:00:00.000Z"),
      };
    });

    await sendMessage("conversation-1", "Concurrent first message");

    expect(order).toEqual(["lock", "debounce-read", "create"]);
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it("debounces even when transaction-start timestamps are equal or reversed", async () => {
    queryRaw
      .mockResolvedValueOnce([{ pg_advisory_xact_lock: null }])
      .mockResolvedValueOnce([{ id: "prior-same-millisecond" }]);
    messageCreate.mockResolvedValueOnce({
      id: "message-with-earlier-created-at",
      // This is deliberately earlier than the conceptual prior row. The
      // algorithm no longer compares the two transaction-start timestamps.
      createdAt: new Date("2026-08-01T09:59:59.999Z"),
    });

    await sendMessage("conversation-1", "Timestamp race");

    expect(persistNewMessageEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([]);
  });

  it("rejects oversized or forged serialized message input before storage", async () => {
    await expect(
      sendMessage("conversation-1", "x".repeat(10_001)),
    ).rejects.toThrow("Mensagem demasiado longa");
    await expect(
      sendMessage({ id: "conversation-1" }, "Olá"),
    ).rejects.toThrow("Conversation ID must be a string");
    expect(messageCreate).not.toHaveBeenCalled();
  });
});
