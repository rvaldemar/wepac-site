import { Prisma } from "@prisma/client";
import { dirname, join, sep } from "node:path";
import { lstat, mkdir, realpath, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  hubTranscriptionConfig,
  recordingStorageRoot,
} from "@/lib/wepacker/session-media/config";
import { safeRelativeObjectKey } from "@/lib/wepacker/session-media/security";

/**
 * Explicitly detaches a Person from retained Session media evidence before
 * account deletion. Content and append-only event identity stay intact; only
 * user foreign keys are tombstoned under the database maintenance boundary.
 */
export async function anonymizeSessionMediaForUser(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT set_config('wepac.session_media_erasure_maintenance', 'on', true)`;

  await tx.sessionConsentEvent.updateMany({
    where: { subjectUserId: userId },
    data: { subjectUserId: null },
  });
  await tx.sessionConsentEvent.updateMany({
    where: { actorUserId: userId },
    data: { actorUserId: null },
  });
  await tx.sessionConsentCapacityAssurance.updateMany({
    where: { subjectUserId: userId },
    data: { subjectUserId: null },
  });
  await tx.sessionConsentCapacityAssurance.updateMany({
    where: { verifiedByUserId: userId },
    data: { verifiedByUserId: null },
  });
  await tx.sessionArtifactAuditEvent.updateMany({
    where: { actorUserId: userId },
    data: { actorUserId: null },
  });
  await tx.sessionArtifactAuditEvent.updateMany({
    where: { subjectUserId: userId },
    data: { subjectUserId: null },
  });
  await tx.sessionRecording.updateMany({
    where: { requestedById: userId },
    data: { requestedById: null },
  });
  await tx.transcriptArtifact.updateMany({
    where: { createdById: userId },
    data: { createdById: null },
  });
  await tx.sessionResultDocument.updateMany({
    where: { publishedById: userId },
    data: { publishedById: null },
  });
}

async function removePrivateRecordingDirectory(objectKey: string): Promise<void> {
  const key = safeRelativeObjectKey(objectKey);
  const parts = key.split("/");
  if (
    parts.length !== 3 ||
    parts[0] !== "recordings" ||
    !/^[A-Za-z0-9_-]{8,128}$/.test(parts[1])
  ) {
    throw new Error("Invalid recording directory contract.");
  }
  const root = await realpath(recordingStorageRoot());
  const candidate = join(root, "recordings", parts[1]);
  const parent = await realpath(dirname(candidate));
  if (parent !== root && !parent.startsWith(`${root}${sep}`)) {
    throw new Error("Recording path escaped its storage root.");
  }
  let before;
  try {
    before = await lstat(candidate);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  if (!before.isDirectory() || before.isSymbolicLink()) {
    throw new Error("Recording source is not a real directory.");
  }
  const quarantineRoot = join(root, ".wepac-quarantine");
  await mkdir(quarantineRoot, { mode: 0o700 });
  const quarantineReal = await realpath(quarantineRoot);
  if (quarantineReal !== root && !quarantineReal.startsWith(`${root}${sep}`)) {
    throw new Error("Invalid recording quarantine.");
  }
  const quarantined = join(quarantineReal, `${parts[1]}-${randomUUID()}`);
  await rename(candidate, quarantined);
  try {
    const after = await lstat(quarantined);
    if (
      !after.isDirectory() ||
      after.isSymbolicLink() ||
      after.dev !== before.dev ||
      after.ino !== before.ino
    ) {
      throw new Error("Recording directory changed during quarantine.");
    }
    await rm(quarantined, { recursive: true, force: false });
  } catch (error) {
    try {
      await rename(quarantined, candidate);
    } catch {
      // Fail closed: do not commit the DB tombstone if safe restoration fails.
    }
    throw error;
  }
}

export async function reconcileDeletedHubTranscriptions(
  now = new Date(),
): Promise<number> {
  const tombstones = await prisma.transcriptArtifact.findMany({
    where: {
      status: "deleted",
      providerTranscriptId: { not: null },
      providerErasedAt: null,
    },
    select: {
      id: true,
      sessionId: true,
      revision: true,
      providerTranscriptId: true,
    },
    take: 100,
  });
  if (tombstones.length === 0) return 0;

  let config: ReturnType<typeof hubTranscriptionConfig>;
  try {
    config = hubTranscriptionConfig();
  } catch {
    return 0;
  }

  let confirmed = 0;
  for (const transcript of tombstones) {
    if (!transcript.providerTranscriptId) continue;
    let response: Response;
    try {
      response = await fetch(
        `${config.url.replace(/\/+$/, "")}/media_transcriptions/${transcript.providerTranscriptId}`,
        {
          method: "DELETE",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "x-hub-contract-version": config.contractVersion,
          },
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch {
      continue;
    }
    if (!response.ok && response.status !== 404) continue;

    confirmed += await prisma.$transaction(async (tx) => {
      const changed = await tx.transcriptArtifact.updateMany({
        where: {
          id: transcript.id,
          status: "deleted",
          providerErasedAt: null,
        },
        data: { providerErasedAt: now },
      });
      if (changed.count !== 1) return 0;
      await tx.sessionArtifactAuditEvent.create({
        data: {
          sessionId: transcript.sessionId,
          type: "artifact_erased",
          resourceId: transcript.id,
          resourceVersion: transcript.revision,
          reasonCode: "provider_erasure_confirmed",
        },
      });
      return 1;
    });
  }
  return confirmed;
}

export async function runSessionMediaRetention(
  now = new Date(),
): Promise<{
  providerTranscriptions: number;
  recordingAssets: number;
  transcripts: number;
  debriefs: number;
  documents: number;
  presence: number;
  previews: number;
}> {
  const counts = {
    providerTranscriptions: 0,
    recordingAssets: 0,
    transcripts: 0,
    debriefs: 0,
    documents: 0,
    presence: 0,
    previews: 0,
  };
  counts.providerTranscriptions =
    await reconcileDeletedHubTranscriptions(now);

  // Deletion is confirmed before the tombstone/event is committed.
  const recordings = await prisma.sessionRecording.findMany({
    where: {
      assets: { some: { retainUntil: { lte: now }, deletedAt: null } },
    },
    select: {
      id: true,
      sessionId: true,
      assets: {
        where: { deletedAt: null },
        select: { id: true, objectKey: true },
      },
    },
    take: 100,
  });
  for (const recording of recordings) {
    const objectKey = recording.assets.find((asset) => asset.objectKey)?.objectKey;
    if (objectKey) await removePrivateRecordingDirectory(objectKey);
    const changed = await prisma.$transaction(async (tx) => {
      const result = await tx.recordingAsset.updateMany({
        where: { recordingId: recording.id, deletedAt: null },
        data: {
          status: "deleted",
          objectKey: null,
          sha256: null,
          bytes: null,
          durationSeconds: null,
          mimeType: null,
          deletedAt: now,
        },
      });
      if (result.count < 1) return 0;
      await tx.sessionArtifactAuditEvent.create({
        data: {
          sessionId: recording.sessionId,
          type: "artifact_erased",
          resourceId: recording.id,
          reasonCode: "retention_expired",
        },
      });
      return result.count;
    });
    counts.recordingAssets += changed;
  }

  const expiredTranscripts = await prisma.transcriptArtifact.findMany({
    where: { retainUntil: { lte: now }, deletedAt: null },
    select: { id: true, sessionId: true, revision: true },
    take: 100,
  });
  for (const transcript of expiredTranscripts) {
    counts.transcripts += await prisma.$transaction(async (tx) => {
      const changed = await tx.transcriptArtifact.updateMany({
        where: { id: transcript.id, deletedAt: null },
        data: {
          status: "deleted",
          text: null,
          deletedAt: now,
          failureCode: null,
        },
      });
      if (changed.count !== 1) return 0;
      const retained = await tx.transcriptArtifact.count({
        where: {
          sessionId: transcript.sessionId,
          status: "ready",
          deletedAt: null,
          text: { not: null },
        },
      });
      if (retained === 0) {
        await tx.session.update({
          where: { id: transcript.sessionId },
          data: {
            transcript: null,
            transcriptUploadedAt: null,
            transcriptUploadedById: null,
            transcriptRevision: { increment: 1 },
          },
        });
      }
      await tx.sessionArtifactAuditEvent.create({
        data: {
          sessionId: transcript.sessionId,
          type: "artifact_erased",
          resourceId: transcript.id,
          resourceVersion: transcript.revision,
          reasonCode: "retention_expired",
        },
      });
      return 1;
    });
  }

  counts.debriefs = (
    await prisma.sessionDebrief.updateMany({
      where: {
        retainUntil: { lte: now },
        privateErasedAt: null,
      },
      data: {
        perAttendeeSuggestions: Prisma.DbNull,
        internalSynthesis: Prisma.DbNull,
        error: null,
        privateErasedAt: now,
      },
    })
  ).count;

  counts.documents = (
    await prisma.sessionResultDocument.updateMany({
      where: { retainUntil: { lte: now }, erasedAt: null },
      data: { contentHtml: null, erasedAt: now },
    })
  ).count;

  counts.presence = (
    await prisma.sessionCallPresence.deleteMany({
      where: { lastSeenAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } },
    })
  ).count;
  counts.previews = (
    await prisma.sessionResultDocumentPreview.deleteMany({
      where: { expiresAt: { lte: now } },
    })
  ).count;

  await prisma.sessionRecording.updateMany({
    where: {
      retainUntil: { lte: now },
      deletedAt: null,
      assets: { none: { deletedAt: null } },
    },
    data: { status: "deleted", deletedAt: now },
  });

  return counts;
}

export async function eraseSessionRecordingsAfterWithdrawal(
  sessionId: string,
  now = new Date(),
): Promise<void> {
  const assets = await prisma.recordingAsset.findMany({
    where: { recording: { sessionId }, deletedAt: null },
    select: { id: true, objectKey: true, recordingId: true },
  });
  const byRecording = new Map<string, typeof assets>();
  for (const asset of assets) {
    const group = byRecording.get(asset.recordingId) ?? [];
    group.push(asset);
    byRecording.set(asset.recordingId, group);
  }
  for (const [recordingId, group] of byRecording) {
    const objectKey = group.find((asset) => asset.objectKey)?.objectKey;
    if (objectKey) await removePrivateRecordingDirectory(objectKey);
    await prisma.recordingAsset.updateMany({
      where: { recordingId, deletedAt: null },
      data: {
        status: "deleted",
        objectKey: null,
        sha256: null,
        bytes: null,
        durationSeconds: null,
        mimeType: null,
        deletedAt: now,
      },
    });
  }
  // Keep the current provider operation finalizing so the organizer heartbeat
  // still receives stopRequested until Jitsi has stopped. Completed historical
  // recordings can be tombstoned immediately after their raw directory is gone.
  await prisma.sessionRecording.updateMany({
    where: {
      sessionId,
      deletedAt: null,
      status: { in: ["ready", "failed"] },
    },
    data: { status: "deleted", deletedAt: now },
  });
}

export async function eraseSessionTranscriptsAfterWithdrawal(
  sessionId: string,
  now = new Date(),
): Promise<string[]> {
  const providerRows = await prisma.transcriptArtifact.findMany({
    where: { sessionId, deletedAt: null },
    select: { providerTranscriptId: true },
  });
  await prisma.$transaction([
    prisma.transcriptArtifact.updateMany({
      where: { sessionId, deletedAt: null },
      data: {
        status: "deleted",
        text: null,
        failureCode: null,
        deletedAt: now,
      },
    }),
    prisma.session.update({
      where: { id: sessionId },
      data: {
        transcript: null,
        transcriptUploadedAt: null,
        transcriptUploadedById: null,
        transcriptRevision: { increment: 1 },
      },
    }),
    prisma.sessionDebrief.updateMany({
      where: { sessionId, privateErasedAt: null },
      data: {
        perAttendeeSuggestions: Prisma.DbNull,
        internalSynthesis: Prisma.DbNull,
        error: null,
        privateErasedAt: now,
      },
    }),
  ]);
  return providerRows.flatMap(({ providerTranscriptId }) =>
    providerTranscriptId ? [providerTranscriptId] : [],
  );
}
