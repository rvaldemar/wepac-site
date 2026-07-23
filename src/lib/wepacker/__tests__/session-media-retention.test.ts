import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const updateMany = vi.fn();
const recordingAssetFindMany = vi.fn();
const recordingAssetUpdateMany = vi.fn();
const recordingUpdateMany = vi.fn();
const transcriptFindMany = vi.fn();
const transcriptUpdateMany = vi.fn();
const auditCreate = vi.fn();
const tx = {
  $queryRaw: queryRaw,
  sessionConsentEvent: { updateMany },
  sessionConsentCapacityAssurance: { updateMany },
  sessionArtifactAuditEvent: { updateMany },
  sessionRecording: { updateMany },
  transcriptArtifact: { updateMany },
  sessionResultDocument: { updateMany },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    recordingAsset: {
      findMany: (...args: unknown[]) => recordingAssetFindMany(...args),
      updateMany: (...args: unknown[]) => recordingAssetUpdateMany(...args),
    },
    sessionRecording: {
      updateMany: (...args: unknown[]) => recordingUpdateMany(...args),
    },
    transcriptArtifact: {
      findMany: (...args: unknown[]) => transcriptFindMany(...args),
    },
    $transaction: (
      callback: (client: {
        transcriptArtifact: { updateMany: typeof transcriptUpdateMany };
        sessionArtifactAuditEvent: { create: typeof auditCreate };
      }) => unknown,
    ) =>
      callback({
        transcriptArtifact: { updateMany: transcriptUpdateMany },
        sessionArtifactAuditEvent: { create: auditCreate },
      }),
  },
}));

import {
  anonymizeSessionMediaForUser,
  eraseSessionRecordingsAfterWithdrawal,
  reconcileDeletedHubTranscriptions,
} from "@/lib/wepacker/session-media/retention";

describe("Session media account erasure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([]);
    updateMany.mockResolvedValue({ count: 0 });
    recordingAssetFindMany.mockResolvedValue([]);
    recordingAssetUpdateMany.mockResolvedValue({ count: 0 });
    recordingUpdateMany.mockResolvedValue({ count: 0 });
    transcriptFindMany.mockResolvedValue([]);
    transcriptUpdateMany.mockResolvedValue({ count: 1 });
    auditCreate.mockResolvedValue({ id: "audit-1" });
    vi.stubEnv("HUB_TRANSCRIPTION_API_URL", "https://hub.example.test/api/v1");
    vi.stubEnv("HUB_TRANSCRIPTION_API_KEY", "synthetic-key");
    vi.stubEnv(
      "HUB_TRANSCRIPTION_CONTRACT_VERSION",
      "media-transcription.v1",
    );
  });

  it("opens the maintenance boundary and detaches only user references", async () => {
    await anonymizeSessionMediaForUser(tx as never, "person-1");

    expect(queryRaw).toHaveBeenCalledOnce();
    expect(updateMany).toHaveBeenCalledWith({
      where: { subjectUserId: "person-1" },
      data: { subjectUserId: null },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { publishedById: "person-1" },
      data: { publishedById: null },
    });
    expect(updateMany).toHaveBeenCalledTimes(9);
  });

  it("does not mutate when the maintenance boundary fails", async () => {
    queryRaw.mockRejectedValue(new Error("maintenance denied"));
    await expect(
      anonymizeSessionMediaForUser(tx as never, "person-1"),
    ).rejects.toThrow("maintenance denied");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("keeps the active operation finalizing while tombstoning completed raws", async () => {
    await eraseSessionRecordingsAfterWithdrawal(
      "session-1",
      new Date("2026-07-23T15:00:00.000Z"),
    );

    expect(recordingUpdateMany).toHaveBeenCalledWith({
      where: {
        sessionId: "session-1",
        deletedAt: null,
        status: { in: ["ready", "failed"] },
      },
      data: {
        status: "deleted",
        deletedAt: new Date("2026-07-23T15:00:00.000Z"),
      },
    });
  });

  it("retries provider erasure tombstones and audits only confirmed deletion", async () => {
    transcriptFindMany.mockResolvedValue([
      {
        id: "transcript-1",
        sessionId: "session-1",
        revision: 3,
        providerTranscriptId: "provider-1",
      },
    ]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 404 }));
    const now = new Date("2026-07-23T15:30:00.000Z");

    await expect(reconcileDeletedHubTranscriptions(now)).resolves.toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hub.example.test/api/v1/media_transcriptions/provider-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(transcriptUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "transcript-1",
        status: "deleted",
        providerErasedAt: null,
      },
      data: { providerErasedAt: now },
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "artifact_erased",
        reasonCode: "provider_erasure_confirmed",
      }),
    });
    fetchMock.mockRestore();
  });

  it("leaves a failed provider deletion tombstoned for the next retry", async () => {
    transcriptFindMany.mockResolvedValue([
      {
        id: "transcript-1",
        sessionId: "session-1",
        revision: 3,
        providerTranscriptId: "provider-1",
      },
    ]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(reconcileDeletedHubTranscriptions()).resolves.toBe(0);
    expect(transcriptUpdateMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
