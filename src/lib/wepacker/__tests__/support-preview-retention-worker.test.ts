import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const applySupportPreviewRetention = vi.fn();

vi.mock("@/lib/wepacker/support-preview-retention", () => ({
  applySupportPreviewRetention: () => applySupportPreviewRetention(),
}));

import {
  readSupportPreviewRetentionWorkerConfig,
  startSupportPreviewRetentionWorker,
  stopSupportPreviewRetentionWorker,
} from "@/lib/wepacker/support-preview-retention-worker";

const enabledEnv = {
  SUPPORT_PREVIEW_RETENTION_WORKER_ENABLED: "true",
  SUPPORT_PREVIEW_RETENTION_WORKER_INTERVAL_MS: String(60 * 60 * 1000),
};

describe("Support Preview retention worker", () => {
  beforeEach(() => {
    stopSupportPreviewRetentionWorker();
    vi.useFakeTimers();
    vi.clearAllMocks();
    applySupportPreviewRetention.mockResolvedValue({
      deletedAuditEvents: 0,
      detachedGrantReferences: 0,
      deletedGrants: 0,
      redactedTicketReferences: 0,
    });
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    stopSupportPreviewRetentionWorker();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("is disabled by default and bounds its interval", async () => {
    expect(startSupportPreviewRetentionWorker({})).toEqual({
      started: false,
      reason: "disabled",
      config: { enabled: false, intervalMs: 24 * 60 * 60 * 1000 },
    });
    expect(
      readSupportPreviewRetentionWorkerConfig({
        SUPPORT_PREVIEW_RETENTION_WORKER_INTERVAL_MS: "1",
      }),
    ).toMatchObject({ intervalMs: 60 * 60 * 1000 });
    expect(
      readSupportPreviewRetentionWorkerConfig({
        SUPPORT_PREVIEW_RETENTION_WORKER_INTERVAL_MS: "9999999999",
      }),
    ).toMatchObject({ intervalMs: 7 * 24 * 60 * 60 * 1000 });
    await vi.advanceTimersByTimeAsync(7 * 24 * 60 * 60 * 1000);
    expect(applySupportPreviewRetention).not.toHaveBeenCalled();
  });

  it("runs immediately, periodically and never creates a second worker", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    expect(startSupportPreviewRetentionWorker(enabledEnv)).toMatchObject({
      started: true,
    });
    expect(applySupportPreviewRetention).toHaveBeenCalledTimes(1);
    const timer = setIntervalSpy.mock.results[0]?.value as NodeJS.Timeout;
    expect(timer.hasRef()).toBe(false);
    expect(startSupportPreviewRetentionWorker(enabledEnv)).toMatchObject({
      started: false,
      reason: "already_running",
    });
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(applySupportPreviewRetention).toHaveBeenCalledTimes(2);
  });

  it("logs only counts or error kind and recovers", async () => {
    applySupportPreviewRetention
      .mockRejectedValueOnce(
        new Error("ticket SUP-SECRET for person@example.test"),
      )
      .mockResolvedValue({
        deletedAuditEvents: 1,
        detachedGrantReferences: 0,
        deletedGrants: 0,
        redactedTicketReferences: 2,
      });

    startSupportPreviewRetentionWorker(enabledEnv);
    await Promise.resolve();
    expect(console.error).toHaveBeenCalledWith(
      "[wepacker:support-preview-retention] cycle failed",
      { kind: "Error" },
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "person@example.test",
    );
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(console.info).toHaveBeenCalledWith(
      "[wepacker:support-preview-retention] cycle complete",
      {
        deletedAuditEvents: 1,
        detachedGrantReferences: 0,
        deletedGrants: 0,
        redactedTicketReferences: 2,
      },
    );
  });
});
