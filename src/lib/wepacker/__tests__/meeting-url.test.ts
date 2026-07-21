import { describe, it, expect, vi } from "vitest";

// Regression/spec test for the video-call link generator used by
// createSession. The room slug must be crypto-random and independent of
// the session's own id (which is exposed to every attendee), never
// guessable or derived from anything sequential. Session actions import
// prisma/guards at module load, so those are stubbed out here even though
// this test only exercises the pure generateMeetingUrl helper.

vi.mock("@/lib/db", () => ({
  prisma: { session: {} },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireMembership: vi.fn(),
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  getMentoredCohortIds: vi.fn(),
  assertMentorOfCohort: vi.fn(),
  assertMentorOfUsers: vi.fn(),
}));

import { generateMeetingUrl } from "@/lib/wepacker/actions/session";

describe("generateMeetingUrl", () => {
  it("uses the default base URL when none is provided", () => {
    const url = generateMeetingUrl();
    expect(url.startsWith("https://meet.jit.si/wepac-")).toBe(true);
  });

  it("accepts a configurable base URL", () => {
    const url = generateMeetingUrl("https://meet.example.org");
    expect(url.startsWith("https://meet.example.org/wepac-")).toBe(true);
  });

  it("generates a 16-char hex token after the wepac- prefix", () => {
    const url = generateMeetingUrl("https://meet.example.org");
    const slug = url.replace("https://meet.example.org/wepac-", "");
    expect(slug).toMatch(/^[0-9a-f]{16}$/);
  });

  it("generates a different token on every call (non-guessable/unique)", () => {
    const urls = new Set(
      Array.from({ length: 50 }, () => generateMeetingUrl("https://meet.example.org"))
    );
    expect(urls.size).toBe(50);
  });
});
