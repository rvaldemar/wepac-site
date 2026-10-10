import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());
  it("allows up to the limit inside the window and blocks after", () => {
    const now = 1_000_000;
    expect(checkRateLimit("k", 2, 1000, now)).toBe(true);
    expect(checkRateLimit("k", 2, 1000, now + 10)).toBe(true);
    expect(checkRateLimit("k", 2, 1000, now + 20)).toBe(false);
    expect(checkRateLimit("k", 2, 1000, now + 1001)).toBe(true);
  });
  it("isolates keys", () => {
    expect(checkRateLimit("a", 1, 1000, 0)).toBe(true);
    expect(checkRateLimit("b", 1, 1000, 0)).toBe(true);
    expect(checkRateLimit("a", 1, 1000, 1)).toBe(false);
  });
});
