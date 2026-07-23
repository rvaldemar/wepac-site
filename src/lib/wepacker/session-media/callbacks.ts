import { Prisma, type SessionRecordingStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import {
  callbackSecret,
  consentPolicyVersion,
  hubTranscriptionConfig,
  retentionDeadline,
  sessionTranscriptionEnabled,
} from "@/lib/wepacker/session-media/config";
import {
  assertCanonicalRoom,
  assertOpaqueId,
  assertSha256,
  safeRelativeObjectKey,
  sha256,
  verifyHubTranscriptionCallback,
  verifyJibriCallback,
} from "@/lib/wepacker/session-media/security";
import { openVerifiedRecording } from "@/lib/wepacker/session-media/storage";

export const MAX_CALLBACK_BYTES = 512 * 1024;
export const MAX_HUB_TRANSCRIPT_CHARS = 500_000;

export function validHubTranscriptContent(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= MAX_HUB_TRANSCRIPT_CHARS &&
    !value.includes("\0")
  );
}

export function assertRecordingMediaObjectKey(
  value: unknown,
  providerRecordingId: string,
): string {
  const key = safeRelativeObjectKey(value);
  const parts = key.split("/");
  if (
    parts.length !== 3 ||
    parts[0] !== "recordings" ||
    parts[1] !== providerRecordingId
  ) {
    throw new Error("Recording object key does not match its provider id.");
  }
  return key;
}

type Tx = Prisma.TransactionClient;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid callback body.");
  }
  return value as Record<string, unknown>;
}

export function validateRecordingMediaEnvelope(
  value: unknown,
  providerRecordingId: string,
): Array<Record<string, unknown>> {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error("Ready recording must contain audio and video.");
  }
  const media = value.map(record);
  const kinds = media.map((item) => String(item.kind)).sort();
  if (kinds[0] !== "audio" || kinds[1] !== "video") {
    throw new Error("Ready recording must contain unique audio and video.");
  }
  for (const item of media) {
    assertRecordingMediaObjectKey(item.object_key, providerRecordingId);
  }
  return media;
}

function boundedInteger(
  value: unknown,
  label: string,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > max
  ) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

function occurredAt(value: unknown): Date {
  if (typeof value !== "string") throw new Error("Invalid occurredAt.");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid occurredAt.");
  return date;
}

async function lockSession(tx: Tx, sessionId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`session-media:${sessionId}`}, 0))`;
}

async function assertNoConflictingReplay(
  tx: Tx,
  source: "jibri" | "hub_transcription",
  eventId: string,
  idempotencyKey: string,
  bodySha256: string,
): Promise<boolean> {
  const existing = await tx.sessionMediaCallbackEvent.findFirst({
    where: { OR: [{ idempotencyKey }, { source, eventId }] },
  });
  if (!existing) return false;
  if (
    existing.source !== source ||
    existing.eventId !== eventId ||
    existing.idempotencyKey !== idempotencyKey ||
    existing.bodySha256 !== bodySha256
  ) {
    throw new Error("Conflicting callback replay.");
  }
  return true;
}

function nextRecordingStatus(
  current: SessionRecordingStatus,
  event: string,
): SessionRecordingStatus {
  const allowed: Record<SessionRecordingStatus, string[]> = {
    requested: ["started", "stopped", "ready", "failed"],
    recording: ["stopped", "ready", "failed"],
    finalizing: ["ready", "failed", "deleted"],
    ready: ["deleted"],
    failed: ["deleted"],
    deleted: [],
  };
  if (!allowed[current].includes(event)) return current;
  return {
    started: "recording",
    stopped: "finalizing",
    ready: "ready",
    failed: "failed",
    deleted: "deleted",
  }[event] as SessionRecordingStatus;
}

async function currentConsentGranted(
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
  for (const userId of [
    session.organizerId,
    session.attendees[0].userId,
  ]) {
    const capacity = await tx.sessionConsentCapacityAssurance.findFirst({
      where: { sessionId, subjectUserId: userId },
      orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
    });
    const consent = await tx.sessionConsentEvent.findFirst({
      where: { sessionId, subjectUserId: userId, purpose },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    });
    if (
      capacity?.status !== "adult_verified" ||
      consent?.decision !== "granted" ||
      consent.capacityAssuranceId !== capacity.id ||
      consent.policyVersion !== capacity.policyVersion ||
      capacity.policyVersion !== consentPolicyVersion()
    ) {
      return false;
    }
  }
  return true;
}

async function submitTranscriptionToHub(input: {
  asset: {
    objectKey: string;
    sha256: string;
    bytes: bigint;
    durationSeconds: number;
    mimeType: string;
  };
  idempotencyKey: string;
  externalRef: string;
}): Promise<string> {
  const config = hubTranscriptionConfig();
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) throw new Error("APP_URL is required.");
  const handle = await openVerifiedRecording(input.asset);
  const boundary = `wepac-${randomBytes(18).toString("hex")}`;
  const field = (name: string, value: string) =>
    `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
  const prefix = [
    field("duration_seconds", String(input.asset.durationSeconds)),
    field("language", process.env.SESSION_TRANSCRIPTION_LANGUAGE?.trim() || "pt"),
    field("external_ref", input.externalRef),
    field(
      "callback_url",
      `${appUrl.replace(/\/+$/, "")}/api/wepacker/session-media/callbacks/hub`,
    ),
    field("callback_secret", callbackSecret("hub_transcription")),
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="session-audio"\r\nContent-Type: ${input.asset.mimeType}\r\n\r\n`,
  ].join("");
  const suffix = `\r\n--${boundary}--\r\n`;
  const body = Readable.from(
    (async function* () {
      yield Buffer.from(prefix);
      for await (const chunk of handle.createReadStream({ autoClose: true })) {
        yield chunk;
      }
      yield Buffer.from(suffix);
    })(),
  );
  const response = await fetch(
    `${config.url.replace(/\/+$/, "")}/media_transcriptions`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "content-length": String(
          Buffer.byteLength(prefix) +
            Number(input.asset.bytes) +
            Buffer.byteLength(suffix),
        ),
        "x-hub-contract-version": config.contractVersion,
        "idempotency-key": input.idempotencyKey,
      },
      body: body as unknown as BodyInit,
      duplex: "half",
      signal: AbortSignal.timeout(30_000),
    } as RequestInit & { duplex: "half" },
  );
  const responseBody = (await response.json().catch(() => null)) as {
    data?: { id?: string; state?: string };
  } | null;
  const providerId = responseBody?.data?.id;
  if (!response.ok || typeof providerId !== "string") {
    throw new Error("Hub did not durably accept transcription.");
  }
  return assertOpaqueId(providerId, "Hub transcription id");
}

async function acknowledgeAndEraseHubTranscription(input: {
  hubBase: string;
  headers: Record<string, string>;
  localTerminal: boolean;
}): Promise<Date> {
  const ack = await fetch(`${input.hubBase}/acknowledge`, {
    method: "POST",
    headers: input.headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (
    !ack.ok &&
    !(input.localTerminal && [409, 422].includes(ack.status))
  ) {
    throw new Error("Hub acknowledgement failed.");
  }
  const erased = await fetch(input.hubBase, {
    method: "DELETE",
    headers: input.headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!erased.ok && erased.status !== 404) {
    throw new Error("Hub erasure failed.");
  }
  return new Date();
}

export async function processJibriCallback(
  request: Request,
  rawBody: string,
): Promise<void> {
  const evidence = verifyJibriCallback(
    request,
    rawBody,
    callbackSecret("jibri"),
  );
  const body = record(JSON.parse(rawBody));
  if (body.schema_version !== "1") {
    throw new Error("Unsupported callback body schema.");
  }
  const eventId = assertOpaqueId(body.event_id, "event id");
  const providerRecordingId = assertOpaqueId(
    body.recording_id,
    "provider recording id",
  );
  const canonicalRoom = assertCanonicalRoom(body.canonical_room);
  if (!/^wepac-[0-9a-f]{16}$/.test(canonicalRoom)) {
    throw new Error("Invalid canonical recording room.");
  }
  const event = {
    "recording.ready": "ready",
    "recording.failed": "failed",
    "recording.deleted": "deleted",
  }[String(body.event_type)];
  if (!event) {
    throw new Error("Invalid recording event.");
  }
  const sequence: number = event === "deleted" ? 2 : 1;
  const eventAt = occurredAt(body.occurred_at);
  const media =
    event === "ready"
      ? validateRecordingMediaEnvelope(body.media, providerRecordingId)
      : [];

  await prisma.$transaction(
    async (tx) => {
      let recording = await tx.sessionRecording.findUnique({
        where: { providerRecordingId },
      });
      if (!recording) {
        const candidates = await tx.sessionRecording.findMany({
          where: {
            canonicalRoom,
            providerRecordingId: null,
            status: {
              in: ["requested", "recording", "finalizing", "deleted"],
            },
            createdAt: { gte: new Date(Date.now() - 2 * 60 * 60_000) },
          },
          take: 2,
        });
        if (candidates.length !== 1) {
          throw new Error("Provider recording cannot be bound uniquely.");
        }
        await lockSession(tx, candidates[0].sessionId);
        const bound = await tx.sessionRecording.updateMany({
          where: {
            id: candidates[0].id,
            providerRecordingId: null,
            canonicalRoom,
          },
          data: { providerRecordingId },
        });
        if (bound.count !== 1) throw new Error("Recording bind race.");
        recording = {
          ...candidates[0],
          providerRecordingId,
        };
      } else {
        await lockSession(tx, recording.sessionId);
      }
      if (recording.canonicalRoom !== canonicalRoom) {
        throw new Error("Recording room mismatch.");
      }

      const replay = await assertNoConflictingReplay(
        tx,
        "jibri",
        eventId,
        evidence.idempotencyKey,
        evidence.bodySha256,
      );
      if (replay) return;
      if (sequence <= recording.lastSequence) {
        throw new Error("Non-monotonic recording callback.");
      }

      const discardedAfterWithdrawal =
        event === "ready" &&
        (recording.status === "deleted" ||
          recording.failureCode === "consent_withdrawn");
      if (discardedAfterWithdrawal) {
        await tx.sessionRecording.update({
          where: { id: recording.id },
          data: {
            lastSequence: sequence,
            lastEventAt: eventAt,
          },
        });
        await tx.sessionMediaCallbackEvent.create({
          data: {
            source: "jibri",
            eventId,
            idempotencyKey: evidence.idempotencyKey,
            bodySha256: evidence.bodySha256,
            occurredAt: eventAt,
          },
        });
        return;
      }

      const status = nextRecordingStatus(recording.status, event);
      if (
        status === recording.status &&
        !(event === "deleted" && recording.status === "deleted")
      ) {
        throw new Error("Invalid recording state transition.");
      }
      await tx.sessionRecording.update({
        where: { id: recording.id },
        data: {
          status,
          lastSequence: sequence,
          lastEventAt: eventAt,
          startedAt: event === "started" ? eventAt : undefined,
          stoppedAt: event === "stopped" ? eventAt : undefined,
          readyAt: event === "ready" ? eventAt : undefined,
          failedAt: event === "failed" ? eventAt : undefined,
          failureCode:
            event === "failed"
              ? assertOpaqueId(
                  body.error_code ?? "provider_failed",
                  "failure code",
                )
              : undefined,
          deletedAt: event === "deleted" ? eventAt : undefined,
        },
      });
      if (event === "deleted") {
        await tx.recordingAsset.updateMany({
          where: { recordingId: recording.id, deletedAt: null },
          data: {
            status: "deleted",
            objectKey: null,
            sha256: null,
            bytes: null,
            durationSeconds: null,
            mimeType: null,
            deletedAt: eventAt,
          },
        });
      }

      let recordingAsset:
        | {
            id: string;
            objectKey: string;
            sha256: string;
            bytes: bigint;
            durationSeconds: number;
            mimeType: string;
          }
        | null = null;
      let totalMediaBytes = 0;
      for (const item of media) {
        if (!["audio", "video"].includes(String(item.kind))) {
          throw new Error("Invalid recording media kind.");
        }
        const objectKey = assertRecordingMediaObjectKey(
          item.object_key,
          providerRecordingId,
        );
        const digest = assertSha256(item.sha256);
        const bytes = boundedInteger(
          item.bytes,
          "asset bytes",
          item.kind === "audio" ? 128 * 1024 ** 2 : 4 * 1024 ** 3,
        );
        totalMediaBytes += bytes;
        if (totalMediaBytes > 4 * 1024 ** 3 + 128 * 1024 ** 2) {
          throw new Error("Recording media exceeds total size limit.");
        }
        const durationSeconds = boundedInteger(
          item.duration_seconds,
          "duration",
          90 * 60 + 15,
        );
        if (
          typeof item.mime_type !== "string" ||
          !/^(?:audio|video)\/[a-z0-9.+-]{1,80}$/i.test(item.mime_type)
        ) {
          throw new Error("Invalid recording mime type.");
        }
        const row = await tx.recordingAsset.upsert({
          where: { objectKey },
          create: {
            id: `asset:${recording.id}:${digest.slice(0, 32)}`,
            recordingId: recording.id,
            status: "ready",
            objectKey,
            sha256: digest,
            bytes: BigInt(bytes),
            durationSeconds,
            mimeType: item.mime_type,
            readyAt: eventAt,
            retainUntil: retentionDeadline("recording", eventAt),
          },
          update: {},
        });
        if (
          row.recordingId !== recording.id ||
          row.sha256 !== digest ||
          row.bytes !== BigInt(bytes)
        ) {
          throw new Error("Conflicting recording asset replay.");
        }
        if (item.kind === "audio") {
          recordingAsset = {
            id: row.id,
            objectKey,
            sha256: digest,
            bytes: BigInt(bytes),
            durationSeconds,
            mimeType: item.mime_type,
          };
        }
      }

      // READY is acknowledged only after Hub durably accepts the stable
      // transcription job. Keeping the DB lock across this bounded request
      // serializes consent withdrawal with dispatch.
      if (event === "ready") {
        if (!recordingAsset) throw new Error("Ready recording has no audio.");
        if (
          !sessionTranscriptionEnabled() ||
          !(await currentConsentGranted(tx, recording.sessionId, "recording")) ||
          !(await currentConsentGranted(tx, recording.sessionId, "transcription"))
        ) {
          throw new Error("Transcription consent is not current.");
        }
        const revision =
          (
            await tx.transcriptArtifact.aggregate({
              where: { sessionId: recording.sessionId },
              _max: { revision: true },
            })
          )._max.revision ?? 0;
        const transcript = await tx.transcriptArtifact.upsert({
          where: { idempotencyKey: `recording:${recordingAsset.id}` },
          create: {
            id: `transcript:${recording.id}:${recordingAsset.sha256.slice(0, 32)}`,
            sessionId: recording.sessionId,
            recordingAssetId: recordingAsset.id,
            source: "recording",
            status: "pending",
            revision: revision + 1,
            idempotencyKey: `recording:${recordingAsset.id}`,
            retainUntil: retentionDeadline("transcript", eventAt),
          },
          update: {},
        });
        const providerTranscriptId = await submitTranscriptionToHub({
          asset: recordingAsset,
          idempotencyKey: transcript.idempotencyKey,
          externalRef: `wm_${sha256(transcript.id).slice(0, 40)}`,
        });
        await tx.transcriptArtifact.update({
          where: { id: transcript.id },
          data: {
            status: "processing",
            providerTranscriptId,
          },
        });
      }

      await tx.sessionMediaCallbackEvent.create({
        data: {
          source: "jibri",
          eventId,
          idempotencyKey: evidence.idempotencyKey,
          bodySha256: evidence.bodySha256,
          occurredAt: eventAt,
        },
      });
    },
    { timeout: 45_000 },
  );
}

export async function processHubTranscriptionCallback(
  request: Request,
  rawBody: string,
): Promise<void> {
  const evidence = verifyHubTranscriptionCallback(
    request,
    rawBody,
    callbackSecret("hub_transcription"),
  );
  const body = record(JSON.parse(rawBody));
  if (
    body.contract_version !== "media-transcription.v1" ||
    body.event_id !== evidence.eventId ||
    body.transcription_id !== evidence.transcriptionId
  ) {
    throw new Error("Hub receipt/header mismatch.");
  }
  const sequence = boundedInteger(body.sequence, "sequence", 1_000_000);
  const eventAt = occurredAt(body.occurred_at);
  const status = String(body.state);
  const event = String(body.event);
  if (
    !["ready", "failed", "deleted"].includes(status) ||
    event !== `media_transcription.${status}`
  ) {
    throw new Error("Invalid transcription status.");
  }

  const transcript = await prisma.transcriptArtifact.findUnique({
    where: { providerTranscriptId: evidence.transcriptionId },
    include: { recordingAsset: { select: { sha256: true } } },
  });
  if (!transcript) throw new Error("Unknown transcription.");
  const existing = await prisma.sessionMediaCallbackEvent.findFirst({
    where: {
      OR: [
        { idempotencyKey: evidence.idempotencyKey },
        { source: "hub_transcription", eventId: evidence.eventId },
      ],
    },
  });
  if (existing) {
    if (existing.bodySha256 !== evidence.bodySha256) {
      throw new Error("Conflicting callback replay.");
    }
    return;
  }

  const config = hubTranscriptionConfig();
  const hubBase = `${config.url.replace(/\/+$/, "")}/media_transcriptions/${evidence.transcriptionId}`;
  const hubHeaders = {
    authorization: `Bearer ${config.apiKey}`,
    "x-hub-contract-version": config.contractVersion,
  };

  if (status === "ready" && transcript.status !== "deleted") {
    const sourceSha256 = assertSha256(body.source_sha256, "source sha256");
    if (transcript.recordingAsset?.sha256 !== sourceSha256) {
      throw new Error("Hub source digest mismatch.");
    }
    const transcriptSha256 = assertSha256(
      body.transcript_sha256,
      "transcript sha256",
    );
    if (
      transcript.status === "ready" &&
      transcript.text !== null &&
      sha256(transcript.text) !== transcriptSha256
    ) {
      throw new Error("Hub transcript digest mismatch.");
    }
  }

  let discardedReady = status === "ready" && transcript.status === "deleted";
  if (
    status === "ready" &&
    transcript.status !== "ready" &&
    !discardedReady
  ) {
    const persisted = await prisma.$transaction(async (tx) => {
      await lockSession(tx, transcript.sessionId);
      if (!(await currentConsentGranted(tx, transcript.sessionId, "transcription"))) {
        return false;
      }
      const contentResponse = await fetch(`${hubBase}/content`, {
        headers: hubHeaders,
        signal: AbortSignal.timeout(15_000),
      });
      const contentBody = (await contentResponse.json().catch(() => null)) as {
        data?: { text?: string; language?: string };
      } | null;
      const text = contentBody?.data?.text;
      if (!contentResponse.ok || !validHubTranscriptContent(text)) {
        throw new Error("Invalid Hub transcription content.");
      }
      const transcriptSha256 = assertSha256(
        body.transcript_sha256,
        "transcript sha256",
      );
      if (sha256(text) !== transcriptSha256) {
        throw new Error("Hub transcript digest mismatch.");
      }
      const sourceSha256 = assertSha256(body.source_sha256, "source sha256");
      await tx.transcriptArtifact.update({
        where: { id: transcript.id },
        data: {
          status: "ready",
          text,
          language:
            typeof contentBody?.data?.language === "string"
              ? contentBody.data.language
              : null,
          readyAt: eventAt,
          sourceSha256,
          lastSequence: sequence,
          lastEventAt: eventAt,
        },
      });
      await tx.session.update({
        where: { id: transcript.sessionId },
        data: {
          transcript: text,
          transcriptRevision: { increment: 1 },
          transcriptUploadedAt: eventAt,
          transcriptUploadedById: null,
        },
      });
      await tx.sessionDebrief.deleteMany({
        where: {
          sessionId: transcript.sessionId,
          resultDocuments: { none: {} },
        },
      });
      return true;
    });
    discardedReady = !persisted;
  }

  if (discardedReady) {
    const providerErasedAt = await acknowledgeAndEraseHubTranscription({
      hubBase,
      headers: hubHeaders,
      localTerminal: true,
    });
    await prisma.$transaction(async (tx) => {
      await lockSession(tx, transcript.sessionId);
      await assertNoConflictingReplay(
        tx,
        "hub_transcription",
        evidence.eventId,
        evidence.idempotencyKey,
        evidence.bodySha256,
      );
      await tx.transcriptArtifact.update({
        where: { id: transcript.id },
        data: {
          status: "deleted",
          text: null,
          deletedAt: transcript.deletedAt ?? eventAt,
          providerErasedAt,
          lastSequence: sequence,
          lastEventAt: eventAt,
        },
      });
      await tx.sessionDebrief.updateMany({
        where: { sessionId: transcript.sessionId, privateErasedAt: null },
        data: {
          perAttendeeSuggestions: Prisma.DbNull,
          internalSynthesis: Prisma.DbNull,
          error: null,
          privateErasedAt: eventAt,
        },
      });
      await tx.sessionMediaCallbackEvent.create({
        data: {
          source: "hub_transcription",
          eventId: evidence.eventId,
          idempotencyKey: evidence.idempotencyKey,
          bodySha256: evidence.bodySha256,
          occurredAt: eventAt,
        },
      });
    });
    return;
  } else if (status === "failed") {
    await prisma.transcriptArtifact.updateMany({
      where: {
        id: transcript.id,
        lastSequence: { lt: sequence },
        status: { in: ["pending", "processing"] },
      },
      data: {
        status: "failed",
        failedAt: eventAt,
        failureCode: "transcription_failed",
        lastSequence: sequence,
        lastEventAt: eventAt,
      },
    });
  }

  let providerErasedAt: Date | undefined;
  if (status === "ready" || status === "failed") {
    providerErasedAt = await acknowledgeAndEraseHubTranscription({
      hubBase,
      headers: hubHeaders,
      localTerminal: ["ready", "failed", "deleted"].includes(transcript.status),
    });
  }

  await prisma.$transaction(async (tx) => {
    await assertNoConflictingReplay(
      tx,
      "hub_transcription",
      evidence.eventId,
      evidence.idempotencyKey,
      evidence.bodySha256,
    );
    await tx.transcriptArtifact.updateMany({
      where: { id: transcript.id },
      data: {
        providerErasedAt:
          providerErasedAt ?? (status === "deleted" ? eventAt : undefined),
        lastSequence: status === "deleted" ? sequence : undefined,
        lastEventAt: status === "deleted" ? eventAt : undefined,
      },
    });
    await tx.sessionMediaCallbackEvent.create({
      data: {
        source: "hub_transcription",
        eventId: evidence.eventId,
        idempotencyKey: evidence.idempotencyKey,
        bodySha256: evidence.bodySha256,
        occurredAt: eventAt,
      },
    });
  });
}
