import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SUPPORT_PREVIEW_TICKET_RETENTION_MS = 0;
export const SUPPORT_PREVIEW_GRANT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const SUPPORT_PREVIEW_AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

async function enableRetentionMaintenance(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$queryRaw`SELECT set_config('wepac.support_preview_retention_maintenance', 'on', true)`;
}

// Detaches the erased Person and their organized Sessions while retaining the
// content-free event identity, timestamp, structured purpose and event type.
// Active grants touching that Person are removed before account deletion.
export async function anonymizeSupportPreviewForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date = new Date(),
): Promise<{ anonymizedEvents: number; removedGrants: number }> {
  await enableRetentionMaintenance(tx);

  const organizedSessions = await tx.session.findMany({
    where: { organizerId: userId },
    select: { id: true },
  });
  const organizedSessionIds = organizedSessions.map((session) => session.id);
  const affectedGrants = await tx.supportPreviewGrant.findMany({
    where: {
      OR: [
        { actorId: userId },
        { targetUserId: userId },
        ...(organizedSessionIds.length > 0
          ? [{ sessionId: { in: organizedSessionIds } }]
          : []),
      ],
    },
    select: { id: true },
  });
  const affectedGrantIds = affectedGrants.map((grant) => grant.id);

  let anonymizedEvents = 0;
  if (affectedGrantIds.length > 0) {
    const detached = await tx.supportPreviewAuditEvent.updateMany({
      where: { grantId: { in: affectedGrantIds } },
      data: { grantId: null, anonymizedAt: now },
    });
    anonymizedEvents += detached.count;
  }

  const actorEvents = await tx.supportPreviewAuditEvent.updateMany({
    where: { actorId: userId },
    data: { actorId: null, anonymizedAt: now },
  });
  anonymizedEvents += actorEvents.count;

  const targetEvents = await tx.supportPreviewAuditEvent.updateMany({
    where: { targetUserId: userId },
    data: { targetUserId: null, anonymizedAt: now },
  });
  anonymizedEvents += targetEvents.count;

  if (organizedSessionIds.length > 0) {
    const sessionEvents = await tx.supportPreviewAuditEvent.updateMany({
      where: { sessionId: { in: organizedSessionIds } },
      data: { sessionId: null, anonymizedAt: now },
    });
    anonymizedEvents += sessionEvents.count;
  }

  const removedGrants =
    affectedGrantIds.length > 0
      ? await tx.supportPreviewGrant.deleteMany({
          where: { id: { in: affectedGrantIds } },
        })
      : { count: 0 };

  return {
    // One event can match more than one detached relation. This is a count of
    // anonymization writes, not a distinct-subject analytics metric.
    anonymizedEvents,
    removedGrants: removedGrants.count,
  };
}

export async function applySupportPreviewRetention(
  now: Date = new Date(),
): Promise<{
  deletedAuditEvents: number;
  detachedGrantReferences: number;
  deletedGrants: number;
  redactedTicketReferences: number;
}> {
  const ticketCutoff = new Date(
    now.getTime() - SUPPORT_PREVIEW_TICKET_RETENTION_MS,
  );
  const grantCutoff = new Date(
    now.getTime() - SUPPORT_PREVIEW_GRANT_RETENTION_MS,
  );
  const auditCutoff = new Date(
    now.getTime() - SUPPORT_PREVIEW_AUDIT_RETENTION_MS,
  );

  return prisma.$transaction(async (tx) => {
    // If the database maintenance boundary is unavailable, the transaction
    // aborts before any retention mutation: partial cleanup never proceeds.
    await enableRetentionMaintenance(tx);

    const deletedAuditEvents = await tx.supportPreviewAuditEvent.deleteMany({
      where: { createdAt: { lt: auditCutoff } },
    });

    const staleGrants = await tx.supportPreviewGrant.findMany({
      where: { expiresAt: { lt: grantCutoff } },
      select: { id: true },
    });
    const staleGrantIds = staleGrants.map((grant) => grant.id);
    const detachedGrantReferences =
      staleGrantIds.length > 0
        ? await tx.supportPreviewAuditEvent.updateMany({
            where: { grantId: { in: staleGrantIds } },
            data: { grantId: null },
          })
        : { count: 0 };
    const deletedGrants =
      staleGrantIds.length > 0
        ? await tx.supportPreviewGrant.deleteMany({
            where: { id: { in: staleGrantIds } },
          })
        : { count: 0 };

    const redactedTicketReferences = await tx.supportPreviewGrant.updateMany({
      where: {
        expiresAt: { lte: ticketCutoff },
        ticketReferenceDigest: { not: null },
      },
      data: {
        ticketReferenceDigest: null,
        ticketReferenceRedactedAt: now,
      },
    });

    return {
      deletedAuditEvents: deletedAuditEvents.count,
      detachedGrantReferences: detachedGrantReferences.count,
      deletedGrants: deletedGrants.count,
      redactedTicketReferences: redactedTicketReferences.count,
    };
  });
}
