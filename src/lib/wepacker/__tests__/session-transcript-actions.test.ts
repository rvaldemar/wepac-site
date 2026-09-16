import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/wepacker/debrief/types";

const sessionUpdate = vi.fn();
const debriefDeleteMany = vi.fn();
const transaction = vi.fn();
const assertSessionOrganizer = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: { update: (...args: unknown[]) => sessionUpdate(...args) },
    sessionDebrief: {
      deleteMany: (...args: unknown[]) => debriefDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  assertSessionOrganizer: (...args: unknown[]) =>
    assertSessionOrganizer(...args),
}));

import {
  attachSessionTranscript,
  clearSessionTranscript,
} from "@/lib/wepacker/actions/session-transcript";

describe("Session transcript actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SESSION_TRANSCRIPT_WRITES_ENABLED", "true");
    assertSessionOrganizer.mockResolvedValue({
      actorId: "organizer-1",
      organizerId: "organizer-1",
      cycleId: null,
      mentorshipId: "mentorship-1",
    });
    sessionUpdate.mockResolvedValue({ id: "session-1" });
    debriefDeleteMany.mockResolvedValue({ count: 1 });
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks new attachments by default before authorization or writes", async () => {
    vi.stubEnv("SESSION_TRANSCRIPT_WRITES_ENABLED", "false");

    await expect(
      attachSessionTranscript("session-1", "private text"),
    ).rejects.toThrow("temporariamente indisponíveis");
    expect(assertSessionOrganizer).not.toHaveBeenCalled();
    expect(sessionUpdate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("attaches normalized text and purges the previous derived debrief atomically", async () => {
    await expect(
      attachSessionTranscript("session-1", "  Alex: hello  "),
    ).resolves.toEqual({ id: "session-1" });

    expect(assertSessionOrganizer).toHaveBeenCalledWith("session-1");
    expect(sessionUpdate).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: {
        transcript: "Alex: hello",
        transcriptRevision: { increment: 1 },
        transcriptUploadedAt: expect.any(Date),
        transcriptUploadedById: "organizer-1",
      },
      select: { id: true, transcriptUploadedAt: true },
    });
    expect(debriefDeleteMany).toHaveBeenCalledWith({
      where: { sessionId: "session-1" },
    });
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("fails closed before any write when the actor is not the organizer", async () => {
    assertSessionOrganizer.mockRejectedValueOnce(new Error("Sem permissão."));

    await expect(
      attachSessionTranscript("session-1", "private text"),
    ).rejects.toThrow("Sem permissão");
    expect(sessionUpdate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects empty, binary and over-limit text server-side", async () => {
    await expect(attachSessionTranscript("session-1", "  ")).rejects.toThrow(
      "vazia",
    );
    await expect(
      attachSessionTranscript("session-1", "hello\0world"),
    ).rejects.toThrow("texto válido");
    await expect(
      attachSessionTranscript(
        "session-1",
        "a".repeat(MAX_TRANSCRIPT_CHARS + 1),
      ),
    ).rejects.toThrow("demasiado longa");
    expect(sessionUpdate).not.toHaveBeenCalled();
  });

  it("clears the source transcript and derived debrief in one transaction", async () => {
    await clearSessionTranscript("session-1");

    expect(assertSessionOrganizer).toHaveBeenCalledWith("session-1");
    expect(sessionUpdate).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: {
        transcript: null,
        transcriptRevision: { increment: 1 },
        transcriptUploadedAt: null,
        transcriptUploadedById: null,
      },
      select: { id: true },
    });
    expect(debriefDeleteMany).toHaveBeenCalledWith({
      where: { sessionId: "session-1" },
    });
    expect(transaction).toHaveBeenCalledOnce();
  });
});
