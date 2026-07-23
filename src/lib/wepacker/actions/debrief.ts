"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertSessionOrganizer } from "@/lib/wepacker/actions/session";
import { assertSessionPurposesGrantedForAll } from "@/lib/wepacker/actions/session-media";
import { getDebriefEngine } from "@/lib/wepacker/debrief/engine";
import {
  DEBRIEF_CONTRACT_VERSION,
  MAX_DISCUSSION_POINTS_CHARS,
  DebriefEngineError,
  parseDebriefResult,
  type DebriefAttendeeContext,
  type DebriefDisciplineContext,
  type DebriefInput,
  type InternalSynthesis,
  type PerAttendeeDebrief,
} from "@/lib/wepacker/debrief/types";
import { retentionDeadline } from "@/lib/wepacker/session-media/config";

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
  internalSynthesis: InternalSynthesis | null;
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
  contractVersion: string;
  status: string;
  engineImpl: string | null;
  model: string | null;
  perAttendeeSuggestions: unknown;
  internalSynthesis: unknown;
  error: string | null;
  requestedAt: Date;
  generatedAt: Date | null;
}): SessionDebriefView | null {
  if (
    row.contractVersion !== DEBRIEF_CONTRACT_VERSION ||
    (row.status !== "ready" && row.status !== "failed")
  ) {
    return null;
  }

  if (row.status === "failed") {
    return {
      id: row.id,
      status: "failed",
      engineImpl: row.engineImpl,
      model: row.model,
      perAttendee: [],
      internalSynthesis: null,
      error: row.error,
      requestedAt: row.requestedAt.toISOString(),
      generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    };
  }

  const result = parseDebriefResult({
    contractVersion: row.contractVersion,
    perAttendee: row.perAttendeeSuggestions,
    internalSynthesis: row.internalSynthesis,
    resultDocumentHtml: null,
  });
  if (!result) return null;

  return {
    id: row.id,
    status: "ready",
    engineImpl: row.engineImpl,
    model: row.model,
    perAttendee: result.perAttendee,
    internalSynthesis: result.internalSynthesis,
    error: row.error,
    requestedAt: row.requestedAt.toISOString(),
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
  };
}

export async function getSessionDebrief(
  sessionId: string,
): Promise<SessionDebriefView | null> {
  await assertSessionOrganizer(sessionId);
  const row = await prisma.sessionDebrief.findFirst({
    where: { sessionId, contractVersion: DEBRIEF_CONTRACT_VERSION },
  });
  return row ? toView(row) : null;
}

async function buildDebriefInput(
  sessionId: string,
  transcript: string,
): Promise<DebriefInput> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      attendees: { select: { id: true } },
      cycle: { include: { primaryDiscipline: true } },
    },
  });

  if (session.attendees.length !== 1) {
    throw new Error("Session Debrief está disponível apenas para Individual Sessions.");
  }
  if ((session.discussionPoints?.length ?? 0) > MAX_DISCUSSION_POINTS_CHARS) {
    throw new Error("Os pontos de discussão excedem o limite do Debrief.");
  }

  const attendee: DebriefAttendeeContext = {
    attendeeRef: session.attendees[0].id,
  };

  const disciplineContext: DebriefDisciplineContext | null =
    session.cycle?.primaryDiscipline
    ? {
        disciplineKey: session.cycle.primaryDiscipline.slug,
        practiceLabel: session.cycle.primaryDiscipline.name,
      }
    : null;

  return {
    contractVersion: DEBRIEF_CONTRACT_VERSION,
    sessionRef: sessionId,
    transcriptRevision: session.transcriptRevision,
    transcript,
    sessionKind: session.kind,
    discussionPoints: session.discussionPoints,
    attendees: [attendee],
    disciplineContext,
    releaseMode: "draft_only",
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
  await assertSessionPurposesGrantedForAll(sessionId, ["ai_debrief"]);

  if (!opts?.force) {
    const existing = await prisma.sessionDebrief.findFirst({
      where: { sessionId, contractVersion: DEBRIEF_CONTRACT_VERSION },
    });
    const existingView = existing ? toView(existing) : null;
    if (existingView) return existingView;
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
    const rawResult = await engine.generateDebrief(input);
    const result = parseDebriefResult(
      rawResult,
      input.attendees[0].attendeeRef,
    );
    if (!result) {
      throw new DebriefEngineError(
        "O Hub devolveu um Debrief incompatível com o contrato W01 v3.",
      );
    }
    // Prisma's Json input type has no structural relation to our
    // DebriefResult sub-types — round-trip through JSON to get a plain
    // Prisma.InputJsonValue (also strips any `undefined` field values,
    // which Json columns can't store anyway).
    const perAttendeeJson = JSON.parse(
      JSON.stringify(result.perAttendee),
    ) as Prisma.InputJsonValue;
    const internalSynthesisJson = JSON.parse(
      JSON.stringify(result.internalSynthesis),
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
            contractVersion: DEBRIEF_CONTRACT_VERSION,
            status: "ready",
            engineImpl: engine.name,
            model: null,
            perAttendeeSuggestions: perAttendeeJson,
            internalSynthesis: internalSynthesisJson,
            requestedById: actorId,
            generatedAt: new Date(),
            retainUntil: retentionDeadline("transcript"),
          },
          update: {
            contractVersion: DEBRIEF_CONTRACT_VERSION,
            status: "ready",
            engineImpl: engine.name,
            model: null,
            perAttendeeSuggestions: perAttendeeJson,
            internalSynthesis: internalSynthesisJson,
            error: null,
            requestedById: actorId,
            requestedAt: new Date(),
            generatedAt: new Date(),
            retainUntil: retentionDeadline("transcript"),
          },
        }),
    );
    const view = toView(row);
    if (!view) {
      throw new DebriefEngineError(
        "O Debrief guardado não cumpre o contrato W01 v3.",
      );
    }
    return view;
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
              contractVersion: DEBRIEF_CONTRACT_VERSION,
              status: "failed",
              error: message,
              requestedById: actorId,
              retainUntil: retentionDeadline("transcript"),
            },
            update: {
              contractVersion: DEBRIEF_CONTRACT_VERSION,
              status: "failed",
              engineImpl: null,
              model: null,
              perAttendeeSuggestions: Prisma.DbNull,
              internalSynthesis: Prisma.DbNull,
              error: message,
              requestedById: actorId,
              requestedAt: new Date(),
              retainUntil: retentionDeadline("transcript"),
              generatedAt: null,
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
