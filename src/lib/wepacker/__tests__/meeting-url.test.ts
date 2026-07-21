import { describe, it, expect } from "vitest";
import { generateMeetingUrl } from "@/lib/wepacker/meeting-url";

// Regression/spec test for the video-call link generator used by
// createSession. The room slug must be crypto-random and independent of
// the session's own id (which is exposed to every attendee), never
// guessable or derived from anything sequential.

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
