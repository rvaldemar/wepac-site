import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const requireUser = vi.fn();
const userFindUnique = vi.fn();
const mentorshipFindMany = vi.fn();
const mentorshipFindUnique = vi.fn();
const mentorshipCreate = vi.fn();
const mentorshipUpdateMany = vi.fn();
const mentorshipCount = vi.fn();
const messageCount = vi.fn();
const actionCount = vi.fn();
const notificationCount = vi.fn();
const notificationUpdateMany = vi.fn();
const persistMentorshipEvent = vi.fn();
const dispatchPersistedNotificationEvents = vi.fn();
const prismaTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      mentorship: {
        create: (...args: unknown[]) => mentorshipCreate(...args),
        updateMany: (...args: unknown[]) => mentorshipUpdateMany(...args),
        findUnique: (...args: unknown[]) => mentorshipFindUnique(...args),
      },
      notification: {
        updateMany: (...args: unknown[]) => notificationUpdateMany(...args),
      },
    }),
);

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));
vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
    },
    mentorship: {
      findMany: (...args: unknown[]) => mentorshipFindMany(...args),
      findUnique: (...args: unknown[]) => mentorshipFindUnique(...args),
      create: (...args: unknown[]) => mentorshipCreate(...args),
      updateMany: (...args: unknown[]) => mentorshipUpdateMany(...args),
      count: (...args: unknown[]) => mentorshipCount(...args),
    },
    message: { count: (...args: unknown[]) => messageCount(...args) },
    action: { count: (...args: unknown[]) => actionCount(...args) },
    notification: {
      count: (...args: unknown[]) => notificationCount(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      prismaTransaction(callback),
  },
}));
vi.mock("@/lib/wepacker/notifications", () => ({
  persistMentorshipEvent: (...args: unknown[]) =>
    persistMentorshipEvent(...args),
  dispatchPersistedNotificationEvents: (...args: unknown[]) =>
    dispatchPersistedNotificationEvents(...args),
}));

import {
  endMentorship,
  getMyMentorships,
  inviteMentee,
  respondToMentorship,
} from "@/lib/wepacker/actions/mentorship";
import { getSidebarCounts } from "@/lib/wepacker/actions/user";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "true");
  requireUser.mockResolvedValue({
    id: "mentor-1",
    name: "Rui Mentor",
    role: "member",
  });
  mentorshipFindMany.mockResolvedValue([]);
  persistMentorshipEvent.mockResolvedValue([
    { notificationId: "notification-1", outboxId: "outbox-1" },
  ]);
  messageCount.mockResolvedValue(0);
  actionCount.mockResolvedValue(0);
  notificationCount.mockResolvedValue(0);
  notificationUpdateMany.mockResolvedValue({ count: 1 });
  mentorshipCount.mockResolvedValue(0);
});

afterEach(() => vi.unstubAllEnvs());

describe("Mentorship invitation authority", () => {
  it("fails closed before authorization when consent writes are disabled", async () => {
    vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "false");
    await expect(inviteMentee("alex@example.test")).rejects.toThrow(
      "Mentorship invitations are temporarily disabled",
    );
    expect(requireUser).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

});

describe("Mentorship consent workflow", () => {
  it("creates a pending invitation by exact email with organizer consent only", async () => {
    userFindUnique.mockResolvedValueOnce({
      id: "mentee-1",
      name: "Alex Mentee",
      email: "alex@example.test",
    });
    mentorshipCreate.mockResolvedValueOnce({ id: "mentorship-1" });

    await expect(inviteMentee(" ALEX@EXAMPLE.TEST ")).resolves.toEqual({
      submitted: true,
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: "alex@example.test" },
      select: { id: true },
    });
    expect(mentorshipCreate).toHaveBeenCalledWith({
      data: {
        mentorId: "mentor-1",
        menteeId: "mentee-1",
        invitedById: "mentor-1",
        status: "pending",
        source: "invitation",
        invitedAt: expect.any(Date),
        mentorAcceptedAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(mentorshipCreate.mock.calls[0][0].data).not.toHaveProperty(
      "packMembershipId",
    );
    expect(persistMentorshipEvent).toHaveBeenCalledWith(
      expect.any(Object),
      {
        mentorshipId: "mentorship-1",
        recipientId: "mentee-1",
        actorId: "mentor-1",
        type: "mentorship_invited",
      },
    );
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledWith([
      { notificationId: "notification-1", outboxId: "outbox-1" },
    ]);
    expect(requireUser).toHaveBeenCalledOnce();
  });

  it("uses one generic acknowledgement for missing Person and self-invite", async () => {
    userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "mentor-1",
        name: "Self",
        email: "self@example.test",
      });
    await expect(inviteMentee("missing@example.test")).resolves.toEqual({
      submitted: true,
    });
    await expect(inviteMentee("self@example.test")).resolves.toEqual({
      submitted: true,
    });
    expect(mentorshipCreate).not.toHaveBeenCalled();
  });

  it("does not reveal an existing live Mentorship through a unique conflict", async () => {
    userFindUnique.mockResolvedValueOnce({
      id: "mentee-1",
      name: "Alex Mentee",
      email: "alex@example.test",
    });
    mentorshipCreate.mockRejectedValueOnce({ code: "P2002" });

    await expect(inviteMentee("alex@example.test")).resolves.toEqual({
      submitted: true,
    });
    expect(dispatchPersistedNotificationEvents).not.toHaveBeenCalled();
  });

  it("activates only the invited Mentee's accepted invitation", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentee-1", role: "member" });
    mentorshipUpdateMany.mockResolvedValueOnce({ count: 1 });
    mentorshipFindUnique.mockResolvedValueOnce({
      mentorId: "mentor-1",
      menteeId: "mentee-1",
    });
    await respondToMentorship("mentorship-1", "accept");
    expect(mentorshipUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "mentorship-1",
        menteeId: "mentee-1",
        status: "pending",
        mentorAcceptedAt: { not: null },
      },
      data: {
        status: "active",
        menteeAcceptedAt: expect.any(Date),
        activatedAt: expect.any(Date),
      },
    });
    expect(persistMentorshipEvent).toHaveBeenCalledWith(
      expect.any(Object),
      {
        mentorshipId: "mentorship-1",
        recipientId: "mentor-1",
        actorId: "mentee-1",
        type: "mentorship_accepted",
      },
    );
    expect(dispatchPersistedNotificationEvents).toHaveBeenCalledOnce();
    expect(notificationUpdateMany).toHaveBeenCalledWith({
      where: {
        recipientId: "mentee-1",
        resourceId: "mentorship-1",
        type: "mentorship_invited",
        readAt: null,
      },
      data: { readAt: expect.any(Date) },
    });
  });

  it("keeps decline and revocation available while new grants are disabled", async () => {
    requireUser.mockResolvedValue({ id: "mentee-1", role: "member" });
    vi.stubEnv("MENTORSHIP_WRITES_ENABLED", "false");
    mentorshipUpdateMany.mockResolvedValue({ count: 1 });
    await expect(
      respondToMentorship("mentorship-1", "decline"),
    ).resolves.toBeUndefined();
    await expect(endMentorship("mentorship-1")).resolves.toBeUndefined();
    expect(mentorshipUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ mentorId: "mentee-1" }, { menteeId: "mentee-1" }],
        }),
        data: { status: "ended", endedAt: expect.any(Date) },
      }),
    );
  });

  it("keeps relationship reads scoped to the actor without email fields", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentee-1", role: "member" });
    const invitedAt = new Date("2026-07-21T18:00:00.000Z");
    mentorshipFindMany.mockResolvedValueOnce([
      {
        id: "mentorship-1",
        status: "active",
        invitedById: "mentor-1",
        invitedAt,
        activatedAt: null,
        endedAt: null,
        mentor: { id: "mentor-1", name: "Rui" },
        mentee: { id: "mentee-1", name: "Alex" },
      },
    ]);
    const rows = await getMyMentorships();
    expect(rows[0].invitedAt).toBe(invitedAt.toISOString());
    const query = mentorshipFindMany.mock.calls.at(-1)![0];
    expect(query.where).toEqual({
      OR: [
        { menteeId: "mentee-1" },
        { mentorId: "mentee-1", status: { not: "pending" } },
      ],
    });
    expect(query.select.mentor.select).not.toHaveProperty("email");
    expect(query.select.mentee.select).not.toHaveProperty("email");
  });
});

describe("sidebar counters", () => {
  it("counts Person-owned open Actions without any membership lookup", async () => {
    requireUser.mockResolvedValueOnce({ id: "mentee-1", role: "member" });
    messageCount.mockResolvedValueOnce(2);
    actionCount.mockResolvedValueOnce(3);
    mentorshipCount.mockResolvedValueOnce(1);
    await expect(getSidebarCounts()).resolves.toEqual({
      unreadMessages: 2,
      pendingActions: 3,
      pendingMentorships: 1,
      unreadNotifications: 0,
    });
    expect(actionCount).toHaveBeenCalledWith({
      where: {
        assigneeId: "mentee-1",
        status: { in: ["pending", "in_progress"] },
      },
    });
    expect(notificationCount).toHaveBeenCalledWith({
      where: { recipientId: "mentee-1", readAt: null },
    });
  });
});
