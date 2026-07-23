"use server";

import { randomUUID } from "node:crypto";
import type {
  Prisma,
  SessionConsentDecision,
  SessionConsentPurpose,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/wepacker/guards";
import {
  consentPolicyVersion,
  hubTranscriptionConfig,
  jitsiJwtConfig,
  jitsiJwtEnabled,
  retentionDeadline,
  sessionMediaEnabled,
  sessionMediaPresenceMaxAgeSeconds,
  sessionRecordingEnabled,
  sessionRecordingMaxMinutes,
  sessionTranscriptionEnabled,
} from "@/lib/wepacker/session-media/config";
import {
  canonicalRoomFromMeetingUrl,
  newOpaqueId,
  signJitsiRoomToken,
} from "@/lib/wepacker/session-media/security";
import {
  eraseSessionRecordingsAfterWithdrawal,
  eraseSessionTranscriptsAfterWithdrawal,
} from "@/lib/wepacker/session-media/retention";

const CAPACITY_EVIDENCE = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/;
const PARTICIPANT_PRESENCE_MAX = 2;

type Tx = Prisma.TransactionClient;

async function lockSession(tx: Tx, sessionId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`session-media:${sessionId}`}, 0))`;
}

async function exactParticipant(
  tx: Tx,
  sessionId: string,
  userId: string,
) {
  const session = await tx.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      organizerId: true,
      meetingUrl: true,
      durationMinutes: true,
      scheduledAt: true,
      status: true,
      attendees: { select: { id: true, userId: true } },
    },
  });
  if (!session) throw new Error("Session not found.");
  if (
    session.organizerId !== userId &&
    !session.attendees.some((attendee) => attendee.userId === userId)
  ) {
    throw new Error("Permission denied.");
  }
  return session;
}

async function latestCapacity(
  tx: Tx,
  sessionId: string,
  subjectUserId: string,
) {
  return tx.sessionConsentCapacityAssurance.findFirst({
    where: { sessionId, subjectUserId },
    orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
  });
}

async function latestConsent(
  tx: Tx,
  sessionId: string,
  subjectUserId: string,
  purpose: SessionConsentPurpose,
) {
  return tx.sessionConsentEvent.findFirst({
    where: { sessionId, subjectUserId, purpose },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });
}

async function requireGrantedPurposes(
  tx: Tx,
  sessionId: string,
  participantIds: string[],
  purposes: SessionConsentPurpose[],
) {
  for (const subjectUserId of participantIds) {
    const capacity = await latestCapacity(tx, sessionId, subjectUserId);
    if (
      capacity?.status !== "adult_verified" ||
      capacity.policyVersion !== consentPolicyVersion()
    ) {
      throw new Error("Adult capacity must be verified for every participant.");
    }
    for (const purpose of purposes) {
      const consent = await latestConsent(
        tx,
        sessionId,
        subjectUserId,
        purpose,
      );
      if (
        consent?.decision !== "granted" ||
        consent.policyVersion !== consentPolicyVersion() ||
        consent.capacityAssuranceId !== capacity.id
      ) {
        throw new Error(`Explicit ${purpose} consent is required from everyone.`);
      }
    }
  }
}

async function currentMediaConsentGranted(
  tx: Tx,
  sessionId: string,
  purpose: "recording" | "transcription",
): Promise<boolean> {
  const session = await tx.session.findUnique({
    where: { id: sessionId },
    select: {
      organizerId: true,
      attendees: { select: { userId: true } },
    },
  });
  if (!session || session.attendees.length !== 1) return false;
  for (const subjectUserId of [
    session.organizerId,
    session.attendees[0].userId,
  ]) {
    const capacity = await latestCapacity(tx, sessionId, subjectUserId);
    const consent = await latestConsent(
      tx,
      sessionId,
      subjectUserId,
      purpose,
    );
    if (
      capacity?.status !== "adult_verified" ||
      consent?.decision !== "granted" ||
      consent.capacityAssuranceId !== capacity.id ||
      capacity.policyVersion !== consentPolicyVersion() ||
      consent.policyVersion !== consentPolicyVersion()
    ) {
      return false;
    }
  }
  return true;
}

export async function verifySessionParticipantAdultCapacity(input: {
  sessionId: string;
  subjectUserId: string;
  evidenceRef: string;
  idempotencyKey?: string;
}) {
  const admin = await requireAdmin();
  if (!CAPACITY_EVIDENCE.test(input.evidenceRef)) {
    throw new Error("Invalid opaque evidence reference.");
  }
  const policyVersion = consentPolicyVersion();
  const idempotencyKey =
    input.idempotencyKey ?? newOpaqueId("capacity-adult");
  return prisma.$transaction(async (tx) => {
    await lockSession(tx, input.sessionId);
    await exactParticipant(tx, input.sessionId, input.subjectUserId);
    const existing = await tx.sessionConsentCapacityAssurance.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;
    return tx.sessionConsentCapacityAssurance.create({
      data: {
        sessionId: input.sessionId,
        subjectUserId: input.subjectUserId,
        status: "adult_verified",
        evidenceRef: input.evidenceRef,
        policyVersion,
        verifiedAt: new Date(),
        verifiedByUserId: admin.id,
        idempotencyKey,
      },
    });
  });
}

export async function invalidateSessionParticipantCapacity(input: {
  sessionId: string;
  subjectUserId: string;
  idempotencyKey?: string;
}) {
  const admin = await requireAdmin();
  const idempotencyKey =
    input.idempotencyKey ?? newOpaqueId("capacity-invalidated");
  return prisma.$transaction(async (tx) => {
    await lockSession(tx, input.sessionId);
    await exactParticipant(tx, input.sessionId, input.subjectUserId);
    const existing = await tx.sessionConsentCapacityAssurance.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;
    return tx.sessionConsentCapacityAssurance.create({
      data: {
        sessionId: input.sessionId,
        subjectUserId: input.subjectUserId,
        status: "unknown",
        evidenceRef: null,
        policyVersion: consentPolicyVersion(),
        verifiedAt: new Date(),
        verifiedByUserId: admin.id,
        idempotencyKey,
      },
    });
  });
}

export async function recordMySessionConsent(input: {
  sessionId: string;
  purpose: SessionConsentPurpose;
  decision: SessionConsentDecision;
  idempotencyKey?: string;
}) {
  if (!sessionMediaEnabled()) throw new Error("Session media is disabled.");
  const actor = await requireUser();
  if (!["recording", "transcription", "ai_debrief"].includes(input.purpose)) {
    throw new Error("Invalid consent purpose.");
  }
  if (!["granted", "denied", "withdrawn"].includes(input.decision)) {
    throw new Error("Invalid consent decision.");
  }
  const idempotencyKey = input.idempotencyKey ?? newOpaqueId("consent");
  const result = await prisma.$transaction(async (tx) => {
    await lockSession(tx, input.sessionId);
    await exactParticipant(tx, input.sessionId, actor.id);
    const existing = await tx.sessionConsentEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;
    const capacity = await latestCapacity(tx, input.sessionId, actor.id);
    if (
      capacity?.status !== "adult_verified" ||
      capacity.policyVersion !== consentPolicyVersion()
    ) {
      throw new Error("Adult capacity is not currently verified.");
    }
    const event = await tx.sessionConsentEvent.create({
      data: {
        sessionId: input.sessionId,
        subjectUserId: actor.id,
        actorUserId: actor.id,
        purpose: input.purpose,
        decision: input.decision,
        policyVersion: consentPolicyVersion(),
        capacityAssuranceId: capacity.id,
        idempotencyKey,
        occurredAt: new Date(),
      },
    });
    await tx.sessionArtifactAuditEvent.create({
      data: {
        sessionId: input.sessionId,
        actorUserId: actor.id,
        subjectUserId: actor.id,
        type: "consent_recorded",
        resourceId: event.id,
        reasonCode: `${input.purpose}:${input.decision}`,
      },
    });
    return event;
  });

  if (
    input.decision !== "granted" &&
    (input.purpose === "recording" || input.purpose === "transcription")
  ) {
    await stopActiveRecordingAfterWithdrawal(input.sessionId);
    // Recording and STT are started as one operation. Withdrawing either
    // purpose stops that operation and erases its raw source.
    await eraseSessionRecordingsAfterWithdrawal(input.sessionId);
    if (input.purpose === "transcription") {
      const providerIds = await eraseSessionTranscriptsAfterWithdrawal(
        input.sessionId,
      );
      for (const providerId of providerIds) {
        try {
          const config = hubTranscriptionConfig();
          await fetch(
            `${config.url.replace(/\/+$/, "")}/media_transcriptions/${providerId}`,
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
          // The Hub enforces a hard source deadline; a retry worker/runbook
          // reconciles transient deletion failures without exposing content.
        }
      }
    }
  }
  revalidatePath(`/wepacker/sessions/${input.sessionId}`);
  revalidatePath(`/wepacker/mentor/sessions/${input.sessionId}`);
  return result;
}

async function stopActiveRecordingAfterWithdrawal(sessionId: string) {
  await prisma.sessionRecording.updateMany({
    where: {
      sessionId,
      status: { in: ["requested", "recording"] },
    },
    data: {
      status: "finalizing",
      stoppedAt: new Date(),
      failureCode: "consent_withdrawn",
    },
  });
}

export async function reportMySessionCallPresence(
  sessionId: string,
  state: "joined" | "heartbeat" | "left",
) {
  const actor = await requireUser();
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await exactParticipant(tx, sessionId, actor.id);
    if (state === "left") {
      await tx.sessionCallPresence.updateMany({
        where: { sessionId, userId: actor.id },
        data: { lastSeenAt: now, leftAt: now },
      });
      return { stopRequested: false };
    }
    await tx.sessionCallPresence.upsert({
      where: { sessionId_userId: { sessionId, userId: actor.id } },
      create: {
        sessionId,
        userId: actor.id,
        joinedAt: now,
        lastSeenAt: now,
      },
      update: {
        joinedAt: state === "joined" ? now : undefined,
        lastSeenAt: now,
        leftAt: null,
      },
    });
    const active = await tx.sessionRecording.findFirst({
      where: {
        sessionId,
        status: { in: ["requested", "recording", "finalizing"] },
      },
      select: { status: true },
    });
    const allowed =
      (await currentMediaConsentGranted(tx, sessionId, "recording")) &&
      (await currentMediaConsentGranted(tx, sessionId, "transcription"));
    return {
      stopRequested:
        active?.status === "finalizing" || (Boolean(active) && !allowed),
    };
  });
}

export async function getMyJitsiJoin(sessionId: string) {
  const actor = await requireUser();
  const jwtEnabled = jitsiJwtEnabled();
  const config = jwtEnabled
    ? jitsiJwtConfig()
    : {
        baseUrl:
          process.env.MEETING_BASE_URL?.trim() ||
          "https://meet.rvs.solutions",
      };
  const session = await prisma.$transaction((tx) =>
    exactParticipant(tx, sessionId, actor.id),
  );
  const room = canonicalRoomFromMeetingUrl(session.meetingUrl, config.baseUrl);
  return {
    room,
    baseUrl: config.baseUrl,
    token: jwtEnabled
      ? signJitsiRoomToken({
          ...jitsiJwtConfig(),
          room,
          userId: actor.id,
          displayName: actor.name,
          moderator: session.organizerId === actor.id,
          sessionEndsAt: new Date(
            session.scheduledAt.getTime() + session.durationMinutes * 60_000,
          ),
        })
      : null,
    isOrganizer: session.organizerId === actor.id,
  };
}

export async function getMySessionCallView(sessionId: string) {
  const actor = await requireUser();
  return prisma.$transaction(async (tx) => {
    const session = await exactParticipant(tx, sessionId, actor.id);
    const capacity = await latestCapacity(tx, sessionId, actor.id);
    const consent = await Promise.all(
      (["recording", "transcription", "ai_debrief"] as const).map(
        async (purpose) => {
          const event = await latestConsent(tx, sessionId, actor.id, purpose);
          return [purpose, event?.decision ?? null] as const;
        },
      ),
    );
    const activeRecording = await tx.sessionRecording.findFirst({
      where: {
        sessionId,
        status: { in: ["requested", "recording", "finalizing"] },
      },
      select: { id: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      id: session.id,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      isOrganizer: session.organizerId === actor.id,
      capacity: capacity?.status ?? "unknown",
      consent: Object.fromEntries(consent) as Record<
        SessionConsentPurpose,
        SessionConsentDecision | null
      >,
      activeRecording,
    };
  });
}

export async function startSessionRecording(
  sessionId: string,
): Promise<{ recordingId: string; status: "requested" | "recording" }> {
  if (!sessionRecordingEnabled() || !sessionTranscriptionEnabled()) {
    throw new Error("Recording and transcription are not both enabled.");
  }
  const actor = await requireUser();
  const config = jitsiJwtConfig();
  const created = await prisma.$transaction(async (tx) => {
    await lockSession(tx, sessionId);
    const session = await exactParticipant(tx, sessionId, actor.id);
    if (session.organizerId !== actor.id) throw new Error("Permission denied.");
    if (
      session.attendees.length !== 1 ||
      session.durationMinutes > sessionRecordingMaxMinutes()
    ) {
      throw new Error("Recording is limited to one attendee and 90 minutes.");
    }
    if (session.status !== "scheduled") {
      throw new Error("Only a scheduled Session can be recorded.");
    }
    const participants = [session.organizerId, session.attendees[0].userId];
    await requireGrantedPurposes(tx, sessionId, participants, [
      "recording",
      "transcription",
    ]);
    const cutoff = new Date(
      Date.now() - sessionMediaPresenceMaxAgeSeconds() * 1_000,
    );
    const present = await tx.sessionCallPresence.count({
      where: {
        sessionId,
        userId: { in: participants },
        lastSeenAt: { gte: cutoff },
        leftAt: null,
      },
    });
    if (present !== PARTICIPANT_PRESENCE_MAX) {
      throw new Error("Both exact participants must be present in the call.");
    }
    const existing = await tx.sessionRecording.findFirst({
      where: {
        sessionId,
        status: { in: ["requested", "recording", "finalizing"] },
      },
    });
    if (existing?.status === "finalizing") {
      throw new Error("Recording is stopping; wait for finalization.");
    }
    if (existing) return existing;
    const recordingId = `rec_${randomUUID().replace(/-/g, "")}`;
    const recording = await tx.sessionRecording.create({
      data: {
        sessionId,
        recordingId,
        canonicalRoom: canonicalRoomFromMeetingUrl(
          session.meetingUrl,
          config.baseUrl,
        ),
        requestedById: actor.id,
        requestIdempotencyKey: newOpaqueId("recording-request"),
        retainUntil: retentionDeadline("recording"),
      },
    });
    const consent = await tx.sessionConsentEvent.findMany({
      where: {
        sessionId,
        subjectUserId: { in: participants },
        purpose: "recording",
        decision: "granted",
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      distinct: ["subjectUserId"],
    });
    await tx.recordingConsentEvidence.createMany({
      data: consent.map((event) => ({
        recordingId: recording.id,
        consentEventId: event.id,
      })),
    });
    await tx.sessionArtifactAuditEvent.create({
      data: {
        sessionId,
        actorUserId: actor.id,
        type: "recording_requested",
        resourceId: recording.id,
      },
    });
    return recording;
  });

  if (created.status !== "requested") {
    return {
      recordingId: created.id,
      status: "recording",
    };
  }
  return { recordingId: created.id, status: "requested" };
}

export async function confirmSessionRecordingStarted(recordingId: string) {
  const actor = await requireUser();
  const recording = await prisma.sessionRecording.findUnique({
    where: { id: recordingId },
    include: { session: { select: { organizerId: true } } },
  });
  if (!recording || recording.session.organizerId !== actor.id) {
    throw new Error("Permission denied.");
  }
  const changed = await prisma.sessionRecording.updateMany({
    where: { id: recordingId, status: "requested" },
    data: { status: "recording", startedAt: new Date() },
  });
  if (changed.count === 1) {
    await prisma.sessionArtifactAuditEvent.create({
      data: {
        sessionId: recording.sessionId,
        actorUserId: actor.id,
        type: "recording_started",
        resourceId: recording.id,
      },
    });
  }
  return { confirmed: true };
}

export async function reportSessionRecordingCommandFailure(recordingId: string) {
  const actor = await requireUser();
  const recording = await prisma.sessionRecording.findUnique({
    where: { id: recordingId },
    include: { session: { select: { organizerId: true } } },
  });
  if (!recording || recording.session.organizerId !== actor.id) {
    throw new Error("Permission denied.");
  }
  await prisma.sessionRecording.updateMany({
    where: { id: recordingId, status: "requested" },
    data: {
      status: "failed",
      failedAt: new Date(),
      failureCode: "iframe_command_unconfirmed",
    },
  });
  return { failed: true };
}

export async function stopSessionRecording(sessionId: string) {
  const actor = await requireUser();
  const recording = await prisma.$transaction(async (tx) => {
    await lockSession(tx, sessionId);
    const session = await exactParticipant(tx, sessionId, actor.id);
    if (session.organizerId !== actor.id) throw new Error("Permission denied.");
    const active = await tx.sessionRecording.findFirst({
      where: {
        sessionId,
        status: { in: ["requested", "recording", "finalizing"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!active) return null;
    const changed = await tx.sessionRecording.updateMany({
      where: { id: active.id, status: { in: ["requested", "recording"] } },
      data: { status: "finalizing", stoppedAt: new Date() },
    });
    if (changed.count === 1) {
      await tx.sessionArtifactAuditEvent.create({
        data: {
          sessionId,
          actorUserId: actor.id,
          type: "recording_stopped",
          resourceId: active.id,
        },
      });
    }
    return active;
  });
  return { stopped: Boolean(recording) };
}

export async function getSessionMediaWorkspace(sessionId: string) {
  const actor = await requireUser();
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      organizerId: true,
      attendees: { select: { id: true, userId: true, user: { select: { name: true } } } },
      consentEvents: {
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        select: {
          subjectUserId: true,
          purpose: true,
          decision: true,
          occurredAt: true,
        },
      },
      consentCapacityAssurances: {
        orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
        select: { subjectUserId: true, status: true, verifiedAt: true },
      },
      recordings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          startedAt: true,
          stoppedAt: true,
          readyAt: true,
          failureCode: true,
          assets: {
            where: { status: "ready", deletedAt: null },
            select: { id: true, mimeType: true, durationSeconds: true },
          },
        },
      },
      transcriptArtifacts: {
        orderBy: { revision: "desc" },
        select: {
          id: true,
          status: true,
          revision: true,
          text: true,
          language: true,
          readyAt: true,
          failureCode: true,
        },
      },
      resultDocuments: {
        orderBy: { version: "desc" },
        select: {
          id: true,
          attendeeId: true,
          version: true,
          publishedAt: true,
          revokedAt: true,
        },
      },
    },
  });
  if (!session) throw new Error("Session not found.");
  if (session.organizerId !== actor.id) throw new Error("Permission denied.");
  return session;
}

export async function assertSessionPurposesGrantedForAll(
  sessionId: string,
  purposes: SessionConsentPurpose[],
): Promise<void> {
  const actor = await requireUser();
  await prisma.$transaction(async (tx) => {
    await lockSession(tx, sessionId);
    const session = await exactParticipant(tx, sessionId, actor.id);
    if (session.organizerId !== actor.id) throw new Error("Permission denied.");
    await requireGrantedPurposes(
      tx,
      sessionId,
      [session.organizerId, ...session.attendees.map(({ userId }) => userId)],
      purposes,
    );
  });
}
