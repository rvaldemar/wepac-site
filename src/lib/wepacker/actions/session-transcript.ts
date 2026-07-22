"use server";

import { prisma } from "@/lib/db";
import { assertSessionOrganizer } from "@/lib/wepacker/actions/session";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";
import { MAX_TRANSCRIPT_FILE_BYTES } from "@/lib/wepacker/transcript-file";

// Transcripts are sensitive personal data (mentees may be minors) — this
// module never logs transcript content, only ids/counts, matching the
// epic's GDPR/no-content-in-logs requirement.

export async function attachSessionTranscript(
  sessionId: string,
  transcript: string,
) {
  if (process.env.SESSION_TRANSCRIPT_WRITES_ENABLED !== "true") {
    throw new Error(
      "Novos Session Transcript attachments estão temporariamente indisponíveis até o consentimento e a retenção estarem formalizados.",
    );
  }
  const { actorId } = await assertSessionOrganizer(sessionId);
  const trimmed = transcript.trim();
  if (!trimmed) throw new Error("Transcrição vazia.");
  if (trimmed.includes("\0")) {
    throw new Error("A transcript não contém texto válido.");
  }
  if (Buffer.byteLength(trimmed, "utf8") > MAX_TRANSCRIPT_FILE_BYTES) {
    throw new Error("Transcript demasiado grande (máx. 2 MB).");
  }
  if (trimmed.length > MAX_TRANSCRIPT_CHARS) {
    throw new Error(
      `Transcrição demasiado longa (máx. ${MAX_TRANSCRIPT_CHARS.toLocaleString("pt-PT")} caracteres).`,
    );
  }
  // A replacement invalidates every AI artifact derived from the previous
  // transcript. Purge it atomically so the UI can never present an old
  // debrief as if it came from the newly attached source.
  const [session] = await prisma.$transaction([
    prisma.session.update({
      where: { id: sessionId },
      data: {
        transcript: trimmed,
        transcriptRevision: { increment: 1 },
        transcriptUploadedAt: new Date(),
        transcriptUploadedById: actorId,
      },
      select: { id: true, transcriptUploadedAt: true },
    }),
    prisma.sessionDebrief.deleteMany({ where: { sessionId } }),
  ]);
  return session;
}

// GDPR erasure: clearing the transcript is a full erasure of derived
// data too — it also purges any existing SessionDebrief row, since its
// suggestions/evaluation/result-document text are all quotable personal
// data derived from the raw transcript, possibly a minor's. There is no
// "keep the debrief, drop the transcript" path.
export async function clearSessionTranscript(sessionId: string) {
  await assertSessionOrganizer(sessionId);
  const [session] = await prisma.$transaction([
    prisma.session.update({
      where: { id: sessionId },
      data: {
        transcript: null,
        transcriptRevision: { increment: 1 },
        transcriptUploadedAt: null,
        transcriptUploadedById: null,
      },
      select: { id: true },
    }),
    prisma.sessionDebrief.deleteMany({ where: { sessionId } }),
  ]);
  return session;
}
