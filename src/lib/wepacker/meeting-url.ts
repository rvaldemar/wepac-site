import { randomBytes } from "node:crypto";

// Defaults to the public Jitsi instance — see .env.example. Will migrate to
// a self-hosted instance later; reading this at call time (not module load)
// keeps it test-friendly and lets it pick up runtime env changes.
function meetingBaseUrl(): string {
  return process.env.MEETING_BASE_URL || "https://meet.jit.si";
}

// Auto-generated video call link for a new session. The room slug is a
// non-guessable crypto-random token, deliberately NOT the session's own id
// — the session id is exposed in URLs/APIs to any attendee, and reusing it
// as the meeting slug would let anyone who can see a session id also guess
// (or worse, enumerate) its meeting room.
//
// Deliberately lives outside actions/session.ts: that file has a top-level
// "use server" directive, and Next.js requires every export from a Server
// Actions module to be an async function — this is a plain sync helper.
export function generateMeetingUrl(baseUrl: string = meetingBaseUrl()): string {
  const token = randomBytes(8).toString("hex"); // 16 hex chars
  return `${baseUrl}/wepac-${token}`;
}
