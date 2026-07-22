"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsRead,
  markNotificationRead,
  retryNotificationEmail,
  type NotificationView,
} from "@/lib/wepacker/actions/notification";
import { NOTIFICATION_COPY } from "@/lib/wepacker/notification-copy";

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function deliveryStatus(notification: NotificationView): string | null {
  if (
    !notification.email ||
    notification.email.status === "sent" ||
    notification.email.status === "superseded"
  ) {
    return null;
  }
  if (notification.email.status === "failed") {
    return notification.email.canRetry
      ? "Email delivery failed — retry available."
      : "Email delivery failed after all retries.";
  }
  return "Email delivery pending.";
}

export default function NotificationsPageClient({
  notifications,
}: {
  notifications: NotificationView[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  async function openNotification(notification: NotificationView) {
    setBusyId(notification.id);
    setError(null);
    try {
      if (!notification.readAt) await markNotificationRead(notification.id);
      router.push(notification.href);
      router.refresh();
    } catch {
      setError("Não foi possível abrir esta Notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      router.refresh();
    } catch {
      setError("Não foi possível atualizar as Notifications.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function retryEmail(notificationId: string) {
    setBusyId(notificationId);
    setError(null);
    try {
      await retryNotificationEmail(notificationId);
      router.refresh();
    } catch {
      setError("Não foi possível repetir o envio.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-wepac-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-wepac-text-tertiary">
            {unreadCount === 0
              ? "No unread Notifications."
              : `${unreadCount} unread Notification${unreadCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            disabled={markingAll}
            onClick={markAllRead}
            className="border border-wepac-border px-3 py-2 text-xs text-wepac-text-secondary disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-wepac-error">
          {error}
        </p>
      )}

      <div className="mt-6 border border-wepac-border bg-wepac-card">
        {notifications.length === 0 ? (
          <p className="p-6 text-sm text-wepac-text-tertiary">
            Relationship invitations, Session changes, shared notes and new
            Messages will appear here.
          </p>
        ) : (
          notifications.map((notification) => {
            const copy = NOTIFICATION_COPY[notification.type];
            const status = deliveryStatus(notification);
            return (
              <article
                key={notification.id}
                className={`border-b border-wepac-border p-5 last:border-b-0 ${
                  notification.readAt ? "opacity-70" : "bg-wepac-white/[0.03]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 flex-none rounded-full ${
                      notification.readAt
                        ? "bg-wepac-text-tertiary"
                        : "bg-wepac-white"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-barlow text-base font-bold text-wepac-white">
                      {copy.title}
                    </h2>
                    <p className="mt-1 text-sm text-wepac-text-secondary">
                      {copy.body}
                    </p>
                    <p className="mt-2 text-xs text-wepac-text-tertiary">
                      {formatWhen(notification.createdAt)}
                    </p>
                    {status && (
                      <p className="mt-2 text-xs text-wepac-warning">{status}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === notification.id}
                        onClick={() => openNotification(notification)}
                        className="bg-wepac-white px-3 py-1.5 text-xs font-bold text-wepac-black disabled:opacity-50"
                      >
                        Open
                      </button>
                      {notification.email?.canRetry && (
                        <button
                          type="button"
                          disabled={busyId === notification.id}
                          onClick={() => retryEmail(notification.id)}
                          className="border border-wepac-border px-3 py-1.5 text-xs text-wepac-text-secondary disabled:opacity-50"
                        >
                          Retry email
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
