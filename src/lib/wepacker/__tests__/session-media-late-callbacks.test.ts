import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const callbackRows = new Map<
  string,
  {
    source: string;
    eventId: string;
    idempotencyKey: string;
    bodySha256: string;
  }
>();
const recordingAssetUpsert = vi.fn();
const recordingAssetUpdateMany = vi.fn();
const sessionDebriefUpdateMany = vi.fn();

let recordingState: Record<string, unknown>;
let transcriptState: Record<string, unknown>;

function callbackFind(args: {
  where?: {
    OR?: Array<{
      idempotencyKey?: string;
      source?: string;
      eventId?: string;
    }>;
  };
}) {
  for (const condition of args.where?.OR ?? []) {
    for (const row of callbackRows.values()) {
      if (
        (condition.idempotencyKey &&
          row.idempotencyKey === condition.idempotencyKey) ||
        (condition.source === row.source && condition.eventId === row.eventId)
      ) {
        return row;
      }
    }
  }
  return null;
}

const tx = {
  $executeRaw: vi.fn().mockResolvedValue(0),
  sessionRecording: {
    findUnique: vi.fn(async () => recordingState),
    findMany: vi.fn(async () => []),
    updateMany: vi.fn(async () => ({ count: 1 })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      Object.assign(recordingState, data);
      return recordingState;
    }),
  },
  recordingAsset: {
    upsert: (...args: unknown[]) => recordingAssetUpsert(...args),
    updateMany: (...args: unknown[]) => recordingAssetUpdateMany(...args),
  },
  transcriptArtifact: {
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      Object.assign(transcriptState, data);
      return transcriptState;
    }),
    updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      Object.assign(transcriptState, data);
      return { count: 1 };
    }),
  },
  sessionDebrief: {
    updateMany: (...args: unknown[]) => sessionDebriefUpdateMany(...args),
  },
  sessionMediaCallbackEvent: {
    findFirst: vi.fn(async (args) => callbackFind(args)),
    create: vi.fn(
      async ({
        data,
      }: {
        data: {
          source: string;
          eventId: string;
          idempotencyKey: string;
          bodySha256: string;
        };
      }) => {
        callbackRows.set(data.idempotencyKey, data);
        return data;
      },
    ),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    transcriptArtifact: {
      findUnique: vi.fn(async () => transcriptState),
      updateMany: (...args: unknown[]) =>
        tx.transcriptArtifact.updateMany(...(args as [never])),
    },
    sessionMediaCallbackEvent: {
      findFirst: vi.fn(async (args) => callbackFind(args)),
    },
  },
}));

import {
  processHubTranscriptionCallback,
  processJibriCallback,
} from "@/lib/wepacker/session-media/callbacks";

function jibriRequest(rawBody: string, eventId: string, timestamp: string) {
  const signature = createHmac("sha256", "jibri-test-secret")
    .update(`${timestamp}\n${rawBody}\n${eventId}`)
    .digest("hex");
  return new Request("https://wepac.test/callback", {
    method: "POST",
    headers: {
      "X-WEPAC-Recording-Schema-Version": "1",
      "X-WEPAC-Recording-Timestamp": timestamp,
      "X-WEPAC-Recording-Idempotency-Key": eventId,
      "X-WEPAC-Recording-Signature": `v1=${signature}`,
    },
  });
}

function hubRequest(
  rawBody: string,
  eventId: string,
  transcriptionId: string,
  timestamp: string,
) {
  const signature = createHmac("sha256", "hub-test-secret")
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return new Request("https://wepac.test/callback", {
    method: "POST",
    headers: {
      "X-Hub-Contract-Version": "media-transcription.v1",
      "X-Hub-Timestamp": timestamp,
      "X-Hub-Event-Id": eventId,
      "X-Hub-Transcription-Id": transcriptionId,
      "X-Hub-Signature-256": `sha256=${signature}`,
    },
  });
}

describe("late Session media callbacks after consent withdrawal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbackRows.clear();
    vi.stubEnv("JIBRI_CALLBACK_SECRET", "jibri-test-secret");
    vi.stubEnv("HUB_TRANSCRIPTION_CALLBACK_SECRET", "hub-test-secret");
    vi.stubEnv(
      "HUB_TRANSCRIPTION_API_URL",
      "https://hub.example.test/api/v1",
    );
    vi.stubEnv("HUB_TRANSCRIPTION_API_KEY", "synthetic-key");
    vi.stubEnv(
      "HUB_TRANSCRIPTION_CONTRACT_VERSION",
      "media-transcription.v1",
    );
    vi.stubEnv("SESSION_MEDIA_CALLBACK_MAX_SKEW_SECONDS", "300");
    recordingState = {
      id: "recording-local-1",
      sessionId: "session-1",
      providerRecordingId: "rec_provider_1",
      canonicalRoom: "wepac-0123456789abcdef",
      status: "finalizing",
      failureCode: "consent_withdrawn",
      lastSequence: 0,
    };
    transcriptState = {
      id: "transcript-local-1",
      sessionId: "session-1",
      providerTranscriptId: "transcription-provider-1",
      status: "deleted",
      text: null,
      revision: 1,
      deletedAt: new Date(),
      providerErasedAt: null,
      lastSequence: 0,
      recordingAsset: { sha256: null },
    };
    recordingAssetUpdateMany.mockResolvedValue({ count: 0 });
    sessionDebriefUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("accepts late Jibri ready content-free, then accepts provider deleted", async () => {
    const timestamp = String(Math.floor(Date.now() / 1_000));
    const occurredAt = new Date(Number(timestamp) * 1_000).toISOString();
    const readyId = "recording.ready:rec_provider_1:late";
    const readyBody = JSON.stringify({
      schema_version: "1",
      event_id: readyId,
      event_type: "recording.ready",
      occurred_at: occurredAt,
      canonical_room: "wepac-0123456789abcdef",
      recording_id: "rec_provider_1",
      media: [
        {
          kind: "audio",
          object_key: "recordings/rec_provider_1/audio.m4a",
          sha256: "a".repeat(64),
          bytes: 1234,
          duration_seconds: 13,
          mime_type: "audio/mp4",
        },
        {
          kind: "video",
          object_key: "recordings/rec_provider_1/meeting.mp4",
          sha256: "b".repeat(64),
          bytes: 5678,
          duration_seconds: 13,
          mime_type: "video/mp4",
        },
      ],
      error_code: null,
    });

    await processJibriCallback(
      jibriRequest(readyBody, readyId, timestamp),
      readyBody,
    );
    expect(recordingState).toMatchObject({
      status: "finalizing",
      lastSequence: 1,
    });
    expect(recordingAssetUpsert).not.toHaveBeenCalled();

    const deletedId = "recording.deleted:rec_provider_1:late";
    const deletedBody = JSON.stringify({
      schema_version: "1",
      event_id: deletedId,
      event_type: "recording.deleted",
      occurred_at: occurredAt,
      canonical_room: "wepac-0123456789abcdef",
      recording_id: "rec_provider_1",
      media: [],
      error_code: null,
    });
    await processJibriCallback(
      jibriRequest(deletedBody, deletedId, timestamp),
      deletedBody,
    );
    expect(recordingState).toMatchObject({
      status: "deleted",
      lastSequence: 2,
    });
    expect(callbackRows).toHaveLength(2);
  });

  it("accepts Hub ready after withdrawal without reading content, then deleted", async () => {
    const timestamp = String(Math.floor(Date.now() / 1_000));
    const occurredAt = new Date(Number(timestamp) * 1_000).toISOString();
    const readyId = "11111111-1111-4111-8111-111111111111";
    const readyBody = JSON.stringify({
      contract_version: "media-transcription.v1",
      event_id: readyId,
      event: "media_transcription.ready",
      occurred_at: occurredAt,
      transcription_id: "transcription-provider-1",
      state: "ready",
      sequence: 1,
      source_sha256: "a".repeat(64),
      transcript_sha256: "b".repeat(64),
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await processHubTranscriptionCallback(
      hubRequest(
        readyBody,
        readyId,
        "transcription-provider-1",
        timestamp,
      ),
      readyBody,
    );
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).endsWith("/content")),
    ).toBe(false);
    expect(transcriptState).toMatchObject({
      status: "deleted",
      lastSequence: 1,
    });
    expect(transcriptState.providerErasedAt).toBeInstanceOf(Date);

    const deletedId = "22222222-2222-4222-8222-222222222222";
    const deletedBody = JSON.stringify({
      contract_version: "media-transcription.v1",
      event_id: deletedId,
      event: "media_transcription.deleted",
      occurred_at: occurredAt,
      transcription_id: "transcription-provider-1",
      state: "deleted",
      sequence: 2,
      source_sha256: null,
      transcript_sha256: null,
    });
    await processHubTranscriptionCallback(
      hubRequest(
        deletedBody,
        deletedId,
        "transcription-provider-1",
        timestamp,
      ),
      deletedBody,
    );
    expect(transcriptState).toMatchObject({ lastSequence: 2 });
    expect(callbackRows).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });
});
