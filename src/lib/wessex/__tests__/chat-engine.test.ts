import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

// Engine selection + HubChatEngine — all HTTP is mocked; no network
// calls. DirectAnthropicEngine's own streaming behavior is intentionally
// left untouched by this ticket and is not re-tested here beyond
// selection, since it is unchanged from the pre-seam implementation.

const ENV_KEYS = ["WESSEX_ENGINE", "HUB_API_URL", "HUB_API_KEY"] as const;

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("getChatEngine", () => {
  beforeEach(() => {
    clearEnv();
  });

  afterEach(() => {
    clearEnv();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("defaults to the direct engine when WESSEX_ENGINE is unset", async () => {
    const { getChatEngine } = await import("@/lib/wessex/chat-engine");
    const engine = getChatEngine();
    expect(engine.name).toBe("direct");
  });

  it("defaults to the direct engine for any value other than 'hub'", async () => {
    process.env.WESSEX_ENGINE = "bogus";
    const { getChatEngine } = await import("@/lib/wessex/chat-engine");
    expect(getChatEngine().name).toBe("direct");
  });

  it("throws a clear PT-PT error selecting hub without HUB env vars (fail-loud, never a silent fallback to direct)", async () => {
    process.env.WESSEX_ENGINE = "hub";
    const { getChatEngine, ChatEngineError } = await import(
      "@/lib/wessex/chat-engine"
    );
    expect(() => getChatEngine()).toThrow(ChatEngineError);
    try {
      getChatEngine();
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ChatEngineError);
      expect((err as Error).message).toMatch(/Agents Hub/);
      expect((err as Error).message).not.toBe("");
    }
  });

  it("throws when only one of HUB_API_URL/HUB_API_KEY is set", async () => {
    process.env.WESSEX_ENGINE = "hub";
    process.env.HUB_API_URL = "https://hub.example.com";
    const { getChatEngine, ChatEngineError } = await import(
      "@/lib/wessex/chat-engine"
    );
    expect(() => getChatEngine()).toThrow(ChatEngineError);
  });

  it("selects the hub engine when WESSEX_ENGINE=hub and both env vars are set", async () => {
    process.env.WESSEX_ENGINE = "hub";
    process.env.HUB_API_URL = "https://hub.example.com";
    process.env.HUB_API_KEY = "test-hub-key";
    const { getChatEngine } = await import("@/lib/wessex/chat-engine");
    expect(getChatEngine().name).toBe("hub");
  });
});

describe("HubChatEngine", () => {
  beforeEach(() => {
    clearEnv();
    process.env.HUB_API_URL = "https://hub.example.com";
    process.env.HUB_API_KEY = "test-hub-key";
  });

  afterEach(() => {
    clearEnv();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function drain(gen: AsyncGenerator<unknown>) {
    const events = [];
    for await (const event of gen) events.push(event);
    return events;
  }

  it("posts to the Hub chat endpoint with Bearer auth and flattened messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { content: "Olá! Como posso ajudar?" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { HubChatEngine } = await import("@/lib/wessex/chat-engine");
    const engine = new HubChatEngine();

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: "Quanto custa um quarteto de cordas?" },
    ];
    const events = await drain(
      engine.runTurn({ system: "system prompt", messages })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hub.example.com/api/v1/llm/chat");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-hub-key");

    const body = JSON.parse(init.body);
    expect(body.system).toBe("system prompt");
    expect(body.messages).toEqual([
      { role: "user", content: "Quanto custa um quarteto de cordas?" },
    ]);

    expect(events).toEqual([
      { type: "text_delta", text: "Olá! Como posso ajudar?" },
      {
        type: "stop",
        stopReason: "end_turn",
        content: [{ type: "text", text: "Olá! Como posso ajudar?" }],
      },
    ]);
  });

  it("flattens array-of-blocks message content down to its text blocks", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: { content: "ok" } }));
    vi.stubGlobal("fetch", fetchMock);

    const { HubChatEngine } = await import("@/lib/wessex/chat-engine");
    const engine = new HubChatEngine();

    const messages: Anthropic.MessageParam[] = [
      {
        role: "assistant",
        content: [{ type: "text", text: "parte 1" }],
      },
    ];
    await drain(engine.runTurn({ system: "s", messages }));

    const init = fetchMock.mock.calls[0][1];
    const body = JSON.parse(init.body);
    expect(body.messages).toEqual([{ role: "assistant", content: "parte 1" }]);
  });

  it("throws a clear PT-PT error on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    const { HubChatEngine, ChatEngineError } = await import(
      "@/lib/wessex/chat-engine"
    );
    const engine = new HubChatEngine();

    await expect(
      drain(engine.runTurn({ system: "s", messages: [] }))
    ).rejects.toThrow(ChatEngineError);
  });

  it("throws a clear PT-PT error on 401/403", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    const { HubChatEngine } = await import("@/lib/wessex/chat-engine");
    const engine = new HubChatEngine();

    await expect(
      drain(engine.runTurn({ system: "s", messages: [] }))
    ).rejects.toThrow(/Autenticação/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the response body has no usable content field", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ data: {} })));

    const { HubChatEngine, ChatEngineError } = await import(
      "@/lib/wessex/chat-engine"
    );
    const engine = new HubChatEngine();

    await expect(
      drain(engine.runTurn({ system: "s", messages: [] }))
    ).rejects.toThrow(ChatEngineError);
  });

  it("throws a clear PT-PT error when fetch itself rejects (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const { HubChatEngine, ChatEngineError } = await import(
      "@/lib/wessex/chat-engine"
    );
    const engine = new HubChatEngine();

    await expect(
      drain(engine.runTurn({ system: "s", messages: [] }))
    ).rejects.toThrow(ChatEngineError);
  });
});
