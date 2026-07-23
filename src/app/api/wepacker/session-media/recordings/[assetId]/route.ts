import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/wepacker/guards";
import { openVerifiedRecording } from "@/lib/wepacker/session-media/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  try {
    const actor = await requireUser();
    const { assetId } = await context.params;
    const asset = await prisma.recordingAsset.findUnique({
      where: { id: assetId },
      include: {
        recording: {
          select: { sessionId: true, session: { select: { organizerId: true } } },
        },
      },
    });
    if (
      !asset ||
      asset.status !== "ready" ||
      asset.deletedAt ||
      !asset.objectKey ||
      !asset.sha256 ||
      asset.bytes === null ||
      !asset.mimeType ||
      asset.recording.session.organizerId !== actor.id
    ) {
      return new Response("Not found", { status: 404 });
    }
    const handle = await openVerifiedRecording({
      objectKey: asset.objectKey,
      sha256: asset.sha256,
      bytes: asset.bytes,
    });
    try {
      await prisma.sessionArtifactAuditEvent.create({
        data: {
          sessionId: asset.recording.sessionId,
          actorUserId: actor.id,
          type: "recording_downloaded",
          resourceId: asset.id,
        },
      });
    } catch (error) {
      await handle.close();
      throw error;
    }
    return new Response(
      Readable.toWeb(handle.createReadStream({ autoClose: true })) as ReadableStream,
      {
        headers: {
          "content-type": asset.mimeType,
          "content-length": asset.bytes.toString(),
          "content-disposition": `attachment; filename="session-recording-${asset.id}.${asset.mimeType.startsWith("audio/") ? "m4a" : "mp4"}"`,
          "cache-control": "private, no-store, max-age=0",
          "x-content-type-options": "nosniff",
        },
      },
    );
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
