import { describe, it, expect } from "vitest";
import {
  buildSessionCancelIcs,
  buildSessionInviteIcs,
  nextIcsSequence,
  sessionIcsUid,
  type SessionIcsInput,
} from "@/lib/wepacker/ics";

// Pure generator, no network/DB — see ics.ts's own comment on why it's
// built this way.

const baseInput: SessionIcsInput = {
  sessionId: "sess_123",
  kind: "checkpoint",
  scheduledAt: new Date("2026-08-10T14:30:00.000Z"),
  durationMinutes: 45,
  meetingUrl: "https://meet.jit.si/wepac-abcdef1234567890",
  organizer: { email: "mentor@wepac.pt", name: "Ana Mentor" },
  attendees: [
    { email: "membro@wepac.pt", name: "João Membro" },
    { email: "mentor@wepac.pt", name: "Ana Mentor" },
  ],
  sequence: 0,
};

const FIXED_NOW = new Date("2026-08-01T09:00:00.000Z");

describe("sessionIcsUid", () => {
  it("is stable for the same session id", () => {
    expect(sessionIcsUid("sess_123")).toBe(
      sessionIcsUid("sess_123")
    );
  });

  it("follows the wepac-session-<id>@wepac.pt convention", () => {
    expect(sessionIcsUid("sess_123")).toBe("wepac-session-sess_123@wepac.pt");
  });

  it("differs for different session ids", () => {
    expect(sessionIcsUid("sess_123")).not.toBe(sessionIcsUid("sess_456"));
  });
});

describe("buildSessionInviteIcs", () => {
  it("emits a well-formed VCALENDAR/VEVENT with METHOD:REQUEST", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("uses the stable session UID", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics).toContain(`UID:${sessionIcsUid(baseInput.sessionId)}`);
  });

  it("uses CRLF line endings and ends with a trailing CRLF", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("computes DTSTART/DTEND in UTC from scheduledAt + durationMinutes", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics).toContain("DTSTART:20260810T143000Z");
    // 14:30 + 45min = 15:15
    expect(ics).toContain("DTEND:20260810T151500Z");
  });

  it("stamps DTSTAMP from the injected `now`", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics).toContain("DTSTAMP:20260801T090000Z");
  });

  it("includes the session kind label in the PT-PT summary", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics).toContain("SUMMARY:Sessão WEPACKER");
    expect(ics).toContain("Checkpoint");
  });

  it("sets LOCATION to the meeting URL and includes it in the description", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    expect(ics).toContain(`LOCATION:${baseInput.meetingUrl}`);
    expect(ics).toContain(baseInput.meetingUrl!);
  });

  it("omits LOCATION when there is no meeting URL", () => {
    const ics = buildSessionInviteIcs(
      { ...baseInput, meetingUrl: null },
      FIXED_NOW
    );
    expect(ics).not.toContain("LOCATION:");
  });

  it("writes the SEQUENCE it was given", () => {
    const ics = buildSessionInviteIcs({ ...baseInput, sequence: 7 }, FIXED_NOW);
    expect(ics).toContain("SEQUENCE:7");
  });

  it("emits ORGANIZER and one ATTENDEE line per attendee", () => {
    const ics = buildSessionInviteIcs(baseInput, FIXED_NOW);
    // Unfold first — long ATTENDEE lines legitimately wrap per RFC 5545
    // (see the dedicated folding test below).
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("ORGANIZER;CN=Ana Mentor:mailto:mentor@wepac.pt");
    expect(unfolded).toContain(
      "ATTENDEE;CN=João Membro;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:membro@wepac.pt"
    );
    const attendeeLines = unfolded
      .split("\r\n")
      .filter((l) => l.startsWith("ATTENDEE"));
    expect(attendeeLines).toHaveLength(baseInput.attendees.length);
  });

  it("escapes commas, semicolons and backslashes in free text", () => {
    const ics = buildSessionInviteIcs(
      {
        ...baseInput,
        meetingUrl: "https://meet.jit.si/wepac-a;b,c\\d",
      },
      FIXED_NOW
    );
    expect(ics).toContain("wepac-a\\;b\\,c\\\\d");
  });

  it("folds lines longer than 75 octets and unfolds back to the original", () => {
    const longUrl = `https://meet.example.org/${"x".repeat(120)}`;
    const ics = buildSessionInviteIcs(
      { ...baseInput, meetingUrl: longUrl },
      FIXED_NOW
    );
    // Every raw line in the output (before unfolding) must respect the
    // 75-char fold limit, folded continuation lines start with a space.
    for (const rawLine of ics.split("\r\n")) {
      if (rawLine.startsWith(" ")) continue; // continuation line
      expect(rawLine.length).toBeLessThanOrEqual(75);
    }
    // Unfolding (strip CRLF+space) must reconstruct the long URL intact.
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(`LOCATION:${longUrl}`);
  });
});

describe("buildSessionCancelIcs", () => {
  it("uses METHOD:CANCEL and STATUS:CANCELLED", () => {
    const ics = buildSessionCancelIcs(baseInput, FIXED_NOW);
    expect(ics).toContain("METHOD:CANCEL");
    expect(ics).toContain("STATUS:CANCELLED");
  });

  it("reuses the same stable UID as the invite for the same session", () => {
    const invite = buildSessionInviteIcs(baseInput, FIXED_NOW);
    const cancel = buildSessionCancelIcs(baseInput, FIXED_NOW);
    const uidOf = (ics: string) =>
      ics.split("\r\n").find((l) => l.startsWith("UID:"));
    expect(uidOf(cancel)).toBe(uidOf(invite));
  });

  it("omits the meeting link from the cancellation description", () => {
    const ics = buildSessionCancelIcs(baseInput, FIXED_NOW);
    expect(ics).not.toContain("Link da sessão");
  });

  it("still carries a higher SEQUENCE than the original invite", () => {
    const invite = buildSessionInviteIcs({ ...baseInput, sequence: 0 }, FIXED_NOW);
    const cancel = buildSessionCancelIcs({ ...baseInput, sequence: 1 }, FIXED_NOW);
    const seqOf = (ics: string) =>
      Number(ics.split("\r\n").find((l) => l.startsWith("SEQUENCE:"))?.split(":")[1]);
    expect(seqOf(cancel)).toBeGreaterThan(seqOf(invite));
  });
});

describe("nextIcsSequence", () => {
  it("increases for a later `now`", () => {
    const t1 = new Date("2026-08-01T09:00:00.000Z");
    const t2 = new Date("2026-08-01T09:00:05.000Z");
    expect(nextIcsSequence(t2)).toBeGreaterThan(nextIcsSequence(t1));
  });

  it("never returns a negative sequence, even before its epoch", () => {
    expect(nextIcsSequence(new Date("2020-01-01T00:00:00.000Z"))).toBe(0);
  });

  it("is deterministic for the same `now`", () => {
    const now = new Date("2026-08-01T09:00:00.000Z");
    expect(nextIcsSequence(now)).toBe(nextIcsSequence(now));
  });
});
