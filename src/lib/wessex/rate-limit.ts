import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logSafeError } from "@/lib/wepacker/log-safe-error";

// The in-memory implementation remains available to existing auth and public
// form boundaries. The Wessex chat singleton at the bottom of this file uses
// PostgreSQL so its cost guard survives restarts and coordinates deployments.

// Fixed-window limiter, two windows per visitor: a short burst window and
// a daily cap. Sensible defaults for an informational public chat — not
// meant to survive a determined attacker, just to blunt casual abuse
// and runaway costs.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 10; // 10 requests / 10 minutes / IP
const DAY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_PER_DAY = 30; // 30 requests / day / IP

// How often (in real elapsed time between calls) to sweep the Map for
// entries nobody has touched in a full day — otherwise the Map grows
// without bound for as long as the process lives, one entry per distinct
// IP ever seen.
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const STALE_AFTER_MS = DAY_MS;

interface VisitorUsage {
  windowStart: number;
  windowCount: number;
  dayStart: number;
  dayCount: number;
  lastSeen: number;
}

export type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      reason?: "limit" | "unavailable";
    };

export class VisitorRateLimiter {
  private readonly usageByIp = new Map<string, VisitorUsage>();
  private lastCleanupAt = 0;

  // `now` is injectable for deterministic tests; defaults to the real
  // clock in production use.
  check(ip: string, now: number = Date.now()): RateLimitResult {
    this.cleanupStale(now);

    let usage = this.usageByIp.get(ip);
    if (!usage) {
      usage = {
        windowStart: now,
        windowCount: 0,
        dayStart: now,
        dayCount: 0,
        lastSeen: now,
      };
      this.usageByIp.set(ip, usage);
    }

    if (now - usage.windowStart >= WINDOW_MS) {
      usage.windowStart = now;
      usage.windowCount = 0;
    }
    if (now - usage.dayStart >= DAY_MS) {
      usage.dayStart = now;
      usage.dayCount = 0;
    }

    usage.lastSeen = now;

    if (usage.dayCount >= MAX_PER_DAY) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((usage.dayStart + DAY_MS - now) / 1000),
      };
    }
    if (usage.windowCount >= MAX_PER_WINDOW) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(
          (usage.windowStart + WINDOW_MS - now) / 1000
        ),
      };
    }

    usage.windowCount += 1;
    usage.dayCount += 1;
    return { allowed: true };
  }

  private cleanupStale(now: number): void {
    if (now - this.lastCleanupAt < CLEANUP_INTERVAL_MS) return;
    this.lastCleanupAt = now;
    for (const [ip, usage] of this.usageByIp) {
      if (now - usage.lastSeen > STALE_AFTER_MS) {
        this.usageByIp.delete(ip);
      }
    }
  }

  // Test-only escape hatch: size of the underlying Map, to assert
  // cleanup actually drops stale entries without exposing internals.
  size(): number {
    return this.usageByIp.size;
  }
}

export type WessexRateLimitConfig = {
  windowMs: number;
  windowMax: number;
  dayMs: number;
  dayMax: number;
};

const DEFAULT_WESSEX_RATE_LIMIT_CONFIG: WessexRateLimitConfig = {
  windowMs: WINDOW_MS,
  windowMax: MAX_PER_WINDOW,
  dayMs: DAY_MS,
  dayMax: MAX_PER_DAY,
};

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getWessexRateLimitConfig(
  env: Partial<Record<string, string | undefined>> = process.env,
): WessexRateLimitConfig {
  return {
    windowMs:
      positiveInteger(env.WESSEX_RATE_LIMIT_WINDOW_SECONDS, WINDOW_MS / 1000) *
      1000,
    windowMax: positiveInteger(
      env.WESSEX_RATE_LIMIT_WINDOW_MAX,
      MAX_PER_WINDOW,
    ),
    dayMs:
      positiveInteger(env.WESSEX_RATE_LIMIT_DAY_SECONDS, DAY_MS / 1000) * 1000,
    dayMax: positiveInteger(env.WESSEX_RATE_LIMIT_DAY_MAX, MAX_PER_DAY),
  };
}

type StoredUsage = {
  windowStartedAt: Date;
  windowCount: number;
  dayStartedAt: Date;
  dayCount: number;
};

export type WessexRateLimitStore = {
  consume: (
    keyHash: string,
    now: Date,
    config: WessexRateLimitConfig,
  ) => Promise<StoredUsage>;
  cleanup: (now: Date, batchSize: number) => Promise<void>;
};

export class PostgresWessexRateLimitStore implements WessexRateLimitStore {
  async consume(
    keyHash: string,
    now: Date,
    config: WessexRateLimitConfig,
  ): Promise<StoredUsage> {
    const rows = await prisma.$queryRaw<StoredUsage[]>(Prisma.sql`
      INSERT INTO "wessex_rate_limit_buckets" (
        "keyHash", "windowStartedAt", "windowCount", "dayStartedAt",
        "dayCount", "expiresAt", "updatedAt"
      ) VALUES (
        ${keyHash}, ${now}, 1, ${now}, 1,
        GREATEST(
          ${now} + (${config.windowMs} * interval '1 millisecond'),
          ${now} + (${config.dayMs} * interval '1 millisecond')
        ),
        ${now}
      )
      ON CONFLICT ("keyHash") DO UPDATE SET
        "windowStartedAt" = CASE
          WHEN "wessex_rate_limit_buckets"."windowStartedAt"
            + (${config.windowMs} * interval '1 millisecond') <= ${now}
          THEN ${now}
          ELSE "wessex_rate_limit_buckets"."windowStartedAt"
        END,
        "windowCount" = CASE
          WHEN "wessex_rate_limit_buckets"."dayStartedAt"
            + (${config.dayMs} * interval '1 millisecond') > ${now}
            AND "wessex_rate_limit_buckets"."dayCount" >= ${config.dayMax}
          THEN CASE
            WHEN "wessex_rate_limit_buckets"."windowStartedAt"
              + (${config.windowMs} * interval '1 millisecond') <= ${now}
            THEN 0
            WHEN "wessex_rate_limit_buckets"."windowCount" >= ${config.windowMax}
            THEN "wessex_rate_limit_buckets"."windowCount" + 1
            ELSE "wessex_rate_limit_buckets"."windowCount"
          END
          ELSE CASE
            WHEN "wessex_rate_limit_buckets"."windowStartedAt"
              + (${config.windowMs} * interval '1 millisecond') <= ${now}
            THEN 1
            ELSE "wessex_rate_limit_buckets"."windowCount" + 1
          END
        END,
        "dayStartedAt" = CASE
          WHEN "wessex_rate_limit_buckets"."dayStartedAt"
            + (${config.dayMs} * interval '1 millisecond') <= ${now}
          THEN ${now}
          ELSE "wessex_rate_limit_buckets"."dayStartedAt"
        END,
        "dayCount" = CASE
          WHEN "wessex_rate_limit_buckets"."windowStartedAt"
            + (${config.windowMs} * interval '1 millisecond') > ${now}
            AND "wessex_rate_limit_buckets"."windowCount" >= ${config.windowMax}
          THEN CASE
            WHEN "wessex_rate_limit_buckets"."dayStartedAt"
              + (${config.dayMs} * interval '1 millisecond') <= ${now}
            THEN 0
            ELSE "wessex_rate_limit_buckets"."dayCount"
          END
          ELSE CASE
            WHEN "wessex_rate_limit_buckets"."dayStartedAt"
              + (${config.dayMs} * interval '1 millisecond') <= ${now}
            THEN 1
            ELSE "wessex_rate_limit_buckets"."dayCount" + 1
          END
        END,
        "expiresAt" = GREATEST(
          CASE
            WHEN "wessex_rate_limit_buckets"."windowStartedAt"
              + (${config.windowMs} * interval '1 millisecond') <= ${now}
            THEN ${now} + (${config.windowMs} * interval '1 millisecond')
            ELSE "wessex_rate_limit_buckets"."windowStartedAt"
              + (${config.windowMs} * interval '1 millisecond')
          END,
          CASE
            WHEN "wessex_rate_limit_buckets"."dayStartedAt"
              + (${config.dayMs} * interval '1 millisecond') <= ${now}
            THEN ${now} + (${config.dayMs} * interval '1 millisecond')
            ELSE "wessex_rate_limit_buckets"."dayStartedAt"
              + (${config.dayMs} * interval '1 millisecond')
          END
        ),
        "updatedAt" = ${now}
      RETURNING "windowStartedAt", "windowCount", "dayStartedAt", "dayCount"
    `);
    if (!rows[0]) throw new Error("Rate-limit bucket upsert returned no row");
    return rows[0];
  }

  async cleanup(now: Date, batchSize: number): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "wessex_rate_limit_buckets"
      WHERE "keyHash" IN (
        SELECT "keyHash"
        FROM "wessex_rate_limit_buckets"
        WHERE "expiresAt" <= ${now}
        ORDER BY "expiresAt"
        LIMIT ${batchSize}
      )
    `);
  }
}

type PersistentLimiterOptions = {
  config?: WessexRateLimitConfig;
  store?: WessexRateLimitStore;
  hashSecret?: () => string | undefined;
  cleanupEvery?: number;
  cleanupBatchSize?: number;
};

const FAILURE_RETRY_SECONDS = 60;

export class PersistentWessexRateLimiter {
  private readonly config: WessexRateLimitConfig;
  private readonly store: WessexRateLimitStore;
  private readonly hashSecret: () => string | undefined;
  private readonly cleanupEvery: number;
  private readonly cleanupBatchSize: number;
  private checksSinceCleanup = 0;

  constructor(options: PersistentLimiterOptions = {}) {
    this.config = options.config ?? DEFAULT_WESSEX_RATE_LIMIT_CONFIG;
    this.store = options.store ?? new PostgresWessexRateLimitStore();
    this.hashSecret =
      options.hashSecret ??
      (() =>
        process.env.WESSEX_RATE_LIMIT_HASH_SECRET ||
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET);
    this.cleanupEvery = options.cleanupEvery ?? 100;
    this.cleanupBatchSize = options.cleanupBatchSize ?? 100;
  }

  async check(
    visitorKey: string,
    nowMs: number = Date.now(),
  ): Promise<RateLimitResult> {
    try {
      const secret = this.hashSecret();
      if (!secret) {
        throw new Error("Wessex rate-limit hash secret is not configured");
      }

      const keyHash = createHmac("sha256", secret)
        .update(`wessex-chat:${visitorKey}`)
        .digest("hex");
      const now = new Date(nowMs);
      const usage = await this.store.consume(keyHash, now, this.config);

      this.checksSinceCleanup += 1;
      if (this.checksSinceCleanup >= this.cleanupEvery) {
        this.checksSinceCleanup = 0;
        await this.store.cleanup(now, this.cleanupBatchSize);
      }

      const retryAt: number[] = [];
      if (usage.windowCount > this.config.windowMax) {
        retryAt.push(usage.windowStartedAt.getTime() + this.config.windowMs);
      }
      if (usage.dayCount > this.config.dayMax) {
        retryAt.push(usage.dayStartedAt.getTime() + this.config.dayMs);
      }
      if (retryAt.length === 0) return { allowed: true };

      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((Math.max(...retryAt) - nowMs) / 1000),
        ),
        reason: "limit",
      };
    } catch (error) {
      console.error(
        "[wessex rate limit] fail_closed",
        logSafeError(error),
      );
      return {
        allowed: false,
        retryAfterSeconds: FAILURE_RETRY_SECONDS,
        reason: "unavailable",
      };
    }
  }
}

export const visitorRateLimiter = new PersistentWessexRateLimiter({
  config: getWessexRateLimitConfig(),
});

// Our own nginx (deploy/nginx.conf) sets two headers: X-Real-IP is the
// actual TCP peer address ($remote_addr — non-spoofable), while
// X-Forwarded-For APPENDS the peer to whatever chain the client sent, so
// its FIRST entry is attacker-controlled and must never key a limiter.
// Prefer X-Real-IP; fall back to the RIGHTMOST forwarded-for entry (the
// one our trusted proxy appended). Absent both (direct connections in
// local dev), a shared "unknown" bucket is acceptable for a low-traffic
// informational chat.
export function getVisitorIpFromHeaders(
  headers: Pick<Headers, "get">,
): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  return "unknown";
}

export function getVisitorIp(req: Request): string {
  return getVisitorIpFromHeaders(req.headers);
}
