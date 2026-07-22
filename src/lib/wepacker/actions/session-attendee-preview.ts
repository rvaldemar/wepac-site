"use server";

import { compare } from "bcryptjs";
import type { SupportPreviewReasonCode } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionAttendeePreview } from "@/lib/wepacker/actions/session";
import { requireRole, requireUser } from "@/lib/wepacker/guards";
import {
  clearAdminSupportPreviewCookie,
  digestSupportTicketReference,
  getAdminSupportPreviewGrantFromCookie,
  setAdminSupportPreviewCookie,
} from "@/lib/wepacker/support-preview-security";

const ADMIN_PREVIEW_TTL_MS = 15 * 60 * 1000;
const REAUTH_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REAUTH_FAILURES = 5;
const MAX_GRANT_ID_LENGTH = 128;
const TICKET_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{2,99}$/;
const ADMIN_SUPPORT_PREVIEW_PATH = "/wepacker/admin/support-preview";
const SUPPORT_PREVIEW_REASON_CODES = new Set<SupportPreviewReasonCode>([
  "reported_issue",
  "incident_response",
  "data_correction",
  "quality_assurance",
]);

type GateError =
  | "invalid_request"
  | "reauth_failed"
  | "reauth_rate_limited"
  | "target_unavailable";

function previewPath(sessionId: string, attendeeUserId: string): string {
  return `/wepacker/mentor/sessions/${encodeURIComponent(sessionId)}/preview/${encodeURIComponent(attendeeUserId)}`;
}

function redirectToGateError(
  sessionId: string,
  attendeeUserId: string,
  error: GateError,
): never {
  redirect(`${previewPath(sessionId, attendeeUserId)}?error=${error}`);
}

function normalizedText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function parseReasonCode(
  value: FormDataEntryValue | null,
): SupportPreviewReasonCode | null {
  return typeof value === "string" &&
    SUPPORT_PREVIEW_REASON_CODES.has(value as SupportPreviewReasonCode)
    ? (value as SupportPreviewReasonCode)
    : null;
}

function logProjectionAccess(input: {
  actorId: string;
  targetUserId: string;
  sessionId: string;
  accessMode: "organizer" | "admin_support";
}): void {
  // Operational logs remain content-free. Admin access also writes the
  // application-enforced audit event inside the authorization transaction.
  console.info("[wepacker:support-preview] projection_accessed", {
    actorId: input.actorId,
    targetUserId: input.targetUserId,
    resourceType: "session",
    resourceId: input.sessionId,
    projection: "attendee_safe",
    accessMode: input.accessMode,
  });
}

// Admin-only metadata discovery. It deliberately omits email, phone, meeting
// URL, notes, Transcript and Debrief data. The role is checked again inside
// the transaction so a stale account capability cannot authorize the list.
export async function getAdminSessionAttendeePreviewIndex() {
  const actor = await requireRole(["admin"]);
  return prisma.$transaction(async (tx) => {
    const currentAdmin = await tx.user.findFirst({
      where: { id: actor.id, role: "admin" },
      select: { id: true },
    });
    if (!currentAdmin) throw new Error("Sem permissão.");

    const sessions = await tx.session.findMany({
      select: {
        id: true,
        scheduledAt: true,
        kind: true,
        status: true,
        organizer: { select: { id: true, name: true } },
        attendees: {
          select: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });

    return sessions.flatMap((session) => {
      const attendeeCount = session.attendees.length;
      const format = attendeeCount === 1 ? "individual" : "group";
      return session.attendees.map((attendee) => ({
        sessionId: session.id,
        scheduledAt: session.scheduledAt,
        kind: session.kind,
        status: session.status,
        attendeeCount,
        format,
        organizer: session.organizer,
        attendee: attendee.user,
      }));
    });
  });
}

// Creates a short-lived Admin support grant. Password and raw ticket reference
// never leave process memory. Denials are content-free and rate-limited per
// real actor under a PostgreSQL transaction advisory lock.
export async function createAdminSessionAttendeePreviewGrant(
  sessionId: string,
  attendeeUserId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireRole(["admin"]);
  const reasonCode = parseReasonCode(formData.get("reasonCode"));
  const ticketReference = normalizedText(formData.get("ticketReference"));
  const passwordEntry = formData.get("password");
  const password = typeof passwordEntry === "string" ? passwordEntry : "";

  if (
    !reasonCode ||
    !TICKET_REFERENCE_PATTERN.test(ticketReference) ||
    password.length === 0 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    redirectToGateError(sessionId, attendeeUserId, "invalid_request");
  }

  const ticketReferenceDigest = digestSupportTicketReference(ticketReference);
  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actor.id}, 0))`;

    const now = new Date();
    const failureCutoff = new Date(now.getTime() - REAUTH_FAILURE_WINDOW_MS);
    const actorRecord = await tx.user.findUnique({
      where: { id: actor.id },
      select: { passwordHash: true, role: true },
    });
    if (!actorRecord || actorRecord.role !== "admin") {
      return { status: "reauth_failed" as const };
    }

    const recentFailures = await tx.supportPreviewAuditEvent.count({
      where: {
        actorId: actor.id,
        type: "reauth_denied",
        createdAt: { gte: failureCutoff },
      },
    });
    if (recentFailures >= MAX_REAUTH_FAILURES) {
      const alreadyAudited = await tx.supportPreviewAuditEvent.findFirst({
        where: {
          actorId: actor.id,
          type: "reauth_rate_limited",
          createdAt: { gte: failureCutoff },
        },
        select: { id: true },
      });
      if (!alreadyAudited) {
        await tx.supportPreviewAuditEvent.create({
          data: {
            actorId: actor.id,
            reasonCode,
            type: "reauth_rate_limited",
          },
          select: { id: true },
        });
      }
      return { status: "reauth_rate_limited" as const };
    }

    let passwordIsValid = false;
    if (actorRecord.passwordHash) {
      try {
        passwordIsValid = await compare(password, actorRecord.passwordHash);
      } catch {
        passwordIsValid = false;
      }
    }
    if (!passwordIsValid) {
      await tx.supportPreviewAuditEvent.create({
        data: {
          actorId: actor.id,
          reasonCode,
          type: "reauth_denied",
        },
        select: { id: true },
      });
      return { status: "reauth_failed" as const };
    }

    const target = await tx.session.findFirst({
      where: {
        id: sessionId,
        organizerId: { not: actor.id },
        attendees: { some: { userId: attendeeUserId } },
      },
      select: { id: true },
    });
    if (!target) return { status: "target_unavailable" as const };

    const expiresAt = new Date(now.getTime() + ADMIN_PREVIEW_TTL_MS);
    const created = await tx.supportPreviewGrant.create({
      data: {
        actorId: actor.id,
        targetUserId: attendeeUserId,
        sessionId,
        reasonCode,
        ticketReferenceDigest,
        reauthenticatedAt: now,
        expiresAt,
      },
      select: { id: true },
    });
    await tx.supportPreviewAuditEvent.create({
      data: {
        grantId: created.id,
        actorId: actor.id,
        targetUserId: attendeeUserId,
        sessionId,
        reasonCode,
        type: "grant_created",
      },
      select: { id: true },
    });
    return {
      status: "created" as const,
      grantId: created.id,
      expiresAt,
    };
  });

  if (outcome.status === "reauth_failed") {
    redirectToGateError(sessionId, attendeeUserId, "reauth_failed");
  }
  if (outcome.status === "reauth_rate_limited") {
    redirectToGateError(sessionId, attendeeUserId, "reauth_rate_limited");
  }
  if (outcome.status === "target_unavailable") {
    redirectToGateError(sessionId, attendeeUserId, "target_unavailable");
  }

  await setAdminSupportPreviewCookie({
    grantId: outcome.grantId,
    sessionId,
    targetUserId: attendeeUserId,
    expiresAt: outcome.expiresAt,
  });
  redirect(previewPath(sessionId, attendeeUserId));
}

// Revokes only the exact cookie-bound grant owned by the still-current Admin.
// The capability identifier is never put in a URL, form or operational log.
export async function revokeAdminSessionAttendeePreviewGrant(
  sessionId: string,
  attendeeUserId: string,
): Promise<void> {
  const actor = await requireRole(["admin"]);
  const grantId = await getAdminSupportPreviewGrantFromCookie(
    sessionId,
    attendeeUserId,
  );

  if (grantId && grantId.length <= MAX_GRANT_ID_LENGTH) {
    await prisma.$transaction(async (tx) => {
      const currentAdmin = await tx.user.findFirst({
        where: { id: actor.id, role: "admin" },
        select: { id: true },
      });
      if (!currentAdmin) return;

      const grant = await tx.supportPreviewGrant.findFirst({
        where: {
          id: grantId,
          actorId: actor.id,
          targetUserId: attendeeUserId,
          sessionId,
          revokedAt: null,
        },
        select: {
          id: true,
          targetUserId: true,
          sessionId: true,
          reasonCode: true,
        },
      });
      if (!grant) return;

      const revoked = await tx.supportPreviewGrant.updateMany({
        where: {
          id: grant.id,
          actorId: actor.id,
          targetUserId: attendeeUserId,
          sessionId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) return;

      await tx.supportPreviewAuditEvent.create({
        data: {
          grantId: grant.id,
          actorId: actor.id,
          targetUserId: grant.targetUserId,
          sessionId: grant.sessionId,
          reasonCode: grant.reasonCode,
          type: "grant_revoked",
        },
        select: { id: true },
      });
    });
  }

  await clearAdminSupportPreviewCookie(sessionId, attendeeUserId);
  redirect(ADMIN_SUPPORT_PREVIEW_PATH);
}

// Organizer access is the existing exact-resource capability, irrespective of
// account role. Admin support is a separate fallback that requires the fresh,
// signed, actor-bound grant and uses its own stricter select.
export async function getSessionAttendeeSupportProjection(
  sessionId: string,
  attendeeUserId: string,
  adminGrantId?: string,
) {
  const actor = await requireUser();
  const organizerSession = await prisma.session.findFirst({
    where: { id: sessionId, organizerId: actor.id },
    select: { id: true },
  });

  if (organizerSession) {
    const preview = await getSessionAttendeePreview(sessionId, attendeeUserId);
    if (!preview) return null;
    logProjectionAccess({
      actorId: preview.viewer.id,
      targetUserId: preview.attendee.id,
      sessionId: preview.session.id,
      accessMode: "organizer",
    });
    return {
      ...preview,
      accessMode: "organizer" as const,
      accessExpiresAt: null,
    };
  }

  if (
    actor.role !== "admin" ||
    !adminGrantId ||
    adminGrantId.length > MAX_GRANT_ID_LENGTH
  ) {
    return null;
  }

  const now = new Date();
  const reauthenticationCutoff = new Date(now.getTime() - ADMIN_PREVIEW_TTL_MS);
  const preview = await prisma.$transaction(async (tx) => {
    const currentAdmin = await tx.user.findFirst({
      where: { id: actor.id, role: "admin" },
      select: { id: true, name: true },
    });
    if (!currentAdmin) return null;

    const grant = await tx.supportPreviewGrant.findFirst({
      where: {
        id: adminGrantId,
        actorId: actor.id,
        targetUserId: attendeeUserId,
        sessionId,
        revokedAt: null,
        expiresAt: { gt: now },
        reauthenticatedAt: { gte: reauthenticationCutoff },
      },
      select: { id: true, expiresAt: true, reasonCode: true },
    });
    if (!grant) return null;

    const session = await tx.session.findFirst({
      where: {
        id: sessionId,
        organizerId: { not: actor.id },
        attendees: { some: { userId: attendeeUserId } },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        kind: true,
        status: true,
        organizer: { select: { id: true, name: true } },
        attendees: {
          where: { userId: attendeeUserId },
          select: {
            outcome: true,
            sharedNote: true,
            sharedNotePublished: true,
            user: { select: { id: true, name: true } },
          },
        },
        _count: { select: { attendees: true } },
      },
    });
    const attendee = session?.attendees[0];
    if (!session || !attendee) return null;

    await tx.supportPreviewAuditEvent.create({
      data: {
        grantId: grant.id,
        actorId: actor.id,
        targetUserId: attendee.user.id,
        sessionId: session.id,
        reasonCode: grant.reasonCode,
        type: "projection_accessed",
      },
      select: { id: true },
    });

    const attendeeCount = session._count.attendees;
    return {
      viewer: currentAdmin,
      attendee: attendee.user,
      session: {
        id: session.id,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
        attendeeCount,
        format: attendeeCount === 1 ? ("individual" as const) : ("group" as const),
        kind: session.kind,
        status: session.status,
        organizerName: session.organizer.name,
        outcome: attendee.outcome,
        sharedNote: attendee.sharedNotePublished ? attendee.sharedNote : null,
        // Meeting URLs are attendee-safe in the normal product but omitted
        // from Admin support projections to keep break-glass scope minimal.
        meetingUrl: null,
      },
      accessMode: "admin_support" as const,
      accessExpiresAt: grant.expiresAt,
    };
  });

  if (preview) {
    logProjectionAccess({
      actorId: preview.viewer.id,
      targetUserId: preview.attendee.id,
      sessionId: preview.session.id,
      accessMode: "admin_support",
    });
  }
  return preview;
}
