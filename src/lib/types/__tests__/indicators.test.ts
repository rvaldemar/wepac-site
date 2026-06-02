import { describe, it, expect } from "vitest";
import { AREA_KEYS, getIndicators, type AreaKey } from "@/lib/types/artist";

describe("getIndicators", () => {
  it("artist track covers all 7 pillars and includes artistic indicators", () => {
    const ind = getIndicators("artist");
    expect(Object.keys(ind).sort()).toEqual([...AREA_KEYS].sort());
    expect(ind.artistic.length).toBeGreaterThan(0);
    for (const area of AREA_KEYS) {
      expect(ind[area].length).toBeGreaterThan(0);
    }
  });

  it("adult track covers all 7 pillars with non-empty indicators", () => {
    const ind = getIndicators("adult");
    expect(Object.keys(ind).sort()).toEqual([...AREA_KEYS].sort());
    for (const area of AREA_KEYS) {
      expect(ind[area].length).toBeGreaterThan(0);
    }
  });

  it("clinic track deep-equals adult track (P2 placeholder)", () => {
    expect(getIndicators("clinic")).toEqual(getIndicators("adult"));
  });

  it("artist and adult tracks differ (subject-driven)", () => {
    expect(getIndicators("artist")).not.toEqual(getIndicators("adult"));
  });

  it("every indicator key is unique within its area and labels are non-empty", () => {
    for (const track of ["artist", "adult", "clinic"] as const) {
      const ind = getIndicators(track);
      for (const area of AREA_KEYS as readonly AreaKey[]) {
        const keys = ind[area].map((i) => i.key);
        expect(new Set(keys).size).toBe(keys.length);
        for (const i of ind[area]) {
          expect(i.label.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
