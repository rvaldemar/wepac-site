import type { PrizeKind } from "@prisma/client";

/**
 * Prize catalogue for the kiosk game. All prizes are valid until the end of
 * 2026 (Europe/Lisbon). The campaign key namespaces participants so a future
 * edition can run with the same emails.
 */
export const GAME_CAMPAIGN = "capela-2026-q4";

/** Bump when the T&C / privacy text shown at the kiosk changes. */
export const GAME_CONSENT_VERSION = "2026-10-v1";

export const PRIZE_KINDS: readonly PrizeKind[] = [
  "two_for_one_single_2026",
  "two_for_one_all_2026",
  "free_ticket_single_2026",
  "free_all_q4_2026",
] as const;

/**
 * Default draw weights (percent-like, any positive numbers). Cheapest prize
 * is the most common; the "all Q4 free" prize is deliberately rare. Override
 * at runtime with GAME_PRIZE_WEIGHTS="55,27,15,3" (same order as PRIZE_KINDS).
 */
export const DEFAULT_PRIZE_WEIGHTS: Record<PrizeKind, number> = {
  two_for_one_single_2026: 55,
  two_for_one_all_2026: 27,
  free_ticket_single_2026: 15,
  free_all_q4_2026: 3,
};

// 2026-12-31 23:59:59 Europe/Lisbon (UTC+0 in winter).
export const PRIZE_VALID_UNTIL = new Date("2026-12-31T23:59:59.000Z");
// Q4 starts 2026-10-01 00:00 Europe/Lisbon (UTC+1 in summer time).
export const Q4_2026_START = new Date("2026-09-30T23:00:00.000Z");

export function parsePrizeWeights(
  raw: string | undefined,
): Record<PrizeKind, number> {
  if (!raw) return DEFAULT_PRIZE_WEIGHTS;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (
    parts.length !== PRIZE_KINDS.length ||
    parts.some((n) => !Number.isFinite(n) || n < 0) ||
    parts.every((n) => n === 0)
  ) {
    return DEFAULT_PRIZE_WEIGHTS;
  }
  return Object.fromEntries(
    PRIZE_KINDS.map((kind, i) => [kind, parts[i]]),
  ) as Record<PrizeKind, number>;
}

/**
 * Weighted draw. `rng` must return a float in [0, 1). Injected so tests are
 * deterministic; production passes a crypto-backed source.
 */
export function pickPrize(
  rng: () => number,
  weights: Record<PrizeKind, number> = DEFAULT_PRIZE_WEIGHTS,
): PrizeKind {
  const total = PRIZE_KINDS.reduce((sum, k) => sum + weights[k], 0);
  if (total <= 0) return PRIZE_KINDS[0];
  let cursor = rng() * total;
  for (const kind of PRIZE_KINDS) {
    cursor -= weights[kind];
    if (cursor < 0) return kind;
  }
  // Floating point edge: rng() returned a value extremely close to 1.
  return PRIZE_KINDS[PRIZE_KINDS.length - 1];
}

export function prizeValidity(kind: PrizeKind, now: Date = new Date()) {
  const validFrom =
    kind === "free_all_q4_2026" && now < Q4_2026_START ? Q4_2026_START : now;
  return { validFrom, validUntil: PRIZE_VALID_UNTIL };
}

/**
 * Wheel layout shared by client (animation) and server (nothing — the server
 * only decides the prize). 8 segments; common prizes repeat so the wheel
 * visually matches the odds without revealing exact weights.
 */
export const WHEEL_SEGMENTS: readonly PrizeKind[] = [
  "two_for_one_single_2026",
  "two_for_one_all_2026",
  "two_for_one_single_2026",
  "free_ticket_single_2026",
  "two_for_one_single_2026",
  "two_for_one_all_2026",
  "free_all_q4_2026",
  "free_ticket_single_2026",
] as const;

export function segmentIndexesFor(kind: PrizeKind): number[] {
  return WHEEL_SEGMENTS.flatMap((k, i) => (k === kind ? [i] : []));
}
