"use server";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertSessionOrganizer } from "@/lib/wepacker/actions/session";
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

class TranscriptChangedDuringGenerationError extends Error {}

function transcriptFingerprint(value: string | null): string {
  return createHash("sha256")
    .update(value ?? "")
    .digest("hex");
}

// Lock the Session row while persisting a derived result. The monotonic source
// revision catches same-content replacement and A-B-A changes; the fingerprint
// is an additional integrity check. If replacement starts after this lock, it
// waits and then atomically deletes the just-written result.
async function withMatchingTranscript<T>(
  sessionId: string,
  expectedRevision: number,
  expectedFingerprint: string,
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ transcript: string | null; transcriptRevision: number }>
    >`
      SELECT "transcript", "transcriptRevision"
      FROM "sessions"
      WHERE "id" = ${sessionId}
      FOR SHARE
    `;
    if (
      rows.length !== 1 ||
      rows[0]?.transcriptRevision !== expectedRevision ||
      transcriptFingerprint(rows[0]?.transcript ?? null) !== expectedFingerprint
    ) {
      throw new TranscriptChangedDuringGenerationError();
    }
    return write(tx);
  });
}

function transcriptChangedError(): Error {
  return new Error(
    "A Session Transcript mudou durante a geração. Revê a versão atual e gera novamente.",
  );
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
    perAttendee:
      (row.perAttendeeSuggestions as PerAttendeeDebrief[] | null) ?? [],
    internalEvaluation:
      (row.internalEvaluation as InternalEvaluation | null) ?? null,
    resultDocumentHtml: row.resultDocumentHtml,
    error: row.error,
    requestedAt: row.requestedAt.toISOString(),
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
  };
}

export async function getSessionDebrief(
  sessionId: string,
): Promise<SessionDebriefView | null> {
  await assertSessionOrganizer(sessionId);
  const row = await prisma.sessionDebrief.findUnique({ where: { sessionId } });
  return row ? toView(row) : null;
}

// v1 simplification (not populated): DebriefAttendeeContext.recentAreaScores
// and .activeGoals are left undefined here — wiring those in from
// computeAreaScores()/getGoals() is a follow-up enrichment, not required
// for the engine seam to work; both fields are optional in the contract.
async function buildDebriefInput(
  sessionId: string,
  transcript: string,
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
          session.cohort.pack.tagline ||
          session.cohort.pack.description ||
          session.cohort.pack.name,
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

// Gates via the exact organizer check; upserts SessionDebrief keyed on the
// unique sessionId (force replaces the prior draft); never logs
// transcript/payload content; throws a PT-PT user-safe Error (no raw SDK
// error text) that the review UI renders verbatim in its Error state.
export async function generateSessionDebrief(
  sessionId: string,
  opts?: { force?: boolean },
): Promise<SessionDebriefView> {
  const { actorId } = await assertSessionOrganizer(sessionId);

  if (!opts?.force) {
    const existing = await prisma.sessionDebrief.findUnique({
      where: { sessionId },
    });
    if (existing) return toView(existing);
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { transcript: true, transcriptRevision: true },
  });
  if (!session?.transcript) {
    throw new Error("Esta sessão ainda não tem transcrição.");
  }

  const sourceFingerprint = transcriptFingerprint(session.transcript);
  const input = await buildDebriefInput(sessionId, session.transcript);

  try {
    // Inside the try: getDebriefEngine() itself can now throw a fail-loud
    // DebriefEngineError (e.g. HubDebriefEngine's constructor when
    // DEBRIEF_ENGINE=hub is missing its own env vars) and must land in the
    // same failed-SessionDebrief-row flow as a generateDebrief() failure,
    // not bubble up as an unhandled server-action exception.
    const engine = getDebriefEngine();
    const result = await engine.generateDebrief(input);
    // Prisma's Json input type has no structural relation to our
    // DebriefResult sub-types — round-trip through JSON to get a plain
    // Prisma.InputJsonValue (also strips any `undefined` field values,
    // which Json columns can't store anyway).
    const perAttendeeJson = JSON.parse(
      JSON.stringify(result.perAttendee),
    ) as Prisma.InputJsonValue;
    const internalEvaluationJson = JSON.parse(
      JSON.stringify(result.internalEvaluation),
    ) as Prisma.InputJsonValue;
    const row = await withMatchingTranscript(
      sessionId,
      session.transcriptRevision,
      sourceFingerprint,
      (tx) =>
        tx.sessionDebrief.upsert({
          where: { sessionId },
          create: {
            sessionId,
            status: "ready",
            engineImpl: engine.name,
            model: "claude-sonnet-5",
            perAttendeeSuggestions: perAttendeeJson,
            internalEvaluation: internalEvaluationJson,
            resultDocumentHtml: result.resultDocumentHtml,
            requestedById: actorId,
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
            requestedById: actorId,
            requestedAt: new Date(),
            generatedAt: new Date(),
          },
        }),
    );
    return toView(row);
  } catch (err) {
    if (err instanceof TranscriptChangedDuringGenerationError) {
      throw transcriptChangedError();
    }
    // No transcript/prompt/payload here — only the user-safe message
    // (already scrubbed by the engine impl) and the sessionId.
    const message =
      err instanceof DebriefEngineError
        ? err.message
        : "Não foi possível gerar o debrief. Tenta novamente.";
    console.error("[wepacker:debrief] generation failed", {
      sessionId,
      message,
    });
    try {
      await withMatchingTranscript(
        sessionId,
        session.transcriptRevision,
        sourceFingerprint,
        (tx) =>
          tx.sessionDebrief.upsert({
            where: { sessionId },
            create: {
              sessionId,
              status: "failed",
              error: message,
              requestedById: actorId,
            },
            update: {
              status: "failed",
              error: message,
              requestedById: actorId,
              requestedAt: new Date(),
            },
          }),
      );
    } catch (writeError) {
      if (writeError instanceof TranscriptChangedDuringGenerationError) {
        throw transcriptChangedError();
      }
      throw writeError;
    }
    throw new Error(message);
  }
}
