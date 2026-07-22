import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const notificationFindMany = vi.fn();
const notificationUpdateMany = vi.fn();
const notificationCount = vi.fn();
const emailOutboxFindFirst = vi.fn();
const emailOutboxUpdateMany = vi.fn();
const dispatchEmailOutboxById = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: (...args: unknown[]) => notificationFindMany(...args),
      updateMany: (...args: unknown[]) => notificationUpdateMany(...args),
      count: (...args: unknown[]) => notificationCount(...args),
    },
    emailOutbox: {
      findFirst: (...args: unknown[]) => emailOutboxFindFirst(...args),
      updateMany: (...args: unknown[]) => emailOutboxUpdateMany(...args),
    },
  },
}));
vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/wepacker/notifications", () => ({
  MAX_EMAIL_ATTEMPTS: 5,
  dispatchEmailOutboxById: (...args: unknown[]) =>
    dispatchEmailOutboxById(...args),
}));

import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  retryNotificationEmail,
} from "@/lib/wepacker/actions/notification";

beforeEach(() => {
  vi.resetAllMocks();
  requireUser.mockResolvedValue({ id: "person-1" });
});

describe("Notification recipient containment", () => {
  it("lists only the actor's content-free rows", async () => {
    const createdAt = new Date("2026-07-22T12:00:00.000Z");
    notificationFindMany.mockResolvedValueOnce([
      {
        id: "notification-1",
        type: "pack_invited",
        href: "/wepacker/communities",
        readAt: null,
        createdAt,
        emailIntent: { status: "failed", attempts: 2 },
      },
    ]);

    await expect(getMyNotifications()).resolves.toEqual([
      {
        id: "notification-1",
        type: "pack_invited",
        href: "/wepacker/communities",
        readAt: null,
        createdAt: createdAt.toISOString(),
        email: { status: "failed", attempts: 2, canRetry: true },
      },
    ]);
    expect(notificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: "person-1" },
        take: 100,
      }),
    );
    expect(JSON.stringify(notificationFindMany.mock.calls)).not.toMatch(
      /payload|recipientName|actorName|emailAddress|relationshipType/,
    );
  });

  it("cannot mark another Person's row as read", async () => {
    notificationUpdateMany.mockResolvedValueOnce({ count: 0 });
    notificationCount.mockResolvedValueOnce(0);
    await expect(markNotificationRead("notification-other")).rejects.toThrow(
      "indisponível ou sem permissão",
    );
    expect(notificationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "notification-other",
        recipientId: "person-1",
        readAt: null,
      },
      data: { readAt: expect.any(Date) },
    });
  });

  it("marks all rows only through the actor recipient scope", async () => {
    notificationUpdateMany.mockResolvedValueOnce({ count: 2 });
    await markAllNotificationsRead();
    expect(notificationUpdateMany).toHaveBeenCalledWith({
      where: { recipientId: "person-1", readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it("retries only the actor's own terminal email intent", async () => {
    emailOutboxFindFirst.mockResolvedValueOnce({ id: "outbox-1" });
    emailOutboxUpdateMany.mockResolvedValueOnce({ count: 1 });
    dispatchEmailOutboxById.mockResolvedValueOnce("sent");

    await retryNotificationEmail("notification-1");

    expect(emailOutboxFindFirst).toHaveBeenCalledWith({
      where: {
        notificationId: "notification-1",
        recipientId: "person-1",
        status: "failed",
        attempts: { lt: 5 },
      },
      select: { id: true },
    });
    expect(dispatchEmailOutboxById).toHaveBeenCalledWith("outbox-1");
  });
});
