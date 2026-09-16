import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const conversationFindMany = vi.fn();
const conversationFindFirst = vi.fn();
const conversationCreate = vi.fn();
const userFindMany = vi.fn();

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    conversation: {
      findMany: (...args: unknown[]) => conversationFindMany(...args),
      findFirst: (...args: unknown[]) => conversationFindFirst(...args),
      create: (...args: unknown[]) => conversationCreate(...args),
    },
    user: { findMany: (...args: unknown[]) => userFindMany(...args) },
  },
}));

vi.mock("@/lib/email", () => ({ sendNewMessageEmail: vi.fn() }));

import {
  getMentoredConversations,
  getMessagingContacts,
  getMyConversations,
  startConversation,
} from "@/lib/wepacker/actions/message";

describe("Message capability containment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({
      id: "person-1",
      role: "admin",
      name: "Person One",
    });
    conversationFindMany.mockResolvedValue([]);
  });

  it("does not infer new Message contacts even for Admin", async () => {
    await expect(getMessagingContacts()).resolves.toEqual([]);
    expect(userFindMany).not.toHaveBeenCalled();

    await expect(startConversation("person-2")).rejects.toThrow("Sem permissão.");
    expect(conversationFindFirst).not.toHaveBeenCalled();
    expect(conversationCreate).not.toHaveBeenCalled();
  });

  it("disables cross-person inbox reads without a Message grant", async () => {
    await expect(getMentoredConversations()).rejects.toThrow(
      "Explicit Message grant required."
    );
    expect(conversationFindMany).not.toHaveBeenCalled();
  });

  it("keeps existing explicit participant conversations readable", async () => {
    await expect(getMyConversations()).resolves.toEqual([]);
    expect(conversationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { participants: { some: { userId: "person-1" } } },
      })
    );
  });
});
