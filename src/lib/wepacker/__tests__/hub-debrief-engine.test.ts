import { afterEach, describe, expect, it, vi } from "vitest";
import { DebriefEngineError, type DebriefInput } from "@/lib/wepacker/debrief/types";
import { getDebriefEngine } from "@/lib/wepacker/debrief/engine";
import { HubDebriefEngine } from "@/lib/wepacker/debrief/hub";

const baseInput: DebriefInput = {
  contractVersion: "wepac-session-debrief-v3",
  sessionRef: "session-123",
  transcriptRevision: 1,
  transcript: "mentor: como correu a semana?\nmentee: correu bem.",
  sessionKind: "checkpoint",
  discussionPoints: null,
  attendees: [{ attendeeRef: "session-attendee-1" }],
  disciplineContext: null,
  releaseMode: "draft_only",
};

describe("Session Debrief cutover gate", () => {
  afterEach(() => {
    delete process.env.DEBRIEF_ENGINE;
    vi.unstubAllGlobals();
  });

  it("defaults to disabled and never falls back to a direct model provider", () => {
    expect(() => getDebriefEngine()).toThrow(DebriefEngineError);
    expect(() => getDebriefEngine()).toThrow(/temporariamente indisponível/);
  });

  it("rejects an unknown engine configuration", () => {
    process.env.DEBRIEF_ENGINE = "anthropic";
    expect(() => getDebriefEngine()).toThrow(/Configuração/);
  });

  it("keeps Hub execution fail-closed until W01 v3 is certified", async () => {
    process.env.DEBRIEF_ENGINE = "hub";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const engine = getDebriefEngine();
    expect(engine).toBeInstanceOf(HubDebriefEngine);
    await expect(engine.generateDebrief(baseInput)).rejects.toThrow(
      /W01 v3/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
