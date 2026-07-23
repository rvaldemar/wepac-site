export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  if (process.env.NOTIFICATION_OUTBOX_WORKER_ENABLED === "true") {
    const { startNotificationOutboxWorker } =
      await import("@/lib/wepacker/notification-outbox-worker");
    startNotificationOutboxWorker();
  }

  if (process.env.SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED === "true") {
    const { startSupportPreviewRetentionWorker } =
      await import("@/lib/wepacker/support-preview-retention-worker");
    startSupportPreviewRetentionWorker();
  }

  if (process.env.SESSION_MEDIA_RETENTION_WORKER_ENABLED === "true") {
    const { startSessionMediaRetentionWorker } =
      await import("@/lib/wepacker/session-media/retention-worker");
    startSessionMediaRetentionWorker();
  }
}
