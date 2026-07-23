"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSessionOrganizer } from "@/lib/wepacker/actions/session";
import { requireUser } from "@/lib/wepacker/guards";
import { dispatchPersistedNotificationEvents, persistSessionResultEvent } from "@/lib/wepacker/notifications";
import { parseDebriefResult } from "@/lib/wepacker/debrief/types";
import {
  retentionDeadline,
  sessionDocumentPublicationEnabled,
} from "@/lib/wepacker/session-media/config";
import {
  renderSessionResultDocument,
  SESSION_RESULT_RENDERER_VERSION,
} from "@/lib/wepacker/session-media/result-document";
import { sha256 } from "@/lib/wepacker/session-media/security";

const PREVIEW_TTL_MS = 15 * 60 * 1_000;

async function renderCurrentResult(sessionId: string, attendeeId: string) {
  const debrief = await prisma.sessionDebrief.findUnique({
    where: { sessionId },
    include: {
      session: {
        select: {
          attendees: { where: { id: attendeeId }, select: { id: true, userId: true } },
        },
      },
    },
  });
  const attendee = debrief?.session.attendees[0];
  if (!debrief || debrief.status !== "ready" || !attendee) {
    throw new Error("A ready Debrief for this attendee is required.");
  }
  const parsed = parseDebriefResult({
    contractVersion: debrief.contractVersion,
    perAttendee: debrief.perAttendeeSuggestions,
    internalSynthesis: debrief.internalSynthesis,
    resultDocumentHtml: null,
  }, attendeeId);
  const suggestion = parsed?.perAttendee[0];
  if (!suggestion || suggestion.attendeeRef !== attendeeId) {
    throw new Error("Debrief attendee mismatch.");
  }
  const html = renderSessionResultDocument(suggestion);
  return { debrief, attendee, html, contentSha256: sha256(html) };
}

export async function createSessionResultDocumentPreview(
  sessionId: string,
  attendeeId: string,
) {
  if (!sessionDocumentPublicationEnabled()) {
    throw new Error("Session document publication is disabled.");
  }
  const { actorId } = await assertSessionOrganizer(sessionId);
  const rendered = await renderCurrentResult(sessionId, attendeeId);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);
  await prisma.$transaction(async (tx) => {
    await tx.sessionResultDocumentPreview.deleteMany({
      where: { sessionId, attendeeId, consumedAt: null },
    });
    const preview = await tx.sessionResultDocumentPreview.create({
      data: {
        sessionId,
        attendeeId,
        sourceDebriefId: rendered.debrief.id,
        tokenSha256: sha256(token),
        contentSha256: rendered.contentSha256,
        expiresAt,
        createdById: actorId,
      },
    });
    await tx.sessionArtifactAuditEvent.create({
      data: {
        sessionId,
        actorUserId: actorId,
        subjectUserId: rendered.attendee.userId,
        type: "document_previewed",
        resourceId: preview.id,
      },
    });
  });
  return {
    token,
    html: rendered.html,
    contentSha256: rendered.contentSha256,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function publishSessionResultDocument(input: {
  sessionId: string;
  attendeeId: string;
  previewToken: string;
  expectedSha256: string;
}) {
  if (!sessionDocumentPublicationEnabled()) {
    throw new Error("Session document publication is disabled.");
  }
  const { actorId } = await assertSessionOrganizer(input.sessionId);
  const rendered = await renderCurrentResult(input.sessionId, input.attendeeId);
  if (
    rendered.contentSha256 !== input.expectedSha256 ||
    rendered.contentSha256 !== sha256(rendered.html)
  ) {
    throw new Error("The reviewed document changed; create a new preview.");
  }
  const events = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`session-document:${input.sessionId}:${input.attendeeId}`}, 0))`;
    const preview = await tx.sessionResultDocumentPreview.findUnique({
      where: { tokenSha256: sha256(input.previewToken) },
    });
    if (
      !preview ||
      preview.sessionId !== input.sessionId ||
      preview.attendeeId !== input.attendeeId ||
      preview.sourceDebriefId !== rendered.debrief.id ||
      preview.createdById !== actorId ||
      preview.contentSha256 !== rendered.contentSha256 ||
      preview.consumedAt ||
      preview.expiresAt <= new Date()
    ) {
      throw new Error("Preview expired or invalid.");
    }
    const latest = await tx.sessionResultDocument.aggregate({
      where: { sessionId: input.sessionId, attendeeId: input.attendeeId },
      _max: { version: true },
    });
    const version = (latest._max.version ?? 0) + 1;
    const document = await tx.sessionResultDocument.create({
      data: {
        sessionId: input.sessionId,
        attendeeId: input.attendeeId,
        sourceDebriefId: rendered.debrief.id,
        version,
        rendererVersion: SESSION_RESULT_RENDERER_VERSION,
        contentHtml: rendered.html,
        contentSha256: rendered.contentSha256,
        publishedById: actorId,
        retainUntil: retentionDeadline("document"),
      },
    });
    await tx.sessionResultDocumentPreview.update({
      where: { id: preview.id },
      data: { consumedAt: new Date() },
    });
    await tx.sessionArtifactAuditEvent.create({
      data: {
        sessionId: input.sessionId,
        actorUserId: actorId,
        subjectUserId: rendered.attendee.userId,
        type: "document_published",
        resourceId: document.id,
        resourceVersion: version,
      },
    });
    const event = await persistSessionResultEvent(tx, {
      documentId: document.id,
      sessionId: input.sessionId,
      recipientId: rendered.attendee.userId,
      actorId,
      version,
      type: "session_result_published",
    });
    return { document, notifications: [event] };
  });
  dispatchPersistedNotificationEvents(events.notifications);
  revalidatePath(`/wepacker/sessions/${input.sessionId}`);
  revalidatePath(`/wepacker/mentor/sessions/${input.sessionId}`);
  return events.document;
}

export async function revokeSessionResultDocument(documentId: string) {
  const actor = await requireUser();
  const row = await prisma.sessionResultDocument.findUnique({
    where: { id: documentId },
    include: {
      session: { select: { organizerId: true } },
      attendee: { select: { userId: true } },
    },
  });
  if (!row || row.session.organizerId !== actor.id) {
    throw new Error("Permission denied.");
  }
  const result = await prisma.$transaction(async (tx) => {
    const changed = await tx.sessionResultDocument.updateMany({
      where: { id: documentId, revokedAt: null, erasedAt: null },
      data: { revokedAt: new Date() },
    });
    if (changed.count !== 1) return null;
    await tx.sessionArtifactAuditEvent.create({
      data: {
        sessionId: row.sessionId,
        actorUserId: actor.id,
        subjectUserId: row.attendee.userId,
        type: "document_revoked",
        resourceId: row.id,
        resourceVersion: row.version,
      },
    });
    return persistSessionResultEvent(tx, {
      documentId: row.id,
      sessionId: row.sessionId,
      recipientId: row.attendee.userId,
      actorId: actor.id,
      version: row.version,
      type: "session_result_revoked",
    });
  });
  if (result) dispatchPersistedNotificationEvents([result]);
  revalidatePath(`/wepacker/sessions/${row.sessionId}`);
  return { revoked: true };
}

export async function getMyPublishedSessionDocuments(sessionId: string) {
  const actor = await requireUser();
  const attendee = await prisma.sessionAttendee.findUnique({
    where: { sessionId_userId: { sessionId, userId: actor.id } },
    select: { id: true },
  });
  if (!attendee) throw new Error("Permission denied.");
  return prisma.sessionResultDocument.findMany({
    where: {
      sessionId,
      attendeeId: attendee.id,
      revokedAt: null,
      erasedAt: null,
    },
    select: { id: true, version: true, publishedAt: true },
    orderBy: { version: "desc" },
  });
}
