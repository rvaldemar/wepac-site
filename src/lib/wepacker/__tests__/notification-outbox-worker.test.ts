import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dispatchDueEmailOutbox = vi.fn();

vi.mock("@/lib/wepacker/notifications", () => ({
  dispatchDueEmailOutbox: (...args: unknown[]) =>
    dispatchDueEmailOutbox(...args),
}));

import {
  readNotificationOutboxWorkerConfig,
  startNotificationOutboxWorker,
  stopNotificationOutboxWorker,
} from "@/lib/wepacker/notification-outbox-worker";

const enabledEnv = {
  NOTIFICATION_OUTBOX_WORKER_ENABLED: "true",
  NOTIFICATION_OUTBOX_WORKER_INTERVAL_MS: "5000",
  NOTIFICATION_OUTBOX_WORKER_BATCH_SIZE: "10",
};

describe("Notification outbox worker", () => {
  beforeEach(() => {
    stopNotificationOutboxWorker();
    vi.useFakeTimers();
    vi.resetAllMocks();
    dispatchDueEmailOutbox.mockResolvedValue({ attempted: 0, sent: 0, failed: 0 });
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    stopNotificationOutboxWorker();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("is fail-closed by default", async () => {
    expect(startNotificationOutboxWorker({})).toEqual({
      started: false,
      reason: "disabled",
      config: { enabled: false, intervalMs: 60_000, batchSize: 25 },
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(dispatchDueEmailOutbox).not.toHaveBeenCalled();
  });

  it("bounds operator-provided interval and batch values", () => {
    expect(
      readNotificationOutboxWorkerConfig({
        NOTIFICATION_OUTBOX_WORKER_INTERVAL_MS: "1",
        NOTIFICATION_OUTBOX_WORKER_BATCH_SIZE: "999999999",
      }),
    ).toMatchObject({ intervalMs: 5_000, batchSize: 100 });
  });

  it("runs immediately and periodically with one timer per process", async () => {
    expect(startNotificationOutboxWorker(enabledEnv)).toMatchObject({
      started: true,
    });
    expect(dispatchDueEmailOutbox).toHaveBeenCalledWith(10);
    expect(startNotificationOutboxWorker(enabledEnv)).toMatchObject({
      started: false,
      reason: "already_running",
    });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(dispatchDueEmailOutbox).toHaveBeenCalledTimes(2);
  });

  it("scrubs delivery errors and recovers on the next interval", async () => {
    const error = Object.assign(
      new Error("recipient@example.test private content"),
      { responseCode: 550 },
    );
    dispatchDueEmailOutbox
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ attempted: 0, sent: 0, failed: 0 });

    startNotificationOutboxWorker(enabledEnv);
    await Promise.resolve();
    expect(console.error).toHaveBeenCalledWith(
      "[wepacker:notification-outbox-worker] cycle failed",
      { kind: "Error", smtpCode: 550 },
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "recipient@example.test",
    );
    await vi.advanceTimersByTimeAsync(5_000);
    expect(dispatchDueEmailOutbox).toHaveBeenCalledTimes(2);
  });
});
