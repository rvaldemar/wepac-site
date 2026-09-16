import { describe, expect, it, vi } from "vitest";
import {
  buildWessexOperationalAlertEmail,
  WessexOperationalAlerter,
  type WessexOperationalAlertCode,
  type WessexOperationalAlertStore,
} from "@/lib/wessex/operational-alert";

interface MemoryRow {
  id: string;
  code: WessexOperationalAlertCode;
  attempts: number;
  windowStartedAt: Date;
  status: "pending" | "sending" | "failed" | "sent";
  nextAttemptAt: Date;
  deliveryStartedAt: Date | null;
}

function memoryStore(): WessexOperationalAlertStore & { rows: Map<string, MemoryRow> } {
  const rows = new Map<string, MemoryRow>();
  return {
    rows,
    async enqueue(code, windowStartedAt) {
      const key = code;
      let row = rows.get(key);
      if (
        row &&
        row.windowStartedAt.getTime() + 6 * 60 * 60_000 <= windowStartedAt.getTime() &&
        ["sent", "sending"].includes(row.status)
      ) {
        row.status = "pending";
        row.attempts = 0;
        row.nextAttemptAt = windowStartedAt;
        row.windowStartedAt = windowStartedAt;
      }
      if (!row) {
        row = {
          id: key,
          code,
          attempts: 0,
          windowStartedAt,
          status: "pending",
          nextAttemptAt: windowStartedAt,
          deliveryStartedAt: null,
        };
        rows.set(key, row);
      }
      return row;
    },
    async claim(id, now) {
      const row = rows.get(id);
      if (
        !row ||
        !["pending", "failed"].includes(row.status) ||
        row.attempts >= 4 ||
        row.nextAttemptAt > now
      ) {
        return null;
      }
      row.status = "sending";
      row.attempts += 1;
      row.deliveryStartedAt = now;
      return row;
    },
    async markSent(id, deliveryStartedAt) {
      const row = rows.get(id);
      if (row?.deliveryStartedAt === deliveryStartedAt) row.status = "sent";
    },
    async markFailed(id, deliveryStartedAt, nextAttemptAt) {
      const row = rows.get(id);
      if (row?.deliveryStartedAt === deliveryStartedAt) {
        row.status = "failed";
        row.nextAttemptAt = nextAttemptAt;
      }
    },
    async due(now, limit) {
      return [...rows.values()]
        .filter(
          (row) =>
            ["pending", "failed"].includes(row.status) &&
            row.attempts < 4 &&
            row.nextAttemptAt <= now,
        )
        .slice(0, limit)
        .map((row) => row.id);
    },
  };
}

describe("WessexOperationalAlerter", () => {
  it("deduplicates concurrent failures into one delivery per code/window", async () => {
    const store = memoryStore();
    const send = vi.fn().mockResolvedValue(undefined);
    const alerter = new WessexOperationalAlerter(
      store,
      send,
      () => "ops@example.test",
      () => new Date("2026-08-25T13:00:00.000Z"),
    );

    await Promise.all(
      Array.from({ length: 30 }, () => alerter.record("upstream_unavailable")),
    );
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());

    expect(store.rows).toHaveLength(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ops@example.test",
        subject: expect.stringContaining("upstream_unavailable"),
      }),
    );

    const fiveHoursLater = new WessexOperationalAlerter(
      store,
      send,
      () => "ops@example.test",
      () => new Date("2026-08-25T18:59:59.000Z"),
    );
    await fiveHoursLater.record("upstream_unavailable");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).toHaveBeenCalledOnce();
  });

  it("retries a confirmed SMTP failure after a bounded delay", async () => {
    const store = memoryStore();
    let now = new Date("2026-08-25T13:00:00.000Z");
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("address and secret must not be logged"))
      .mockResolvedValueOnce(undefined);
    const alerter = new WessexOperationalAlerter(
      store,
      send,
      () => "ops@example.test",
      () => now,
    );

    await alerter.record("stream_failed");
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await alerter.dispatchDue();
    expect(send).toHaveBeenCalledTimes(1);

    now = new Date(now.getTime() + 5 * 60_000);
    await alerter.dispatchDue();
    expect(send).toHaveBeenCalledTimes(2);
    expect([...store.rows.values()][0]?.status).toBe("sent");
  });

  it("renders a content-free email with no visitor or diagnostic fields", () => {
    const message = buildWessexOperationalAlertEmail("upstream_auth");
    const serialized = JSON.stringify(message).toLowerCase();

    expect(message).toEqual({
      subject: "[WEPAC] Wessex chat operational alert: upstream_auth",
      text: expect.stringContaining("Code: upstream_auth"),
    });
    for (const forbidden of ["prompt", "ip address", "api key", "stack", "visitor", "email address"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
