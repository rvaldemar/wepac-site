import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const requireUser = vi.fn();
const userFindUnique = vi.fn();
const connectionFindUnique = vi.fn();
const connectionFindFirst = vi.fn();
const connectionFindMany = vi.fn();
const connectionCreate = vi.fn();
const connectionUpdateMany = vi.fn();
const packMembershipCreate = vi.fn();
const cycleEnrollmentCreate = vi.fn();
const mentorshipCreate = vi.fn();
const notificationUpdateMany = vi.fn();
const persistConnectionNotificationEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();

const transactionClient = {
  personConnection: {
    findUnique: (...args: unknown[]) => connectionFindUnique(...args),
    findFirst: (...args: unknown[]) => connectionFindFirst(...args),
    create: (...args: unknown[]) => connectionCreate(...args),
    updateMany: (...args: unknown[]) => connectionUpdateMany(...args),
  },
  notification: {
    updateMany: (...args: unknown[]) => notificationUpdateMany(...args),
  },
};

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));
vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/wepacker/notifications", () => ({
  persistConnectionNotificationEvent: (...args: unknown[]) =>
    persistConnectionNotificationEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
    personConnection: {
      findMany: (...args: unknown[]) => connectionFindMany(...args),
      updateMany: (...args: unknown[]) => connectionUpdateMany(...args),
    },
    packMembership: {
      create: (...args: unknown[]) => packMembershipCreate(...args),
    },
    cycleEnrollment: {
      create: (...args: unknown[]) => cycleEnrollmentCreate(...args),
    },
    mentorship: { create: (...args: unknown[]) => mentorshipCreate(...args) },
    $transaction: (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  },
}));

import {
  endConnection,
  getMyConnections,
  requestConnection,
  respondToConnection,
} from "@/lib/wepacker/actions/connection";

beforeEach(() => {
  vi.resetAllMocks();
  requireUser.mockResolvedValue({
    id: "z-person",
    name: "Rui",
    email: "rui@example.test",
    role: "member",
  });
  connectionCreate.mockResolvedValue({ id: "connection-1" });
  connectionUpdateMany.mockResolvedValue({ count: 1 });
  notificationUpdateMany.mockResolvedValue({ count: 1 });
  persistConnectionNotificationEvent.mockResolvedValue({
    notificationId: "notification-1",
    outboxId: "outbox-1",
  });
});

describe("Connection request privacy", () => {
  it("normalizes exact email, stores a canonical lexical pair and creates no inferred edge", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "a-person" });
    connectionFindUnique.mockResolvedValueOnce(null);

    await expect(
      requestConnection(" ALEX@EXAMPLE.TEST ", "friend"),
    ).resolves.toEqual({ submitted: true });

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: "alex@example.test" },
      select: { id: true },
    });
    expect(connectionFindUnique).toHaveBeenCalledWith({
      where: {
        firstUserId_secondUserId: {
          firstUserId: "a-person",
          secondUserId: "z-person",
        },
      },
      select: { id: true, status: true },
    });
    expect(connectionCreate).toHaveBeenCalledWith({
      data: {
        firstUserId: "a-person",
        secondUserId: "z-person",
        requestedById: "z-person",
        type: "friend",
        status: "pending",
        source: "explicit",
        requestedAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(persistConnectionNotificationEvent).toHaveBeenCalledWith(
      transactionClient,
      {
        connectionId: "connection-1",
        recipientId: "a-person",
        actorId: "z-person",
        type: "connection_requested",
        dedupeScope: expect.any(String),
      },
    );
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
    expect(packMembershipCreate).not.toHaveBeenCalled();
    expect(cycleEnrollmentCreate).not.toHaveBeenCalled();
    expect(mentorshipCreate).not.toHaveBeenCalled();
  });

  it("returns the same acknowledgement and never reopens active or refused targets", async () => {
    userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "z-person" })
      .mockResolvedValueOnce({ id: "a-person" })
      .mockResolvedValueOnce({ id: "a-person" })
      .mockResolvedValueOnce({ id: "a-person" });
    connectionFindUnique
      .mockResolvedValueOnce({ id: "connection-active", status: "active" })
      .mockResolvedValueOnce({ id: "connection-declined", status: "declined" })
      .mockResolvedValueOnce({ id: "connection-blocked", status: "blocked" });

    const missing = await requestConnection("missing@example.test", "family");
    const self = await requestConnection("self@example.test", "family");
    const active = await requestConnection("active@example.test", "family");
    const declined = await requestConnection("declined@example.test", "family");
    const blocked = await requestConnection("blocked@example.test", "family");

    expect(missing).toEqual({ submitted: true });
    expect(self).toEqual(missing);
    expect(active).toEqual(missing);
    expect(declined).toEqual(missing);
    expect(blocked).toEqual(missing);
    expect(connectionCreate).not.toHaveBeenCalled();
    expect(connectionUpdateMany).not.toHaveBeenCalled();
    expect(persistConnectionNotificationEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).not.toHaveBeenCalled();
  });

  it("allows a fresh request only after a voluntary end and uses a state CAS", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "a-person" });
    connectionFindUnique.mockResolvedValueOnce({
      id: "connection-ended",
      status: "ended",
    });

    await requestConnection("alex@example.test", "professional");

    expect(connectionUpdateMany).toHaveBeenCalledWith({
      where: { id: "connection-ended", status: "ended" },
      data: {
        requestedById: "z-person",
        type: "professional",
        status: "pending",
        source: "explicit",
        requestedAt: expect.any(Date),
        acceptedAt: null,
        endedAt: null,
      },
    });
    expect(persistConnectionNotificationEvent).toHaveBeenCalledOnce();
  });

  it("rejects relationship types outside PersonConnectionType before lookup", async () => {
    await expect(
      requestConnection("alex@example.test", "mentor" as "friend"),
    ).rejects.toThrow("Relationship type inválido.");
    expect(requireUser).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
  });
});

describe("Connection consent and resource authorization", () => {
  it("accepts only as the non-requesting endpoint and rejects an IDOR", async () => {
    connectionFindFirst.mockResolvedValueOnce(null);
    await expect(
      respondToConnection("connection-other", "accept"),
    ).rejects.toThrow("Connection indisponível ou sem permissão.");

    connectionFindFirst.mockResolvedValueOnce({ requestedById: "a-person" });
    connectionUpdateMany.mockResolvedValueOnce({ count: 1 });
    await respondToConnection("connection-1", "accept");

    expect(connectionFindFirst).toHaveBeenLastCalledWith({
      where: {
        id: "connection-1",
        status: "pending",
        requestedById: { not: "z-person" },
        OR: [{ firstUserId: "z-person" }, { secondUserId: "z-person" }],
      },
      select: { requestedById: true },
    });
    expect(connectionUpdateMany).toHaveBeenLastCalledWith({
      where: {
        id: "connection-1",
        status: "pending",
        requestedById: "a-person",
        OR: [{ firstUserId: "z-person" }, { secondUserId: "z-person" }],
      },
      data: {
        status: "active",
        acceptedAt: expect.any(Date),
        endedAt: null,
      },
    });
    expect(persistConnectionNotificationEvent).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        connectionId: "connection-1",
        recipientId: "a-person",
        actorId: "z-person",
        type: "connection_accepted",
      }),
    );
  });

  it("turns a target decline into a terminal block without acceptance email", async () => {
    connectionFindFirst.mockResolvedValueOnce({ requestedById: "a-person" });

    await respondToConnection("connection-1", "decline");

    expect(connectionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "connection-1",
        status: "pending",
        requestedById: "a-person",
        OR: [{ firstUserId: "z-person" }, { secondUserId: "z-person" }],
      },
      data: {
        status: "blocked",
        acceptedAt: null,
        endedAt: expect.any(Date),
      },
    });
    expect(notificationUpdateMany).toHaveBeenCalledOnce();
    expect(persistConnectionNotificationEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).not.toHaveBeenCalled();
  });

  it("rejects a concurrent or replayed response after the pending CAS loses", async () => {
    connectionFindFirst.mockResolvedValueOnce({ requestedById: "a-person" });
    connectionUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      respondToConnection("connection-1", "decline"),
    ).rejects.toThrow("Connection indisponível ou sem permissão.");

    expect(notificationUpdateMany).not.toHaveBeenCalled();
    expect(persistConnectionNotificationEvent).not.toHaveBeenCalled();
  });

  it("allows either explicit endpoint to end an active Connection", async () => {
    await endConnection("connection-1");
    expect(connectionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "connection-1",
        status: "active",
        OR: [{ firstUserId: "z-person" }, { secondUserId: "z-person" }],
      },
      data: { status: "ended", endedAt: expect.any(Date) },
    });
  });

  it("scopes reads to the actor and never selects endpoint emails", async () => {
    const requestedAt = new Date("2026-07-22T10:00:00.000Z");
    connectionFindMany.mockResolvedValueOnce([
      {
        id: "connection-1",
        type: "collaborator",
        status: "active",
        requestedById: "a-person",
        requestedAt,
        acceptedAt: null,
        firstUser: { id: "a-person", name: "Alex" },
        secondUser: { id: "z-person", name: "Rui" },
      },
    ]);

    await expect(getMyConnections()).resolves.toEqual([
      expect.objectContaining({
        id: "connection-1",
        requestedAt: requestedAt.toISOString(),
        otherPerson: { id: "a-person", name: "Alex" },
      }),
    ]);

    const query = connectionFindMany.mock.calls[0][0];
    expect(query.where.OR).toEqual([
      {
        status: "active",
        OR: [
          { firstUserId: "z-person" },
          { secondUserId: "z-person" },
        ],
      },
      {
        status: "pending",
        requestedById: { not: "z-person" },
        OR: [
          { firstUserId: "z-person" },
          { secondUserId: "z-person" },
        ],
      },
    ]);
    expect(query.select.firstUser.select).not.toHaveProperty("email");
    expect(query.select.secondUser.select).not.toHaveProperty("email");
  });
});
