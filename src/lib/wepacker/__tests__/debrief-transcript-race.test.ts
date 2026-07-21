import { beforeEach, describe, expect, it, vi } from "vitest";

const assertSessionOrganizer = vi.fn();
const sessionFindUnique = vi.fn();
const sessionFindUniqueOrThrow = vi.fn();
const debriefFindUnique = vi.fn();
const transaction = vi.fn();
const lockedTranscript = vi.fn();
const txUpsert = vi.fn();
const generateDebrief = vi.fn();

vi.mock("@/lib/wepacker/actions/session", () => ({
  assertSessionOrganizer: (...args: unknown[]) =>
    assertSessionOrganizer(...args),
}));

vi.mock("@/lib/wepacker/debrief/engine", () => ({
  getDebriefEngine: () => ({ name: "test", generateDebrief }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findUnique: (...args: unknown[]) => sessionFindUnique(...args),
      findUniqueOrThrow: (...args: unknown[]) =>
        sessionFindUniqueOrThrow(...args),
    },
    sessionDebrief: {
      findUnique: (...args: unknown[]) => debriefFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

import { generateSessionDebrief } from "@/lib/wepacker/actions/debrief";

const engineResult = {
  perAttendee: [],
  internalEvaluation: {
    sessionSummary: "summary",
    areaObservations: {},
    practiceObservations: null,
    risks: [],
    recommendedFollowUps: [],
  },
  resultDocumentHtml: null,
};

const readyRow = {
  id: "debrief-1",
  status: "ready",
  engineImpl: "test",
  model: "claude-sonnet-5",
  perAttendeeSuggestions: [],
  internalEvaluation: engineResult.internalEvaluation,
  resultDocumentHtml: null,
  error: null,
  requestedAt: new Date("2026-07-21T10:00:00Z"),
  generatedAt: new Date("2026-07-21T10:01:00Z"),
};

describe("debrief transcript revision fence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertSessionOrganizer.mockResolvedValue({
      actorId: "mentor-1",
      mentorId: "mentor-1",
      cohortId: null,
      mentorshipId: null,
    });
    debriefFindUnique.mockResolvedValue(null);
    sessionFindUnique.mockResolvedValue({
      transcript: "version one",
      transcriptRevision: 7,
    });
    sessionFindUniqueOrThrow.mockResolvedValue({
      attendees: [],
      cohort: null,
      kind: "checkpoint",
      discussionPoints: null,
    });
    generateDebrief.mockResolvedValue(engineResult);
    txUpsert.mockResolvedValue(readyRow);
    transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          $queryRaw: (...args: unknown[]) => lockedTranscript(...args),
          sessionDebrief: { upsert: (...args: unknown[]) => txUpsert(...args) },
        }),
    );
  });

  it("persists a result only while the organizer's source transcript is unchanged", async () => {
    lockedTranscript.mockResolvedValueOnce([
      { transcript: "version one", transcriptRevision: 7 },
    ]);

    await expect(
      generateSessionDebrief("session-1", { force: true }),
    ).resolves.toMatchObject({ id: "debrief-1", status: "ready" });
    expect(txUpsert).toHaveBeenCalledOnce();
  });

  it("does not resurrect a stale debrief after replacement", async () => {
    lockedTranscript.mockResolvedValueOnce([
      { transcript: "version two", transcriptRevision: 7 },
    ]);

    await expect(
      generateSessionDebrief("session-1", { force: true }),
    ).rejects.toThrow("mudou durante a geração");
    expect(txUpsert).not.toHaveBeenCalled();
  });

  it("rejects a same-content replacement and A-B-A cycle by revision", async () => {
    lockedTranscript.mockResolvedValueOnce([
      { transcript: "version one", transcriptRevision: 10 },
    ]);

    await expect(
      generateSessionDebrief("session-1", { force: true }),
    ).rejects.toThrow("mudou durante a geração");
    expect(txUpsert).not.toHaveBeenCalled();
  });
});
