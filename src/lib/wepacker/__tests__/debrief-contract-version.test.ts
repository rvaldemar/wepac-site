import { beforeEach, describe, expect, it, vi } from "vitest";

const assertSessionOrganizer = vi.fn();
const debriefFindFirst = vi.fn();

vi.mock("@/lib/wepacker/actions/session", () => ({
  assertSessionOrganizer: (...args: unknown[]) =>
    assertSessionOrganizer(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    sessionDebrief: {
      findFirst: (...args: unknown[]) => debriefFindFirst(...args),
    },
  },
}));

import { getSessionDebrief } from "@/lib/wepacker/actions/debrief";

const synthesis = {
  sessionSummary: "Resumo",
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
};

const validRow = {
  id: "debrief-v3",
  contractVersion: "wepac-session-debrief-v3",
  status: "ready",
  engineImpl: "hub",
  model: null,
  perAttendeeSuggestions: [
    {
      attendeeRef: "attendee-1",
      outcomeSuggestion: "Combinado",
      sharedNoteSuggestion: "Nota",
      confidence: "medium",
      actions: [],
    },
  ],
  internalSynthesis: synthesis,
  error: null,
  requestedAt: new Date("2026-07-22T10:00:00Z"),
  generatedAt: new Date("2026-07-22T10:01:00Z"),
};

describe("Session Debrief contract boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertSessionOrganizer.mockResolvedValue({ actorId: "mentor-1" });
  });

  it("queries only the exact W01 v3 discriminator, so old rows stay invisible", async () => {
    debriefFindFirst.mockResolvedValue(null);

    await expect(getSessionDebrief("session-1")).resolves.toBeNull();
    expect(debriefFindFirst).toHaveBeenCalledWith({
      where: {
        sessionId: "session-1",
        contractVersion: "wepac-session-debrief-v3",
      },
    });
  });

  it("returns a freshly validated v3 view", async () => {
    debriefFindFirst.mockResolvedValue(validRow);

    await expect(getSessionDebrief("session-1")).resolves.toMatchObject({
      id: "debrief-v3",
      status: "ready",
      perAttendee: [{ attendeeRef: "attendee-1" }],
      internalSynthesis: { sessionSummary: "Resumo" },
    });
  });

  it("fails closed when an exact-version row contains malformed JSON", async () => {
    debriefFindFirst.mockResolvedValue({
      ...validRow,
      perAttendeeSuggestions: [{ attendeeRef: "attendee-1" }],
    });

    await expect(getSessionDebrief("session-1")).resolves.toBeNull();
  });
});
