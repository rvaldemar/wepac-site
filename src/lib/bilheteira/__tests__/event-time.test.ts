import { afterEach, describe, expect, it, vi } from "vitest";
import { isPastEvent } from "@/lib/bilheteira/event-time";

afterEach(() => {
  vi.useRealTimers();
});

describe("isPastEvent", () => {
  it("uses startsAt as the cutoff with a fixed clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T18:00:00.000Z"));

    expect(isPastEvent(new Date("2026-08-25T17:59:59.999Z"))).toBe(true);
    expect(isPastEvent(new Date("2026-08-25T18:00:00.000Z"))).toBe(false);
    expect(isPastEvent(new Date("2026-08-25T18:00:00.001Z"))).toBe(false);
  });

  it("accepts an explicit clock without reading global time", () => {
    const now = new Date("2026-08-25T18:00:00.000Z");

    expect(isPastEvent(new Date("2026-08-25T17:00:00.000Z"), now)).toBe(true);
    expect(isPastEvent(new Date("2026-08-25T19:00:00.000Z"), now)).toBe(false);
  });
});
