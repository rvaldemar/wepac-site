// Minimal RFC 5545 iCalendar (.ics) generator for WEPACKER sessions. Hand-
// rolled rather than pulling in the `ics` package — the surface we need
// (one VEVENT, REQUEST/CANCEL, a handful of properties) is small enough
// that a dependency would cost more than it saves.
//
// Kept pure and dependency-free (no Prisma, no email, no Date.now() side
// effects beyond the optional `now` param) so it's fully unit-testable
// without a network or a database.

import { SESSION_KIND_LABELS, type SessionKind } from "@/lib/wepacker/types";

export type IcsMethod = "REQUEST" | "CANCEL";

export interface IcsPerson {
  email: string;
  name?: string | null;
}

export interface SessionIcsInput {
  sessionId: string;
  kind: SessionKind;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl?: string | null;
  organizer: IcsPerson;
  attendees: IcsPerson[];
  // Must increase across successive invites for the same session (a
  // create → update → update chain) so calendar clients recognize each
  // send as a newer revision of the same event rather than a duplicate.
  // Deliberately NOT derived in here (no Session.updatedAt column exists
  // to key off) — callers own sequencing; see actions/session.ts.
  sequence: number;
}

// Stable across the session's lifetime (create, every reschedule, and
// the final cancel) — this is what lets a calendar client replace the
// prior version of the event instead of adding a duplicate.
export function sessionIcsUid(sessionId: string): string {
  return `wepac-session-${sessionId}@wepac.pt`;
}

const PRODID = "-//WEPAC//WEPACKER Sessions//PT";
const FOLD_LIMIT = 75;

// RFC 5545 §3.3.11 text escaping: backslash, semicolon and comma are
// escaped with a leading backslash; line breaks become the literal
// two-character sequence \n (an actual CRLF would terminate the content
// line early and corrupt the file).
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

// RFC 5545 §3.1 line folding: content lines longer than 75 octets must be
// split with a CRLF followed by a single leading space, which readers
// unfold by stripping. Folded on UTF-16 code units rather than UTF-8
// bytes — good enough for the mostly-ASCII content this module emits
// (occasional PT accents aside), and avoids pulling in a byte-accurate
// encoder for a cosmetic edge case.
function foldLine(line: string): string {
  if (line.length <= FOLD_LIMIT) return line;
  let result = line.slice(0, FOLD_LIMIT);
  let rest = line.slice(FOLD_LIMIT);
  while (rest.length > 0) {
    const chunk = rest.slice(0, FOLD_LIMIT - 1);
    result += "\r\n " + chunk;
    rest = rest.slice(FOLD_LIMIT - 1);
  }
  return result;
}

// UTC, basic ICS format: YYYYMMDDTHHMMSSZ.
function formatIcsDateUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sessionKindLabel(kind: SessionKind): string {
  return SESSION_KIND_LABELS[kind]?.label ?? kind;
}

function organizerLine(organizer: IcsPerson): string {
  const cn = escapeIcsText(organizer.name?.trim() || organizer.email);
  return `ORGANIZER;CN=${cn}:mailto:${organizer.email}`;
}

function attendeeLine(attendee: IcsPerson): string {
  const cn = escapeIcsText(attendee.name?.trim() || attendee.email);
  return `ATTENDEE;CN=${cn};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendee.email}`;
}

// Builds the full VCALENDAR document for a session invite (METHOD:REQUEST)
// or cancellation (METHOD:CANCEL). `now` drives DTSTAMP — defaults to the
// real clock, overridable in tests for deterministic output.
export function buildSessionIcs(
  input: SessionIcsInput,
  method: IcsMethod,
  now: Date = new Date()
): string {
  const uid = sessionIcsUid(input.sessionId);
  const kindLabel = sessionKindLabel(input.kind);
  const summary = `Sessão WEPACKER — ${kindLabel}`;
  const status = method === "CANCEL" ? "CANCELLED" : "CONFIRMED";

  const descriptionParts = [
    method === "CANCEL"
      ? `Esta sessão WEPACKER (${kindLabel}) foi cancelada.`
      : `Sessão de mentoria WEPACKER (${kindLabel}).`,
    input.meetingUrl && method !== "CANCEL"
      ? `Link da sessão: ${input.meetingUrl}`
      : null,
  ].filter((part): part is string => Boolean(part));

  const dtStart = formatIcsDateUtc(input.scheduledAt);
  const dtEnd = formatIcsDateUtc(
    new Date(input.scheduledAt.getTime() + input.durationMinutes * 60_000)
  );

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    `METHOD:${method}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SEQUENCE:${input.sequence}`,
    `DTSTAMP:${formatIcsDateUtc(now)}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`,
    ...(input.meetingUrl
      ? [`LOCATION:${escapeIcsText(input.meetingUrl)}`]
      : []),
    `STATUS:${status}`,
    organizerLine(input.organizer),
    ...input.attendees.map(attendeeLine),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function buildSessionInviteIcs(
  input: SessionIcsInput,
  now?: Date
): string {
  return buildSessionIcs(input, "REQUEST", now);
}

export function buildSessionCancelIcs(
  input: SessionIcsInput,
  now?: Date
): string {
  return buildSessionIcs(input, "CANCEL", now);
}

// RFC 5545 only requires SEQUENCE to increase across revisions of the
// same UID, not that it increment by exactly 1 — so instead of adding a
// version column to Session, we derive it from wall-clock time, which is
// monotonic across the create → reschedule → cancel calls for a given
// session (each happens at a strictly later real moment than the last).
// Anchored to a fixed project epoch rather than 1970 to keep the numbers
// small. Milliseconds (not seconds) so two calendar sends issued within
// the same wall-clock second — e.g. a mentor reschedule immediately
// followed by a meeting-link edit — still produce strictly increasing
// values instead of colliding on one integer.
const SEQUENCE_EPOCH_MS = Date.UTC(2026, 0, 1);

export function nextIcsSequence(now: Date = new Date()): number {
  return Math.max(0, now.getTime() - SEQUENCE_EPOCH_MS);
}
