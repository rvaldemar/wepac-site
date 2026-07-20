"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertMentorOfSession } from "@/lib/wepacker/actions/session";
import { requireUser } from "@/lib/wepacker/guards";
import { getDebriefEngine } from "@/lib/wepacker/debrief/engine";
import {
  DebriefEngineError,
  type DebriefAttendeeContext,
  type DebriefInput,
  type DebriefPackContext,
  type InternalEvaluation,
  type PerAttendeeDebrief,
} from "@/lib/wepacker/debrief/types";

// Typed, client-friendly view of a SessionDebrief row — the review UI
// reads exactly these fields. Dates are ISO strings, matching this
// codebase's page.tsx `serialize()` convention for server/client
// boundary crossings.
export interface SessionDebriefView {
  id: string;
  status: "ready" | "failed";
  engineImpl: string | null;
  model: string | null;
  perAttendee: PerAttendeeDebrief[];
  internalEvaluation: InternalEvaluation | null;
  resultDocumentHtml: string | null;
  error: string | null;
  requestedAt: string;
  generatedAt: string | null;
}

function toView(row: {
  id: string;
  status: string;
  engineImpl: string | null;
  model: string | null;
  perAttendeeSuggestions: unknown;
  internalEvaluation: unknown;
  resultDocumentHtml: string | null;
  error: string | null;
  requestedAt: Date;
  generatedAt: Date | null;
}): SessionDebriefView {
  return {
    id: row.id,
    status: row.status as "ready" | "failed",
    engineImpl: row.engineImpl,
    model: row.model,
    perAttendee: (row.perAttendeeSuggestions as PerAttendeeDebrief[] | null) ?? [],
    internalEvaluation: (row.internalEvaluation as InternalEvaluation | null) ?? null,
    resultDocumentHtml: row.resultDocumentHtml,
    error: row.error,
    requestedAt: row.requestedAt.toISOString(),
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
  };
}

export async function getSessionDebrief(
  sessionId: string
): Promise<SessionDebriefView | null> {
  await assertMentorOfSession(sessionId);
  const row = await prisma.sessionDebrief.findUnique({ where: { sessionId } });
  return row ? toView(row) : null;
}

// v1 simplification (not populated): DebriefAttendeeContext.recentAreaScores
// and .activeGoals are left undefined here — wiring those in from
// computeAreaScores()/getGoals() is a follow-up enrichment, not required
// for the engine seam to work; both fields are optional in the contract.
async function buildDebriefInput(
  sessionId: string,
  transcript: string
): Promise<DebriefInput> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      attendees: { include: { user: { select: { id: true, name: true } } } },
      cohort: { include: { pack: true } },
    },
  });

  const attendees: DebriefAttendeeContext[] = session.attendees.map((a) => ({
    userId: a.user.id,
    name: a.user.name,
    packSlug: session.cohort?.pack.slug,
  }));

  const packContext: DebriefPackContext | null = session.cohort
    ? {
        packSlug: session.cohort.pack.slug,
        packName: session.cohort.pack.name,
        practiceLabel:
          session.cohort.pack.tagline || session.cohort.pack.description || session.cohort.pack.name,
      }
    : null;

  return {
    sessionId,
    transcript,
    sessionKind: session.kind,
    discussionPoints: session.discussionPoints,
    attendees,
    packContext,
  };
}

// Gates via assertMentorOfSession; upserts SessionDebrief keyed on the
// unique sessionId (force replaces the prior draft); never logs
// transcript/payload content; throws a PT-PT user-safe Error (no raw SDK
// error text) that the review UI renders verbatim in its Error state.
export async function generateSessionDebrief(
  sessionId: string,
  opts?: { force?: boolean }
): Promise<SessionDebriefView> {
  await assertMentorOfSession(sessionId);
  const actor = await requireUser();

  if (!opts?.force) {
    const existing = await prisma.sessionDebrief.findUnique({ where: { sessionId } });
    if (existing) return toView(existing);
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { transcript: true },
  });
  if (!session?.transcript) {
    throw new Error("Esta sessão ainda não tem transcrição.");
  }

  const input = await buildDebriefInput(sessionId, session.transcript);
  const engine = getDebriefEngine();

  try {
    const result = await engine.generateDebrief(input);
    // Prisma's Json input type has no structural relation to our
    // DebriefResult sub-types — round-trip through JSON to get a plain
    // Prisma.InputJsonValue (also strips any `undefined` field values,
    // which Json columns can't store anyway).
    const perAttendeeJson = JSON.parse(
      JSON.stringify(result.perAttendee)
    ) as Prisma.InputJsonValue;
    const internalEvaluationJson = JSON.parse(
      JSON.stringify(result.internalEvaluation)
    ) as Prisma.InputJsonValue;
    const row = await prisma.sessionDebrief.upsert({
      where: { sessionId },
      create: {
        sessionId,
        status: "ready",
        engineImpl: engine.name,
        model: "claude-sonnet-5",
        perAttendeeSuggestions: perAttendeeJson,
        internalEvaluation: internalEvaluationJson,
        resultDocumentHtml: result.resultDocumentHtml,
        requestedById: actor.id,
        generatedAt: new Date(),
      },
      update: {
        status: "ready",
        engineImpl: engine.name,
        model: "claude-sonnet-5",
        perAttendeeSuggestions: perAttendeeJson,
        internalEvaluation: internalEvaluationJson,
        resultDocumentHtml: result.resultDocumentHtml,
        error: null,
        requestedById: actor.id,
        requestedAt: new Date(),
        generatedAt: new Date(),
      },
    });
    return toView(row);
  } catch (err) {
    // No transcript/prompt/payload here — only the user-safe message
    // (already scrubbed by the engine impl) and the sessionId.
    const message =
      err instanceof DebriefEngineError
        ? err.message
        : "Não foi possível gerar o debrief. Tenta novamente.";
    console.error("[wepacker:debrief] generation failed", { sessionId, message });
    await prisma.sessionDebrief.upsert({
      where: { sessionId },
      create: {
        sessionId,
        status: "failed",
        error: message,
        requestedById: actor.id,
      },
      update: {
        status: "failed",
        error: message,
        requestedById: actor.id,
        requestedAt: new Date(),
      },
    });
    throw new Error(message);
  }
}
