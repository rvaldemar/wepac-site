import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const requireUser = vi.fn();
const userFindUnique = vi.fn();
const packFindUnique = vi.fn();
const packFindFirst = vi.fn();
const packCreate = vi.fn();
const packUpdateMany = vi.fn();
const packMembershipFindMany = vi.fn();
const packMembershipFindFirst = vi.fn();
const packMembershipCreate = vi.fn();
const packMembershipUpdateMany = vi.fn();
const packMembershipCount = vi.fn();
const connectionCreate = vi.fn();
const cycleEnrollmentCreate = vi.fn();
const mentorshipCreate = vi.fn();
const notificationUpdateMany = vi.fn();
const persistPackNotificationEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const queryRaw = vi.fn();

const transactionClient = {
  pack: {
    findUnique: (...args: unknown[]) => packFindUnique(...args),
    create: (...args: unknown[]) => packCreate(...args),
    updateMany: (...args: unknown[]) => packUpdateMany(...args),
  },
  packMembership: {
    findFirst: (...args: unknown[]) => packMembershipFindFirst(...args),
    create: (...args: unknown[]) => packMembershipCreate(...args),
    updateMany: (...args: unknown[]) => packMembershipUpdateMany(...args),
    count: (...args: unknown[]) => packMembershipCount(...args),
  },
  notification: {
    updateMany: (...args: unknown[]) => notificationUpdateMany(...args),
  },
  $queryRaw: (...args: unknown[]) => queryRaw(...args),
};

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));
vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/wepacker/notifications", () => ({
  persistPackNotificationEvent: (...args: unknown[]) =>
    persistPackNotificationEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
    pack: {
      findUnique: (...args: unknown[]) => packFindUnique(...args),
      findFirst: (...args: unknown[]) => packFindFirst(...args),
    },
    packMembership: {
      findMany: (...args: unknown[]) => packMembershipFindMany(...args),
    },
    personConnection: {
      create: (...args: unknown[]) => connectionCreate(...args),
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
  createMyPack,
  getMyCommunities,
  inviteToMyPack,
  leavePack,
  respondToPackInvitation,
} from "@/lib/wepacker/actions/community";

beforeEach(() => {
  vi.resetAllMocks();
  requireUser.mockResolvedValue({
    id: "person-rui",
    name: "Rui",
    email: "rui@example.test",
    role: "member",
  });
  packMembershipCreate.mockResolvedValue({ id: "membership-owner" });
  packMembershipUpdateMany.mockResolvedValue({ count: 1 });
  packUpdateMany.mockResolvedValue({ count: 1 });
  notificationUpdateMany.mockResolvedValue({ count: 1 });
  persistPackNotificationEvent.mockResolvedValue({
    notificationId: "notification-1",
    outboxId: "outbox-1",
  });
});

describe("personal community Pack", () => {
  it("creates one personal Pack with an explicit active owner membership", async () => {
    packFindUnique.mockResolvedValueOnce(null);
    packCreate.mockResolvedValueOnce({ id: "pack-rui" });

    await expect(createMyPack()).resolves.toEqual({
      id: "pack-rui",
      created: true,
    });

    expect(packCreate).toHaveBeenCalledWith({
      data: {
        slug: "my-pack-person-rui",
        name: "Rui's Pack",
        status: "draft",
        source: "explicit",
        createdById: "person-rui",
        personalOwnerId: "person-rui",
      },
      select: { id: true },
    });
    expect(packMembershipCreate).toHaveBeenCalledWith({
      data: {
        packId: "pack-rui",
        userId: "person-rui",
        invitedById: "person-rui",
        role: "owner",
        status: "active",
        source: "explicit",
        invitedAt: expect.any(Date),
        joinedAt: expect.any(Date),
      },
    });
  });

  it("returns the existing My Pack and does not create a second one", async () => {
    packFindUnique.mockResolvedValueOnce({ id: "pack-rui" });
    await expect(createMyPack()).resolves.toEqual({
      id: "pack-rui",
      created: false,
    });
    expect(packCreate).not.toHaveBeenCalled();
    expect(packMembershipCreate).not.toHaveBeenCalled();
  });

  it("lists generic and other personal Packs without exposing endpoint email", async () => {
    packFindUnique.mockResolvedValueOnce(null);
    packMembershipFindMany.mockResolvedValueOnce([]);

    await expect(getMyCommunities()).resolves.toEqual({
      ownedPack: null,
      joinedPacks: [],
    });

    const query = packMembershipFindMany.mock.calls[0][0];
    expect(query.where).toEqual({
      userId: "person-rui",
      status: { in: ["invited", "active"] },
      pack: {
        is: {
          archivedAt: null,
          OR: [
            { personalOwnerId: null },
            { personalOwnerId: { not: "person-rui" } },
          ],
        },
      },
    });
    expect(query.select.pack.select).toHaveProperty("name", true);
    expect(query.select.pack.select.personalOwner.select).not.toHaveProperty(
      "email",
    );
    expect(packFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          memberships: expect.objectContaining({ where: { status: "active" } }),
        }),
      }),
    );
  });
});

describe("Pack invitation privacy and independent consent", () => {
  it("uses exact normalized email and returns the same acknowledgement for missing, self and existing People", async () => {
    packFindFirst.mockResolvedValue({ id: "pack-rui" });
    userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "person-rui" })
      .mockResolvedValueOnce({ id: "person-alex" });
    packMembershipFindFirst.mockResolvedValueOnce({
      id: "membership-alex",
      status: "active",
    });

    const missing = await inviteToMyPack("pack-rui", " Missing@Example.Test ");
    const self = await inviteToMyPack("pack-rui", "rui@example.test");
    const existing = await inviteToMyPack("pack-rui", "alex@example.test");

    expect(missing).toEqual({ submitted: true });
    expect(self).toEqual(missing);
    expect(existing).toEqual(missing);
    expect(userFindUnique).toHaveBeenNthCalledWith(1, {
      where: { email: "missing@example.test" },
      select: { id: true },
    });
    expect(packMembershipCreate).not.toHaveBeenCalled();
  });

  it("creates only an invited Pack Membership and never infers another edge", async () => {
    packFindFirst.mockResolvedValueOnce({ id: "pack-rui" });
    userFindUnique.mockResolvedValueOnce({ id: "person-alex" });
    packMembershipFindFirst.mockResolvedValueOnce(null);
    packMembershipCreate.mockResolvedValueOnce({ id: "membership-alex" });

    await inviteToMyPack("pack-rui", "alex@example.test");

    expect(packMembershipCreate).toHaveBeenCalledWith({
      data: {
        packId: "pack-rui",
        userId: "person-alex",
        invitedById: "person-rui",
        role: "member",
        status: "invited",
        source: "invitation",
        invitedAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(persistPackNotificationEvent).toHaveBeenCalledWith(
      transactionClient,
      {
        packMembershipId: "membership-alex",
        recipientId: "person-alex",
        actorId: "person-rui",
        type: "pack_invited",
        dedupeScope: expect.any(String),
      },
    );
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
    expect(connectionCreate).not.toHaveBeenCalled();
    expect(cycleEnrollmentCreate).not.toHaveBeenCalled();
    expect(mentorshipCreate).not.toHaveBeenCalled();
  });

  it("never reopens or emails after the invited Person has declined", async () => {
    packFindFirst.mockResolvedValueOnce({ id: "pack-rui" });
    userFindUnique.mockResolvedValueOnce({ id: "person-alex" });
    packMembershipFindFirst.mockResolvedValueOnce({
      id: "membership-alex",
      status: "removed",
      declinedAt: new Date(),
    });

    await expect(
      inviteToMyPack("pack-rui", "alex@example.test"),
    ).resolves.toEqual({ submitted: true });

    expect(packMembershipUpdateMany).not.toHaveBeenCalled();
    expect(persistPackNotificationEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).not.toHaveBeenCalled();
  });

  it("preserves voluntary leave semantics by allowing a fresh invitation with a state CAS", async () => {
    packFindFirst.mockResolvedValueOnce({ id: "pack-rui" });
    userFindUnique.mockResolvedValueOnce({ id: "person-alex" });
    packMembershipFindFirst.mockResolvedValueOnce({
      id: "membership-alex",
      status: "left",
    });

    await inviteToMyPack("pack-rui", "alex@example.test");

    expect(packMembershipUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "membership-alex",
        status: { in: ["left", "removed"] },
        declinedAt: null,
      },
      data: {
        invitedById: "person-rui",
        role: "member",
        status: "invited",
        source: "invitation",
        invitedAt: expect.any(Date),
        joinedAt: null,
        endedAt: null,
        declinedAt: null,
      },
    });
    expect(persistPackNotificationEvent).toHaveBeenCalledOnce();
  });

  it("rejects IDOR before mutation and lets only the invited Person accept", async () => {
    packMembershipFindFirst.mockResolvedValueOnce(null);
    await expect(
      respondToPackInvitation("membership-alex", "accept"),
    ).rejects.toThrow("Invitation indisponível ou sem permissão.");
    expect(packMembershipUpdateMany).not.toHaveBeenCalled();

    requireUser.mockResolvedValueOnce({
      id: "person-alex",
      name: "Alex",
      email: "alex@example.test",
      role: "member",
    });
    packMembershipFindFirst.mockResolvedValueOnce({
      packId: "pack-rui",
      pack: { personalOwnerId: "person-rui" },
    });
    packMembershipUpdateMany.mockResolvedValueOnce({ count: 1 });
    queryRaw.mockResolvedValueOnce([
      { status: "draft", activatedAt: null, archivedAt: null },
    ]);
    packMembershipCount.mockResolvedValueOnce(2);

    await respondToPackInvitation("membership-alex", "accept");

    expect(packMembershipFindFirst).toHaveBeenLastCalledWith({
      where: {
        id: "membership-alex",
        userId: "person-alex",
        role: "member",
        status: "invited",
      },
      select: {
        packId: true,
        pack: { select: { personalOwnerId: true } },
      },
    });
    expect(packMembershipUpdateMany).toHaveBeenLastCalledWith({
      where: {
        id: "membership-alex",
        userId: "person-alex",
        role: "member",
        status: "invited",
      },
      data: {
        status: "active",
        joinedAt: expect.any(Date),
        endedAt: null,
        declinedAt: null,
      },
    });
    expect(packUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "active", activatedAt: expect.any(Date) },
      }),
    );
    const lockSql = queryRaw.mock.calls[0][0] as {
      strings?: readonly string[];
    };
    expect(lockSql.strings?.join("?")).toMatch(
      /FROM "community_packs"[\s\S]*FOR UPDATE/,
    );
    expect(queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      packMembershipCount.mock.invocationCallOrder[0],
    );
    expect(packMembershipCount.mock.invocationCallOrder[0]).toBeLessThan(
      packUpdateMany.mock.invocationCallOrder[0],
    );
    expect(persistPackNotificationEvent).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        packMembershipId: "membership-alex",
        recipientId: "person-rui",
        actorId: "person-alex",
        type: "pack_accepted",
      }),
    );
  });

  it("stores a target decline separately from voluntary leave and sends no acceptance event", async () => {
    requireUser.mockResolvedValueOnce({
      id: "person-alex",
      name: "Alex",
      email: "alex@example.test",
      role: "member",
    });
    packMembershipFindFirst.mockResolvedValueOnce({
      packId: "pack-rui",
      pack: { personalOwnerId: "person-rui" },
    });
    queryRaw.mockResolvedValueOnce([
      { status: "draft", activatedAt: null, archivedAt: null },
    ]);
    packMembershipCount.mockResolvedValueOnce(1);

    await respondToPackInvitation("membership-alex", "decline");

    expect(packMembershipUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "membership-alex",
        userId: "person-alex",
        role: "member",
        status: "invited",
      },
      data: {
        status: "removed",
        joinedAt: null,
        endedAt: expect.any(Date),
        declinedAt: expect.any(Date),
      },
    });
    expect(notificationUpdateMany).toHaveBeenCalledOnce();
    expect(persistPackNotificationEvent).not.toHaveBeenCalled();
    expect(dispatchPersistedNotificationEvents).not.toHaveBeenCalled();
  });

  it("rejects a concurrent or replayed invitation response after the CAS loses", async () => {
    requireUser.mockResolvedValueOnce({
      id: "person-alex",
      name: "Alex",
      email: "alex@example.test",
      role: "member",
    });
    packMembershipFindFirst.mockResolvedValueOnce({
      packId: "pack-rui",
      pack: { personalOwnerId: "person-rui" },
    });
    packMembershipUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      respondToPackInvitation("membership-alex", "decline"),
    ).rejects.toThrow("Invitation indisponível ou sem permissão.");

    expect(notificationUpdateMany).not.toHaveBeenCalled();
    expect(queryRaw).not.toHaveBeenCalled();
    expect(persistPackNotificationEvent).not.toHaveBeenCalled();
  });

  it("returns a Pack to draft when a non-owner leaves below two active People", async () => {
    requireUser.mockResolvedValueOnce({
      id: "person-alex",
      name: "Alex",
      email: "alex@example.test",
      role: "member",
    });
    packMembershipFindFirst.mockResolvedValueOnce({ packId: "pack-rui" });
    packMembershipUpdateMany.mockResolvedValueOnce({ count: 1 });
    queryRaw.mockResolvedValueOnce([
      { status: "active", activatedAt: new Date(), archivedAt: null },
    ]);
    packMembershipCount.mockResolvedValueOnce(1);

    await leavePack("membership-alex");

    expect(packMembershipFindFirst).toHaveBeenCalledWith({
      where: {
        id: "membership-alex",
        userId: "person-alex",
        role: { in: ["member", "moderator"] },
        status: "active",
      },
      select: { packId: true },
    });
    expect(packUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "draft", activatedAt: null } }),
    );
    expect(queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      packMembershipCount.mock.invocationCallOrder[0],
    );
  });
});
