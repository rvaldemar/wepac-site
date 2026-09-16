import { describe, expect, it, vi } from "vitest";
import {
  getWessexRateLimitConfig,
  PersistentWessexRateLimiter,
  type WessexRateLimitConfig,
  type WessexRateLimitStore,
} from "@/lib/wessex/rate-limit";

const T0 = Date.parse("2026-08-25T12:00:00.000Z");
const config: WessexRateLimitConfig = {
  windowMs: 10 * 60 * 1000,
  windowMax: 10,
  dayMs: 24 * 60 * 60 * 1000,
  dayMax: 30,
};

function atomicMemoryStore(): WessexRateLimitStore {
  const buckets = new Map<
    string,
    { windowStartedAt: Date; windowCount: number; dayStartedAt: Date; dayCount: number }
  >();
  let queue = Promise.resolve();

  return {
    consume(key, now, limits) {
      const operation = queue.then(() => {
        const prior = buckets.get(key);
        const usage = prior ?? {
          windowStartedAt: now,
          windowCount: 0,
          dayStartedAt: now,
          dayCount: 0,
        };
        if (usage.windowStartedAt.getTime() + limits.windowMs <= now.getTime()) {
          usage.windowStartedAt = now;
          usage.windowCount = 0;
        }
        if (usage.dayStartedAt.getTime() + limits.dayMs <= now.getTime()) {
          usage.dayStartedAt = now;
          usage.dayCount = 0;
        }
        const windowBlocked = usage.windowCount >= limits.windowMax;
        const dayBlocked = usage.dayCount >= limits.dayMax;
        if (!dayBlocked || windowBlocked) usage.windowCount += 1;
        if (!windowBlocked) usage.dayCount += 1;
        buckets.set(key, usage);
        return { ...usage };
      });
      queue = operation.then(() => undefined);
      return operation;
    },
    cleanup: vi.fn().mockResolvedValue(undefined),
  };
}

describe("PersistentWessexRateLimiter", () => {
  it("admits exactly the configured number under concurrent checks", async () => {
    const limiter = new PersistentWessexRateLimiter({
      config,
      store: atomicMemoryStore(),
      hashSecret: () => "unit-test-secret",
    });

    const results = await Promise.all(
      Array.from({ length: 25 }, () => limiter.check("198.51.100.8", T0)),
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(10);
    expect(results.filter((result) => !result.allowed)).toHaveLength(15);
  });

  it("resets exactly at each boundary and enforces the daily cap", async () => {
    const limiter = new PersistentWessexRateLimiter({
      config: { windowMs: 1000, windowMax: 2, dayMs: 5000, dayMax: 3 },
      store: atomicMemoryStore(),
      hashSecret: () => "unit-test-secret",
    });

    expect(await limiter.check("visitor", T0)).toEqual({ allowed: true });
    expect(await limiter.check("visitor", T0)).toEqual({ allowed: true });
    expect((await limiter.check("visitor", T0)).allowed).toBe(false);
    expect(await limiter.check("visitor", T0 + 1000)).toEqual({ allowed: true });
    expect((await limiter.check("visitor", T0 + 1001)).allowed).toBe(false);
    expect(await limiter.check("visitor", T0 + 5000)).toEqual({ allowed: true });
  });

  it("rejects when both windows reach their exact limit together", async () => {
    const limiter = new PersistentWessexRateLimiter({
      config: { windowMs: 5000, windowMax: 2, dayMs: 5000, dayMax: 2 },
      store: atomicMemoryStore(),
      hashSecret: () => "unit-test-secret",
    });

    expect((await limiter.check("visitor", T0)).allowed).toBe(true);
    expect((await limiter.check("visitor", T0)).allowed).toBe(true);
    expect((await limiter.check("visitor", T0)).allowed).toBe(false);
  });

  it("hashes visitor keys and runs bounded opportunistic cleanup", async () => {
    const store = atomicMemoryStore();
    const consume = vi.spyOn(store, "consume");
    const limiter = new PersistentWessexRateLimiter({
      config,
      store,
      hashSecret: () => "unit-test-secret",
      cleanupEvery: 2,
      cleanupBatchSize: 7,
    });

    await limiter.check("203.0.113.4", T0);
    await limiter.check("203.0.113.4", T0 + 1);

    expect(consume.mock.calls[0]?.[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(consume.mock.calls[0]?.[0]).not.toContain("203.0.113.4");
    expect(store.cleanup).toHaveBeenCalledWith(new Date(T0 + 1), 7);
  });

  it("fails closed when persistence is unavailable", async () => {
    const store: WessexRateLimitStore = {
      consume: vi.fn().mockRejectedValue(new Error("database unavailable")),
      cleanup: vi.fn(),
    };
    const limiter = new PersistentWessexRateLimiter({
      config,
      store,
      hashSecret: () => "unit-test-secret",
    });

    await expect(limiter.check("visitor", T0)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
      reason: "unavailable",
    });
  });
});

describe("getWessexRateLimitConfig", () => {
  it("keeps current defaults", () => {
    expect(getWessexRateLimitConfig({})).toEqual(config);
  });

  it("accepts positive integer env overrides and rejects unsafe values", () => {
    expect(
      getWessexRateLimitConfig({
        WESSEX_RATE_LIMIT_WINDOW_SECONDS: "30",
        WESSEX_RATE_LIMIT_WINDOW_MAX: "4",
        WESSEX_RATE_LIMIT_DAY_SECONDS: "invalid",
        WESSEX_RATE_LIMIT_DAY_MAX: "0",
      }),
    ).toEqual({ windowMs: 30_000, windowMax: 4, dayMs: config.dayMs, dayMax: 30 });
  });
});
