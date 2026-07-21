import { describe, it, expect, vi, beforeEach } from "vitest";

// Story T1/M: a new message should email every other participant, but
// only once per rolling 30-minute window per sender — a fast
// back-and-forth must not spam the recipient's inbox on every message.

const participantFindUnique = vi.fn();
const messageCreate = vi.fn();
const messageFindFirst = vi.fn();
const participantFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    conversationParticipant: {
      findUnique: (...args: unknown[]) => participantFindUnique(...args),
      findMany: (...args: unknown[]) => participantFindMany(...args),
    },
    message: {
      create: (...args: unknown[]) => messageCreate(...args),
      findFirst: (...args: unknown[]) => messageFindFirst(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  getMentoredCohortIds: vi.fn(async () => []),
  requireUser: vi.fn(async () => ({ id: "sender-1", role: "member", name: "Sender One" })),
}));

const sendNewMessageEmail = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/lib/email", () => ({
  sendNewMessageEmail: (...args: unknown[]) => sendNewMessageEmail(...args),
}));

import { sendMessage } from "@/lib/wepacker/actions/message";

describe("sendMessage — new message notification debounce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    participantFindUnique.mockResolvedValue({ id: "participant-1" });
    participantFindMany.mockResolvedValue([
      { user: { name: "Recipient One", email: "recipient1@wepac.pt" } },
    ]);
  });

  it("sends an email for the first message of a conversation burst", async () => {
    messageCreate.mockResolvedValueOnce({
      id: "message-1",
      createdAt: new Date("2026-08-01T10:00:00.000Z"),
    });
    messageFindFirst.mockResolvedValueOnce(null); // no recent prior message

    await sendMessage("conversation-1", "Olá!");

    await vi.waitFor(() => {
      expect(sendNewMessageEmail).toHaveBeenCalledTimes(1);
    });
    expect(sendNewMessageEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient1@wepac.pt",
        recipientName: "Recipient One",
        senderName: "Sender One",
      })
    );
  });

  it("skips the email when the sender already messaged this conversation within 30 minutes", async () => {
    messageCreate.mockResolvedValueOnce({
      id: "message-2",
      createdAt: new Date("2026-08-01T10:05:00.000Z"),
    });
    messageFindFirst.mockResolvedValueOnce({ id: "message-1" }); // recent prior message found

    await sendMessage("conversation-1", "Ainda aqui?");

    // Give any (incorrectly) fired fan-off a tick to happen before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendNewMessageEmail).not.toHaveBeenCalled();
  });

  it("sends again once the debounce window has elapsed", async () => {
    messageCreate.mockResolvedValueOnce({
      id: "message-3",
      createdAt: new Date("2026-08-01T11:00:00.000Z"),
    });
    messageFindFirst.mockResolvedValueOnce(null); // outside the window — none found

    await sendMessage("conversation-1", "De volta.");

    await vi.waitFor(() => {
      expect(sendNewMessageEmail).toHaveBeenCalledTimes(1);
    });
  });
});
