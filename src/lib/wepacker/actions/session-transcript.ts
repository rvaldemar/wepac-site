"use server";

import { prisma } from "@/lib/db";
import { assertMentorOfSession } from "@/lib/wepacker/actions/session";
import { requireUser } from "@/lib/wepacker/guards";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";

// Transcripts are sensitive personal data (mentees may be minors) — this
// module never logs transcript content, only ids/counts, matching the
// epic's GDPR/no-content-in-logs requirement.

export async function attachSessionTranscript(sessionId: string, transcript: string) {
  await assertMentorOfSession(sessionId);
  const actor = await requireUser();
  const trimmed = transcript.trim();
  if (!trimmed) throw new Error("Transcrição vazia.");
  if (trimmed.length > MAX_TRANSCRIPT_CHARS) {
    throw new Error(
      `Transcrição demasiado longa (máx. ${MAX_TRANSCRIPT_CHARS.toLocaleString("pt-PT")} caracteres).`
    );
  }
  return prisma.session.update({
    where: { id: sessionId },
    data: {
      transcript: trimmed,
      transcriptUploadedAt: new Date(),
      transcriptUploadedById: actor.id,
    },
  });
}

// GDPR erasure: clearing the transcript is a full erasure of derived
// data too — it also purges any existing SessionDebrief row, since its
// suggestions/evaluation/result-document text are all quotable personal
// data derived from the raw transcript, possibly a minor's. There is no
// "keep the debrief, drop the transcript" path.
export async function clearSessionTranscript(sessionId: string) {
  await assertMentorOfSession(sessionId);
  const [session] = await prisma.$transaction([
    prisma.session.update({
      where: { id: sessionId },
      data: {
        transcript: null,
        transcriptUploadedAt: null,
        transcriptUploadedById: null,
      },
    }),
    prisma.sessionDebrief.deleteMany({ where: { sessionId } }),
  ]);
  return session;
}
