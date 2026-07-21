import { describe, it, expect, vi } from "vitest";

// Regression test for the member transcript-leak fix: getMySessions and
// getNextSession must never return a `transcript`/`transcriptUploadedAt`/
// `transcriptUploadedById` field, even if a future Session column rides
// along by accident. We assert this both on the fake row shape (proving
// the mock itself never carries the field, i.e. a real Prisma `select`
// would reject it) and on the actual Prisma `select` object session.ts
// builds, so a future edit that widens the select back to an `include`
// fails this test immediately.

const findMany = vi.fn();
const findFirst = vi.fn();
const requireUser = vi.fn(async () => ({
  id: "user-1",
  role: "member",
}));
const requireMembership = vi.fn(async () => {
  throw new Error("Session reads must not require a Journey membership.");
});

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireMembership: () => requireMembership(),
  requireUser: () => requireUser(),
  requireRole: vi.fn(async () => ({ id: "user-1", role: "member" })),
  getMentoredCohortIds: vi.fn(async () => []),
}));

import { getMySessions, getNextSession } from "@/lib/wepacker/actions/session";

const fakeRow = {
  id: "session-1",
  cohortId: null,
  sessionType: "individual",
  kind: "checkpoint",
  scheduledAt: new Date("2026-01-01"),
  durationMinutes: 60,
  status: "scheduled",
  notes: null,
  notesPublished: false,
  discussionPoints: null,
  attendees: [
    {
      id: "attendee-1",
      attended: true,
      outcome: "ok",
      sharedNote: "shared",
      sharedNotePublished: true,
      user: { id: "user-1", name: "Alex" },
    },
  ],
  mentor: { id: "mentor-1", name: "Mentor" },
};

function assertNoTranscriptField(value: unknown) {
  expect(value).not.toBeNull();
  const record = value as Record<string, unknown>;
  expect(record).not.toHaveProperty("transcript");
  expect(record).not.toHaveProperty("transcriptUploadedAt");
  expect(record).not.toHaveProperty("transcriptUploadedById");
  expect(record).not.toHaveProperty("transcriptUploadedBy");
}

describe("member session reads never leak the transcript", () => {
  it("getMySessions rows carry no transcript field", async () => {
    findMany.mockResolvedValueOnce([fakeRow]);
    const rows = await getMySessions();
    expect(rows).toHaveLength(1);
    assertNoTranscriptField(rows[0]);

    // The query itself must use a top-level `select` (default-deny),
    // never an `include` — an `include` would return every Session
    // scalar automatically regardless of what the mock returns.
    const callArgs = findMany.mock.calls[0]?.[0];
    expect(callArgs).toHaveProperty("select");
    expect(callArgs).not.toHaveProperty("include");
    expect(callArgs.select).not.toHaveProperty("transcript");
    expect(callArgs.select).not.toHaveProperty("transcriptUploadedAt");
    expect(callArgs.select).not.toHaveProperty("transcriptUploadedById");
    expect(requireUser).toHaveBeenCalled();
    expect(requireMembership).not.toHaveBeenCalled();
  });

  it("getNextSession row carries no transcript field", async () => {
    findFirst.mockResolvedValueOnce(fakeRow);
    const row = await getNextSession();
    assertNoTranscriptField(row);

    const callArgs = findFirst.mock.calls[0]?.[0];
    expect(callArgs).toHaveProperty("select");
    expect(callArgs).not.toHaveProperty("include");
    expect(callArgs.select).not.toHaveProperty("transcript");
    expect(requireMembership).not.toHaveBeenCalled();
  });

  it("getNextSession returns null untouched", async () => {
    findFirst.mockResolvedValueOnce(null);
    const row = await getNextSession();
    expect(row).toBeNull();
  });
});
