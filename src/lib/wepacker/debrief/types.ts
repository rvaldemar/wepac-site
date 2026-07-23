import {
  PILLAR_KEYS,
  SESSION_KIND_KEYS,
  type PillarKey,
  type SessionKind,
} from "@/lib/wepacker/types";

export const DEBRIEF_CONTRACT_VERSION = "wepac-session-debrief-v3" as const;
export const MAX_TRANSCRIPT_CHARS = 500_000;
export const MAX_DISCUSSION_POINTS_CHARS = 8_000;
export const MAX_ACTION_SUGGESTIONS = 8;

export interface DebriefAttendeeContext {
  // SessionAttendee.id is an opaque, Session-scoped correlation reference. The
  // Hub contract never receives a User ID, name, email or Membership identity.
  attendeeRef: string;
}

export interface DebriefDisciplineContext {
  disciplineKey: string;
  practiceLabel: string;
}

export interface DebriefInput {
  contractVersion: typeof DEBRIEF_CONTRACT_VERSION;
  sessionRef: string;
  transcriptRevision: number;
  transcript: string;
  sessionKind: SessionKind;
  discussionPoints: string | null;
  attendees: [DebriefAttendeeContext];
  disciplineContext: DebriefDisciplineContext | null;
  releaseMode: "draft_only";
}

export interface AttendeeActionSuggestion {
  title: string;
  description: string | null;
  // ISO YYYY-MM-DD when proposed, otherwise null.
  dueDate: string | null;
}

export interface PerAttendeeDebrief {
  attendeeRef: string;
  outcomeSuggestion: string;
  sharedNoteSuggestion: string;
  confidence: "high" | "medium" | "low";
  // Proposals only. Hub and Debrief generation never persist an Action.
  actions: AttendeeActionSuggestion[];
}

export type PillarSignal = "strength" | "watch" | "concern" | "not_discussed";

export interface PillarObservation {
  signal: PillarSignal;
  evidence: string;
}

export interface InternalSynthesis {
  sessionSummary: string;
  pillarObservations: Record<PillarKey, PillarObservation>;
  disciplineObservations: string | null;
  risks: string[];
  recommendedFollowUps: string[];
  suggestedSessionKind: SessionKind | null;
}

export interface DebriefResult {
  contractVersion: typeof DEBRIEF_CONTRACT_VERSION;
  perAttendee: [PerAttendeeDebrief];
  internalSynthesis: InternalSynthesis;
  // WEPAC renders any member-facing document deterministically. Model-authored
  // HTML is outside the contract.
  resultDocumentHtml: null;
}

export class DebriefEngineError extends Error {}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(
  value: unknown,
  maxChars: number,
  allowEmpty = true,
): string | null {
  if (typeof value !== "string" || value.length > maxChars) return null;
  if (!allowEmpty && value.trim().length === 0) return null;
  return value;
}

function nullableBoundedString(
  value: unknown,
  maxChars: number,
): string | null | undefined {
  if (value === null) return null;
  return boundedString(value, maxChars) ?? undefined;
}

function stringList(value: unknown, maxItems: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const result: string[] = [];
  for (const item of value) {
    const parsed = boundedString(item, 5_000);
    if (parsed === null) return null;
    result.push(parsed);
  }
  return result;
}

function parsePerAttendee(
  value: unknown,
  expectedAttendeeRef?: string,
): [PerAttendeeDebrief] | null {
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0])) {
    return null;
  }

  const row = value[0];
  const attendeeRef = boundedString(row.attendeeRef, 200, false);
  const outcomeSuggestion = boundedString(row.outcomeSuggestion, 20_000);
  const sharedNoteSuggestion = boundedString(row.sharedNoteSuggestion, 20_000);
  if (
    attendeeRef === null ||
    (expectedAttendeeRef !== undefined && attendeeRef !== expectedAttendeeRef) ||
    outcomeSuggestion === null ||
    sharedNoteSuggestion === null ||
    !["high", "medium", "low"].includes(String(row.confidence)) ||
    !Array.isArray(row.actions) ||
    row.actions.length > MAX_ACTION_SUGGESTIONS
  ) {
    return null;
  }

  const actions: AttendeeActionSuggestion[] = [];
  for (const value of row.actions) {
    if (!isRecord(value)) return null;
    const title = boundedString(value.title, 300, false);
    const description = nullableBoundedString(value.description, 5_000);
    const dueDate = nullableBoundedString(value.dueDate, 10);
    if (
      title === null ||
      description === undefined ||
      dueDate === undefined ||
      (dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    ) {
      return null;
    }
    actions.push({ title, description, dueDate });
  }

  return [
    {
      attendeeRef,
      outcomeSuggestion,
      sharedNoteSuggestion,
      confidence: row.confidence as PerAttendeeDebrief["confidence"],
      actions,
    },
  ];
}

function parseInternalSynthesis(value: unknown): InternalSynthesis | null {
  if (!isRecord(value) || !isRecord(value.pillarObservations)) return null;

  const sessionSummary = boundedString(value.sessionSummary, 20_000);
  const disciplineObservations = nullableBoundedString(
    value.disciplineObservations,
    20_000,
  );
  const risks = stringList(value.risks, 20);
  const recommendedFollowUps = stringList(value.recommendedFollowUps, 20);
  if (
    sessionSummary === null ||
    disciplineObservations === undefined ||
    risks === null ||
    recommendedFollowUps === null
  ) {
    return null;
  }

  const pillarObservations = {} as Record<PillarKey, PillarObservation>;
  for (const pillar of PILLAR_KEYS) {
    const rawObservation = value.pillarObservations[pillar];
    if (!isRecord(rawObservation)) return null;
    const evidence = boundedString(rawObservation.evidence, 10_000);
    if (
      evidence === null ||
      !["strength", "watch", "concern", "not_discussed"].includes(
        String(rawObservation.signal),
      )
    ) {
      return null;
    }
    pillarObservations[pillar] = {
      signal: rawObservation.signal as PillarSignal,
      evidence,
    };
  }

  const suggestedSessionKind = value.suggestedSessionKind;
  if (
    suggestedSessionKind !== null &&
    !SESSION_KIND_KEYS.includes(suggestedSessionKind as SessionKind)
  ) {
    return null;
  }

  return {
    sessionSummary,
    pillarObservations,
    disciplineObservations,
    risks,
    recommendedFollowUps,
    suggestedSessionKind: suggestedSessionKind as SessionKind | null,
  };
}

// Treat Hub output and JSON read from the database as untrusted. Returning a
// freshly constructed value prevents old W01 rows or malformed provider output
// from being cast across the server/client boundary.
export function parseDebriefResult(
  value: unknown,
  expectedAttendeeRef?: string,
): DebriefResult | null {
  if (
    !isRecord(value) ||
    value.contractVersion !== DEBRIEF_CONTRACT_VERSION ||
    value.resultDocumentHtml !== null
  ) {
    return null;
  }
  const perAttendee = parsePerAttendee(value.perAttendee, expectedAttendeeRef);
  const internalSynthesis = parseInternalSynthesis(value.internalSynthesis);
  if (!perAttendee || !internalSynthesis) return null;
  return {
    contractVersion: DEBRIEF_CONTRACT_VERSION,
    perAttendee,
    internalSynthesis,
    resultDocumentHtml: null,
  };
}
