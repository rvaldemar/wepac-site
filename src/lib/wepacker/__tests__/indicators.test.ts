import { describe, it, expect } from "vitest";
import { AREA_KEYS, getAreaLabels, getIndicators, type AreaKey } from "@/lib/wepacker/types";

describe("getIndicators", () => {
  it("artist pack covers all 7 areas and includes domain indicators", () => {
    const ind = getIndicators("artist");
    expect(Object.keys(ind).sort()).toEqual([...AREA_KEYS].sort());
    expect(ind.domain.length).toBeGreaterThan(0);
    for (const area of AREA_KEYS) {
      expect(ind[area].length).toBeGreaterThan(0);
    }
  });

  it("unknown packs fall back to the default set with all 7 areas", () => {
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

describe("getAreaLabels", () => {
  it("labels the domain area with the pack-specific label", () => {
    const labels = getAreaLabels("Artístico-Cultural");
    expect(labels.domain).toBe("Artístico-Cultural");
    expect(labels.physical).toBe("Físico");
    expect(Object.keys(labels).sort()).toEqual([...AREA_KEYS].sort());
  });
});
