"use server";

import type { EmailOutboxStatus, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import {
  dispatchEmailOutboxById,
  MAX_EMAIL_ATTEMPTS,
} from "@/lib/wepacker/notifications";

const MAX_ID_LENGTH = 128;

function assertNotificationId(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_ID_LENGTH
  ) {
    throw new Error("Notification indisponível ou sem permissão.");
  }
}

function revalidateNotificationSurfaces() {
  revalidatePath("/wepacker/notifications");
  revalidatePath("/wepacker", "layout");
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  href: string;
  readAt: string | null;
  createdAt: string;
  email: {
    status: EmailOutboxStatus;
    attempts: number;
    canRetry: boolean;
  } | null;
}

export async function getMyNotifications(): Promise<NotificationView[]> {
  const actor = await requireUser();
  const rows = await prisma.notification.findMany({
    where: { recipientId: actor.id },
    select: {
      id: true,
      type: true,
      href: true,
      readAt: true,
      createdAt: true,
      emailIntent: {
        select: { status: true, attempts: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    href: row.href,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    email: row.emailIntent
      ? {
          status: row.emailIntent.status,
          attempts: row.emailIntent.attempts,
          canRetry:
            row.emailIntent.status === "failed" &&
            row.emailIntent.attempts < MAX_EMAIL_ATTEMPTS,
        }
      : null,
  }));
}

export async function markNotificationRead(notificationId: string) {
  assertNotificationId(notificationId);
  const actor = await requireUser();
  try {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: actor.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count !== 1) {
      const owned = await prisma.notification.count({
        where: { id: notificationId, recipientId: actor.id },
      });
      if (owned !== 1) {
        throw new Error("Notification indisponível ou sem permissão.");
      }
    }
  } catch {
    throw new Error("Notification indisponível ou sem permissão.");
  }
  revalidateNotificationSurfaces();
}

export async function markAllNotificationsRead() {
  const actor = await requireUser();
  try {
    await prisma.notification.updateMany({
      where: { recipientId: actor.id, readAt: null },
      data: { readAt: new Date() },
    });
  } catch {
    throw new Error("Não foi possível atualizar as Notifications.");
  }
  revalidateNotificationSurfaces();
}

export async function retryNotificationEmail(notificationId: string) {
  assertNotificationId(notificationId);
  const actor = await requireUser();
  try {
    const outbox = await prisma.emailOutbox.findFirst({
      where: {
        notificationId,
        recipientId: actor.id,
        status: "failed",
        attempts: { lt: MAX_EMAIL_ATTEMPTS },
      },
      select: { id: true },
    });
    if (!outbox) {
      throw new Error("Email indisponível ou sem permissão.");
    }

    const reset = await prisma.emailOutbox.updateMany({
      where: {
        id: outbox.id,
        recipientId: actor.id,
        status: "failed",
        attempts: { lt: MAX_EMAIL_ATTEMPTS },
      },
      data: {
        status: "pending",
        nextAttemptAt: new Date(),
        lockedAt: null,
      },
    });
    if (reset.count !== 1) {
      throw new Error("Email indisponível ou sem permissão.");
    }
    await dispatchEmailOutboxById(outbox.id);
  } catch {
    throw new Error("Email indisponível ou sem permissão.");
  }
  revalidateNotificationSurfaces();
}
