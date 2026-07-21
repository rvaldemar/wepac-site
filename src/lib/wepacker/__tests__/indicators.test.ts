import { describe, it, expect } from "vitest";
import {
  AREA_KEYS,
  AREA_LABELS,
  getIndicators,
  hasDedicatedIndicators,
  type AreaKey,
} from "@/lib/wepacker/types";

describe("getIndicators", () => {
  it("artist pack covers all 6 areas", () => {
    const ind = getIndicators("artist");
    expect(Object.keys(ind).sort()).toEqual([...AREA_KEYS].sort());
    for (const area of AREA_KEYS) {
      expect(ind[area].length).toBeGreaterThan(0);
    }
  });

  it("unknown packs fall back to the default set with all 6 areas", () => {
    const ind = getIndicators("sport");
    expect(Object.keys(ind).sort()).toEqual([...AREA_KEYS].sort());
    for (const area of AREA_KEYS) {
      expect(ind[area].length).toBeGreaterThan(0);
    }
    expect(getIndicators("sport")).toEqual(getIndicators("anything-else"));
  });

  it("artist pack and default set differ (subject-driven)", () => {
    expect(getIndicators("artist")).not.toEqual(getIndicators("sport"));
  });

  it("every indicator key is unique within its area and labels are non-empty", () => {
    for (const pack of ["artist", "sport"] as const) {
      const ind = getIndicators(pack);
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

describe("hasDedicatedIndicators", () => {
  it("is true for the artist pack", () => {
    expect(hasDedicatedIndicators("artist")).toBe(true);
  });

  it("is false for packs that fall back to the default set", () => {
    expect(hasDedicatedIndicators("sport")).toBe(false);
    expect(hasDedicatedIndicators("anything-else")).toBe(false);
  });
});

describe("AREA_LABELS", () => {
  it("uses canonical English-first labels for the six universal Pillars", () => {
    expect(AREA_LABELS).toEqual({
      physical: "Physical",
      emotional: "Emotional",
      character: "Character",
      spiritual: "Spiritual",
      intellectual: "Intellectual",
      social: "Social",
    });
    expect(Object.keys(AREA_LABELS).sort()).toEqual([...AREA_KEYS].sort());
  });
});
