import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const startNotificationOutboxWorker = vi.fn();

vi.mock("@/lib/wepacker/notification-outbox-worker", () => ({
  startNotificationOutboxWorker: (...args: unknown[]) =>
    startNotificationOutboxWorker(...args),
}));

import { register } from "@/instrumentation";

describe("Notification outbox instrumentation", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("starts only when explicitly enabled in a Node server runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    vi.stubEnv("NOTIFICATION_OUTBOX_WORKER_ENABLED", "true");
    await register();
    expect(startNotificationOutboxWorker).toHaveBeenCalledOnce();
  });

  it("does not start while disabled, on Edge, or during a build", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NOTIFICATION_OUTBOX_WORKER_ENABLED", "false");
    await register();

    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("NOTIFICATION_OUTBOX_WORKER_ENABLED", "true");
    await register();

    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    await register();
    expect(startNotificationOutboxWorker).not.toHaveBeenCalled();
  });
});
