// Per-visitor rate limiting for the public Wessex chat endpoint
// (src/app/api/wessex/chat/route.ts). Applies identically to whichever
// ChatEngine is selected (direct or hub) — it guards the endpoint itself,
// not a specific upstream provider.
//
// In-memory only: acceptable for the current single-instance systemd
// deployment (see CLAUDE.md "Deploy"). Limitations, accepted for this
// scope:
// - Resets on process restart/deploy.
// - Does NOT coordinate across multiple instances/processes — if this
//   service is ever horizontally scaled, this needs a shared store
//   (Redis, DB) instead.
// - IP-based only; a visitor behind a shared/rotating IP (CGNAT, corporate
//   proxy) shares a bucket with others behind the same IP.

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
  | { allowed: false; retryAfterSeconds: number };

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

// Module-level singleton — the route handler shares one limiter across
// requests for the lifetime of the process, as required for the counters
// to mean anything.
export const visitorRateLimiter = new VisitorRateLimiter();

// x-forwarded-for can be a comma-separated chain (client, proxy1, proxy2,
// ...); the first entry is the original client as set by the nearest
// trusted proxy in front of this app. Falls back to a shared "unknown"
// bucket when the header is absent (e.g. direct connections in local dev)
// — acceptable for a low-traffic informational chat.
export function getVisitorIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
