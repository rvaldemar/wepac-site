import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";

export async function GET(
  _request: Request,
  context: { params: Promise<{ transcriptId: string }> },
) {
  try {
    const actor = await requireUser();
    const { transcriptId } = await context.params;
    const transcript = await prisma.transcriptArtifact.findUnique({
      where: { id: transcriptId },
      include: { session: { select: { organizerId: true } } },
    });
    if (
      !transcript ||
      transcript.status !== "ready" ||
      transcript.deletedAt ||
      transcript.text === null ||
      transcript.session.organizerId !== actor.id
    ) {
      return new Response("Not found", { status: 404 });
    }
    await prisma.sessionArtifactAuditEvent.create({
      data: {
        sessionId: transcript.sessionId,
        actorUserId: actor.id,
        type: "transcript_downloaded",
        resourceId: transcript.id,
        resourceVersion: transcript.revision,
      },
    });
    return new Response(transcript.text, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="session-transcript-${transcript.revision}.txt"`,
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
