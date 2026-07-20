// Canonical contract for the session-debrief epic — the seam every
// frente (transcript capture, review UI, AI engine) builds against.
//
// Ownership (board decision): this file, the Session transcript columns,
// and the SessionDebrief model are owned by the CAPTURE+REVIEW frente.
// The ENGINE frente (DebriefEngine implementations) conforms to the
// shapes below — it must not redefine them.
//
// Ratified 6 areas (board decision, see the AreaKey-reducing migration
// dated 2026-07-20): AreaKey has exactly 6 scored values, full stop. A
// pack's own practice (music, sport, ...) is carried as unscored free
// text (practiceObservations) elsewhere in this file, never as a scored
// member of AreaObservation.

import type { AreaKey, SessionKind } from "@/lib/wepacker/types";

// A mentor-pasted or uploaded transcript is plain text/markdown, capped
// well above a multi-hour session's plain-text size.
export const MAX_TRANSCRIPT_CHARS = 300_000;

// ===== ENGINE INPUT =====

export interface DebriefAttendeeContext {
  userId: string;
  name: string;
  packSlug?: string;
  // Most recent composite score per area, when available — grounds the
  // engine's observations in the person's actual trajectory instead of
  // reading the transcript in a vacuum.
  recentAreaScores?: Partial<Record<AreaKey, number>>;
  activeGoals?: string[];
}

export interface DebriefPackContext {
  packSlug: string;
  packName: string;
  // Free-text description of the pack's own practice (music, sport,
  // etc). NOT a 7th scored area.
  practiceLabel: string;
}

export interface DebriefInput {
  sessionId: string;
  // Plain text/markdown, up to MAX_TRANSCRIPT_CHARS.
  transcript: string;
  sessionKind: SessionKind;
  discussionPoints: string | null;
  attendees: DebriefAttendeeContext[];
  // null for cohort-less / cross-pack personal sessions.
  packContext: DebriefPackContext | null;
}

// ===== ENGINE OUTPUT =====

export interface AttendeeTaskSuggestion {
  title: string;
  description?: string;
  // ISO yyyy-mm-dd, or "" — mirrors createTaskFromSession's
  // optional-deadline convention.
  deadline?: string;
}

export interface PerAttendeeDebrief {
  userId: string;
  // Suggestion for SessionAttendee.outcome.
  outcomeSuggestion: string;
  // Suggestion for SessionAttendee.sharedNote.
  sharedNoteSuggestion: string;
  // Transcript-coverage signal for this person — how much the
  // transcript actually talked about them specifically.
  confidence: "high" | "medium" | "low";
  tasks: AttendeeTaskSuggestion[];
}

export type AreaSignal = "strength" | "watch" | "concern" | "not_discussed";

export interface AreaObservation {
  area: AreaKey;
  signal: AreaSignal;
  // Must be traceable to the transcript — faithful extraction, not
  // invention.
  evidence: string;
}

export interface InternalEvaluation {
  sessionSummary: string;
  // Exactly the 6 universal areas — never a 7th scored entry.
  areaObservations: Record<AreaKey, AreaObservation>;
  // Pack-specific practice notes, unscored.
  practiceObservations: string | null;
  risks: string[];
  recommendedFollowUps: string[];
  // Suggestion for the NEXT session's kind.
  suggestedSessionKind?: SessionKind;
}

export interface DebriefResult {
  perAttendee: PerAttendeeDebrief[];
  internalEvaluation: InternalEvaluation;
  // Personal result document in the WEPACKER mountain imaginary. Only
  // generated for individual (single-attendee) sessions in v1 — null for
  // group sessions. The review UI must render a no-document state and
  // never call preview/download when this is null.
  resultDocumentHtml: string | null;
}

export class DebriefEngineError extends Error {}
