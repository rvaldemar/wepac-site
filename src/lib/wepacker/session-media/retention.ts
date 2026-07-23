import type { Prisma } from "@prisma/client";

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
