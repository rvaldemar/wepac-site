import { beforeEach, describe, expect, it, vi } from "vitest";

const assertSessionOrganizer = vi.fn();
const sessionFindUnique = vi.fn();
const sessionFindUniqueOrThrow = vi.fn();
const debriefFindFirst = vi.fn();
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
      findFirst: (...args: unknown[]) => debriefFindFirst(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

import { generateSessionDebrief } from "@/lib/wepacker/actions/debrief";

const engineResult = {
  contractVersion: "wepac-session-debrief-v3",
  perAttendee: [
    {
      attendeeRef: "attendee-1",
      outcomeSuggestion: "summary",
      sharedNoteSuggestion: "",
      confidence: "medium",
      actions: [],
    },
  ],
  internalSynthesis: {
    sessionSummary: "summary",
    pillarObservations: {
      physical: { signal: "not_discussed", evidence: "" },
      emotional: { signal: "not_discussed", evidence: "" },
      character: { signal: "not_discussed", evidence: "" },
      spiritual: { signal: "not_discussed", evidence: "" },
      intellectual: { signal: "not_discussed", evidence: "" },
      social: { signal: "not_discussed", evidence: "" },
    },
    disciplineObservations: null,
    risks: [],
    recommendedFollowUps: [],
    suggestedSessionKind: null,
  },
  resultDocumentHtml: null,
};

const readyRow = {
  id: "debrief-1",
  contractVersion: "wepac-session-debrief-v3",
  status: "ready",
  engineImpl: "test",
  model: "claude-sonnet-5",
  perAttendeeSuggestions: engineResult.perAttendee,
  internalSynthesis: engineResult.internalSynthesis,
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
    });
    debriefFindFirst.mockResolvedValue(null);
    sessionFindUnique.mockResolvedValue({
      transcript: "version one",
      transcriptRevision: 7,
    });
    sessionFindUniqueOrThrow.mockResolvedValue({
      attendees: [{ id: "attendee-1" }],
      cycle: null,
      kind: "checkpoint",
      discussionPoints: null,
      transcriptRevision: 7,
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
    expect(generateDebrief).toHaveBeenCalledWith({
      contractVersion: "wepac-session-debrief-v3",
      sessionRef: "session-1",
      transcriptRevision: 7,
      transcript: "version one",
      sessionKind: "checkpoint",
      discussionPoints: null,
      attendees: [{ attendeeRef: "attendee-1" }],
      disciplineContext: null,
      releaseMode: "draft_only",
    });
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
