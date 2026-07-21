import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DebriefEngineError, type DebriefInput } from "@/lib/wepacker/debrief/types";

// HubDebriefEngine — real client against the Agents Hub playbook
// "wepac-session-debrief" (W01). All HTTP is mocked; no network calls.
// Covers: submission + polling-to-completion + output mapping, timeout,
// auth failure, and the fail-loud-at-construction contract for a
// misconfigured "hub" engine (never a silent fallback to Anthropic).

const ENV_KEYS = ["HUB_API_URL", "HUB_API_KEY", "HUB_DEBRIEF_PLAYBOOK_ID"] as const;

function setHubEnv() {
  process.env.HUB_API_URL = "https://hub.example.com";
  process.env.HUB_API_KEY = "test-hub-key";
  process.env.HUB_DEBRIEF_PLAYBOOK_ID = "playbook-w01-uuid";
}

function clearHubEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const baseInput: DebriefInput = {
  sessionId: "session-123",
  transcript: "mentor: como correu a semana?\nmentee: correu bem.",
  sessionKind: "checkpoint",
  discussionPoints: null,
  attendees: [{ userId: "user-1", name: "Ana" }],
  packContext: null,
};

const readyRunBody = {
  data: {
    id: "run-42",
    status: "waiting_approval",
    step_results: [
      {
        step_id: "internal_assessment",
        status: "done",
        output: {
          sections: [
            { title: "Físico — postura e energia", observations: "boa forma geral" },
          ],
          overall_summary: "Resumo geral da sessão.",
          risk_flags: ["risco X"],
          recommended_focus: ["foco Y"],
        },
      },
      {
        step_id: "generate_result_html",
        status: "done",
        output: "<html><body>resultado</body></html>",
      },
    ],
    error_message: null,
  },
};

describe("HubDebriefEngine", () => {
  beforeEach(() => {
    clearHubEnv();
  });

  afterEach(() => {
    clearHubEnv();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws a clear PT-PT error at construction when Hub env vars are missing (fail-loud, never silent fallback)", async () => {
    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    expect(() => new HubDebriefEngine()).toThrow(DebriefEngineError);
    expect(() => new HubDebriefEngine()).toThrow(/Agents Hub/);
  });

  it("getDebriefEngine() with DEBRIEF_ENGINE=hub and no Hub vars throws instead of falling back to Anthropic", async () => {
    process.env.DEBRIEF_ENGINE = "hub";
    const { getDebriefEngine } = await import("@/lib/wepacker/debrief/engine");
    expect(() => getDebriefEngine()).toThrow(DebriefEngineError);
    delete process.env.DEBRIEF_ENGINE;
  });

  it("submits the run to the configured playbook with Bearer auth and the transcript as plain text", async () => {
    setHubEnv();
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/run")) {
        return jsonResponse({ data: { id: "run-42", status: "pending" } }, 201);
      }
      return jsonResponse(readyRunBody);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    const engine = new HubDebriefEngine();
    await engine.generateDebrief(baseInput);

    expect(fetchMock).toHaveBeenCalled();
    const [submitUrl, submitOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(submitUrl).toBe(
      "https://hub.example.com/api/v1/playbooks/playbook-w01-uuid/run"
    );
    expect(submitOptions.method).toBe("POST");
    expect((submitOptions.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-hub-key"
    );
    const body = JSON.parse(submitOptions.body as string);
    expect(body.inputs.transcript).toBe(baseInput.transcript);

    const [pollUrl, pollOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(pollUrl).toBe("https://hub.example.com/api/v1/playbook_runs/run-42");
    expect((pollOptions.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-hub-key"
    );
  });

  it("polls past an in-progress run and maps internal_assessment/generate_result_html into DebriefResult", async () => {
    setHubEnv();
    vi.useFakeTimers();
    let pollCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/run")) {
        return jsonResponse({ data: { id: "run-42", status: "pending" } }, 201);
      }
      pollCount += 1;
      if (pollCount === 1) {
        return jsonResponse({
          data: { id: "run-42", status: "running", step_results: [], error_message: null },
        });
      }
      return jsonResponse(readyRunBody);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    const engine = new HubDebriefEngine();
    const resultPromise = engine.generateDebrief(baseInput);
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await resultPromise;

    expect(pollCount).toBe(2);
    expect(result.internalEvaluation.sessionSummary).toBe("Resumo geral da sessão.");
    expect(result.internalEvaluation.risks).toEqual(["risco X"]);
    expect(result.internalEvaluation.recommendedFollowUps).toEqual(["foco Y"]);
    expect(result.internalEvaluation.areaObservations.physical.signal).toBe("watch");
    expect(result.internalEvaluation.areaObservations.physical.evidence).toBe(
      "boa forma geral"
    );
    expect(result.internalEvaluation.areaObservations.social.signal).toBe(
      "not_discussed"
    );
    expect(result.resultDocumentHtml).toBe("<html><body>resultado</body></html>");
    expect(result.perAttendee).toHaveLength(1);
    expect(result.perAttendee[0].userId).toBe("user-1");
    expect(result.perAttendee[0].outcomeSuggestion).toBe("Resumo geral da sessão.");
    expect(result.perAttendee[0].tasks).toEqual([{ title: "foco Y" }]);
  });

  it("never generates a result document for a group (multi-attendee) session", async () => {
    setHubEnv();
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/run")) {
        return jsonResponse({ data: { id: "run-42", status: "pending" } }, 201);
      }
      return jsonResponse(readyRunBody);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    const engine = new HubDebriefEngine();
    const groupInput: DebriefInput = {
      ...baseInput,
      attendees: [
        { userId: "user-1", name: "Ana" },
        { userId: "user-2", name: "Rui" },
      ],
    };
    const result = await engine.generateDebrief(groupInput);

    expect(result.resultDocumentHtml).toBeNull();
    expect(result.perAttendee).toHaveLength(2);
  });

  it("throws a clear PT-PT error when the Hub rejects submission with 401", async () => {
    setHubEnv();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: "unauthorized" }, 401)
    );
    vi.stubGlobal("fetch", fetchMock);

    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    const engine = new HubDebriefEngine();
    await expect(engine.generateDebrief(baseInput)).rejects.toThrow(
      /Autenticação/
    );
  });

  it("throws a clear PT-PT error when the run is reported failed by the Hub", async () => {
    setHubEnv();
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/run")) {
        return jsonResponse({ data: { id: "run-42", status: "pending" } }, 201);
      }
      return jsonResponse({
        data: {
          id: "run-42",
          status: "failed",
          step_results: [],
          error_message: "step 'internal_assessment' raised an LLM error",
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    const engine = new HubDebriefEngine();
    await expect(engine.generateDebrief(baseInput)).rejects.toThrow(DebriefEngineError);
  });

  it("times out after ~5 minutes of polling without the required steps completing", async () => {
    setHubEnv();
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/run")) {
        return jsonResponse({ data: { id: "run-42", status: "pending" } }, 201);
      }
      return jsonResponse({
        data: { id: "run-42", status: "running", step_results: [], error_message: null },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { HubDebriefEngine } = await import("@/lib/wepacker/debrief/hub");
    const engine = new HubDebriefEngine();

    const promise = engine.generateDebrief(baseInput);
    const expectation = expect(promise).rejects.toThrow(/demasiado tempo/);
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    await expectation;
  });
});
