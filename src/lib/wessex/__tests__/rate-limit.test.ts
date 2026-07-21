import { describe, expect, it } from "vitest";
import { VisitorRateLimiter, getVisitorIp } from "@/lib/wessex/rate-limit";

const T0 = Date.parse("2026-07-21T12:00:00.000Z");
const MINUTE = 60 * 1000;
const WINDOW_MS = 10 * MINUTE;
const DAY_MS = 24 * 60 * MINUTE;

describe("VisitorRateLimiter", () => {
  it("allows requests under the 10-per-10-minutes window", () => {
    const limiter = new VisitorRateLimiter();
    for (let i = 0; i < 10; i++) {
      expect(limiter.check("1.2.3.4", T0 + i * 1000)).toEqual({ allowed: true });
    }
  });

  it("blocks the 11th request within the same 10-minute window", () => {
    const limiter = new VisitorRateLimiter();
    for (let i = 0; i < 10; i++) {
      limiter.check("1.2.3.4", T0 + i * 1000);
    }
    const result = limiter.check("1.2.3.4", T0 + 10_000);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(WINDOW_MS / 1000);
    }
  });

  it("resets the burst window once 10 minutes have elapsed", () => {
    const limiter = new VisitorRateLimiter();
    for (let i = 0; i < 10; i++) {
      limiter.check("1.2.3.4", T0 + i * 1000);
    }
    expect(limiter.check("1.2.3.4", T0 + 10_000).allowed).toBe(false);

    // Just past the 10-minute window: burst count resets.
    const afterWindow = T0 + WINDOW_MS + 1;
    expect(limiter.check("1.2.3.4", afterWindow)).toEqual({ allowed: true });
  });

  it("tracks distinct IPs independently", () => {
    const limiter = new VisitorRateLimiter();
    for (let i = 0; i < 10; i++) {
      limiter.check("1.2.3.4", T0 + i * 1000);
    }
    expect(limiter.check("1.2.3.4", T0 + 10_000).allowed).toBe(false);
    // A different IP has its own fresh bucket.
    expect(limiter.check("5.6.7.8", T0 + 10_000)).toEqual({ allowed: true });
  });

  it("enforces the 30-per-day cap even across multiple 10-minute windows", () => {
    const limiter = new VisitorRateLimiter();
    let now = T0;
    let allowedCount = 0;
    let blockedAt: number | null = null;

    // 3 windows of 10 requests each, spaced just past each burst window,
    // should hit the daily cap of 30 exactly at the 31st request.
    for (let windowIdx = 0; windowIdx < 4; windowIdx++) {
      for (let i = 0; i < 10; i++) {
        const result = limiter.check("9.9.9.9", now + i * 1000);
        if (result.allowed) {
          allowedCount++;
        } else if (blockedAt === null) {
          blockedAt = allowedCount;
        }
      }
      now += WINDOW_MS + 1;
    }

    expect(allowedCount).toBe(30);
    expect(blockedAt).toBe(30);
  });

  it("resets the daily cap once 24 hours have elapsed", () => {
    const limiter = new VisitorRateLimiter();
    let now = T0;
    // Exhaust the daily cap across enough burst windows.
    for (let windowIdx = 0; windowIdx < 3; windowIdx++) {
      for (let i = 0; i < 10; i++) {
        limiter.check("2.2.2.2", now + i * 1000);
      }
      now += WINDOW_MS + 1;
    }
    expect(limiter.check("2.2.2.2", now).allowed).toBe(false);

    const nextDay = T0 + DAY_MS + 1;
    expect(limiter.check("2.2.2.2", nextDay)).toEqual({ allowed: true });
  });

  it("cleans up entries that have been idle for more than a day", () => {
    const limiter = new VisitorRateLimiter();
    limiter.check("1.1.1.1", T0);
    expect(limiter.size()).toBe(1);

    // Cleanup is swept lazily on `check` calls, at most once per hour of
    // elapsed time, and only drops entries idle for 24h+. A second IP's
    // check() more than a day later triggers the sweep and should drop
    // the stale first entry.
    limiter.check("2.2.2.2", T0 + DAY_MS + MINUTE);
    expect(limiter.size()).toBe(1); // stale entry dropped, only the new one remains
  });
});

describe("getVisitorIp", () => {
  it("uses the first entry of x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2" },
    });
    expect(getVisitorIp(req)).toBe("203.0.113.5");
  });

  it("trims whitespace around the first entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  203.0.113.5  , 10.0.0.1" },
    });
    expect(getVisitorIp(req)).toBe("203.0.113.5");
  });

  it("falls back to a shared bucket key when the header is absent", () => {
    const req = new Request("https://example.com");
    expect(getVisitorIp(req)).toBe("unknown");
  });
});
