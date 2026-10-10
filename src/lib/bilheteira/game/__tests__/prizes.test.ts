import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIZE_WEIGHTS,
  PRIZE_KINDS,
  PRIZE_VALID_UNTIL,
  Q4_2026_START,
  WHEEL_SEGMENTS,
  parsePrizeWeights,
  pickPrize,
  prizeValidity,
  segmentIndexesFor,
} from "../prizes";

describe("pickPrize", () => {
  it("maps rng ranges to prizes in catalogue order", () => {
    // Weights 55/27/15/3 → cumulative 55, 82, 97, 100.
    expect(pickPrize(() => 0)).toBe("two_for_one_single_2026");
    expect(pickPrize(() => 0.549)).toBe("two_for_one_single_2026");
    expect(pickPrize(() => 0.55)).toBe("two_for_one_all_2026");
    expect(pickPrize(() => 0.819)).toBe("two_for_one_all_2026");
    expect(pickPrize(() => 0.82)).toBe("free_ticket_single_2026");
    expect(pickPrize(() => 0.969)).toBe("free_ticket_single_2026");
    expect(pickPrize(() => 0.97)).toBe("free_all_q4_2026");
    expect(pickPrize(() => 0.999999)).toBe("free_all_q4_2026");
  });

  it("never returns undefined for rng at the upper edge", () => {
    expect(PRIZE_KINDS).toContain(pickPrize(() => 1 - Number.EPSILON));
  });

  it("respects custom weights, including zero", () => {
    const weights = { ...DEFAULT_PRIZE_WEIGHTS, free_all_q4_2026: 0, two_for_one_single_2026: 0 };
    for (const r of [0, 0.3, 0.5, 0.99]) {
      expect(["two_for_one_all_2026", "free_ticket_single_2026"]).toContain(pickPrize(() => r, weights));
    }
  });

  it("converges to the configured distribution", () => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32;
      return seed / 2 ** 32;
    };
    const counts: Record<string, number> = {};
    const n = 50_000;
    for (let i = 0; i < n; i++) {
      const k = pickPrize(rng);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(counts.two_for_one_single_2026 / n).toBeCloseTo(0.55, 1);
    expect(counts.free_all_q4_2026 / n).toBeLessThan(0.05);
  });
});

describe("parsePrizeWeights", () => {
  it("falls back to defaults on malformed input", () => {
    expect(parsePrizeWeights(undefined)).toBe(DEFAULT_PRIZE_WEIGHTS);
    expect(parsePrizeWeights("1,2")).toBe(DEFAULT_PRIZE_WEIGHTS);
    expect(parsePrizeWeights("a,b,c,d")).toBe(DEFAULT_PRIZE_WEIGHTS);
    expect(parsePrizeWeights("0,0,0,0")).toBe(DEFAULT_PRIZE_WEIGHTS);
    expect(parsePrizeWeights("-1,1,1,1")).toBe(DEFAULT_PRIZE_WEIGHTS);
  });
  it("parses a valid override in catalogue order", () => {
    expect(parsePrizeWeights("70, 20, 9, 1")).toEqual({
      two_for_one_single_2026: 70,
      two_for_one_all_2026: 20,
      free_ticket_single_2026: 9,
      free_all_q4_2026: 1,
    });
  });
});

describe("prizeValidity", () => {
  it("every prize ends on 31 December 2026", () => {
    for (const kind of PRIZE_KINDS) {
      expect(prizeValidity(kind).validUntil).toEqual(PRIZE_VALID_UNTIL);
    }
  });
  it("Q4 prize starts at Q4 when issued earlier, otherwise now", () => {
    const early = new Date("2026-09-01T10:00:00Z");
    expect(prizeValidity("free_all_q4_2026", early).validFrom).toEqual(Q4_2026_START);
    const inQ4 = new Date("2026-10-10T10:00:00Z");
    expect(prizeValidity("free_all_q4_2026", inQ4).validFrom).toEqual(inQ4);
    expect(prizeValidity("two_for_one_single_2026", early).validFrom).toEqual(early);
  });
});

describe("wheel layout", () => {
  it("every prize kind has at least one segment", () => {
    for (const kind of PRIZE_KINDS) {
      const idx = segmentIndexesFor(kind);
      expect(idx.length).toBeGreaterThan(0);
      idx.forEach((i) => expect(WHEEL_SEGMENTS[i]).toBe(kind));
    }
  });
});
