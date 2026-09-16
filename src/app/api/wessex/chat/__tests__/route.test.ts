import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatEngine, ChatEngineEvent } from "@/lib/wessex/chat-engine";

const mocks = vi.hoisted(() => ({
  check: vi.fn(
    async (): Promise<
      | { allowed: true }
      | {
          allowed: false;
          retryAfterSeconds: number;
          reason?: "limit" | "unavailable";
        }
    > => ({
      allowed: true,
    }),
  ),
  getChatEngine: vi.fn(),
  saveLead: vi.fn(),
  recordAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/wessex/rate-limit", () => ({
  getVisitorIp: () => "test-visitor",
  visitorRateLimiter: { check: mocks.check },
}));

vi.mock("@/lib/wessex/chat-engine", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/wessex/chat-engine")>();
  return { ...original, getChatEngine: mocks.getChatEngine };
});

vi.mock("@/lib/leads", () => ({ saveLead: mocks.saveLead }));
vi.mock("@/lib/wessex/operational-alert", () => ({
  isWessexOperationalAlertCode: (code: string) => code !== "rate_limited",
  wessexOperationalAlerter: { record: mocks.recordAlert },
}));

import { POST } from "@/app/api/wessex/chat/route";
import { ChatEngineError } from "@/lib/wessex/chat-engine";

function request() {
  return new Request("https://wepac.pt/api/wessex/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Olá" }],
      consentGiven: true,
    }),
  });
}

function engineFrom(
  factory: () => AsyncGenerator<ChatEngineEvent>,
): ChatEngine {
  return { name: "direct", runTurn: vi.fn(factory) };
}

function parseNdjson(text: string) {
  return text.trim().split("\n").map((line) => JSON.parse(line));
}

describe("POST /api/wessex/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.check.mockResolvedValue({ allowed: true });
    mocks.saveLead.mockResolvedValue(undefined);
  });

  it("returns typed JSON and Retry-After when visitor rate limited", async () => {
    mocks.check.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 37,
      reason: "limit",
    });

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("37");
    expect(await response.json()).toEqual({
      error: {
        code: "rate_limited",
        message: expect.any(String),
        retryAfter: 37,
      },
    });
  });

  it("fails closed without starting the AI engine when the limiter store is unavailable", async () => {
    mocks.check.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 60,
      reason: "unavailable",
    });

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBeNull();
    expect(await response.json()).toMatchObject({
      error: { code: "upstream_unavailable" },
    });
    expect(mocks.getChatEngine).not.toHaveBeenCalled();
  });

  it("does not expose configuration details", async () => {
    mocks.getChatEngine.mockImplementation(() => {
      throw new ChatEngineError(
        "configuration",
        "secret-key-name and internal host",
      );
    });

    const response = await POST(request());
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(text).toContain('"code":"configuration"');
    expect(text).not.toContain("secret-key-name");
    expect(text).not.toContain("internal host");
    expect(mocks.recordAlert).toHaveBeenCalledWith("configuration");
  });

  it("returns a typed 400 for an invalid request body", async () => {
    const response = await POST(
      new Request("https://wepac.pt/api/wessex/chat", {
        method: "POST",
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "invalid_response" },
    });
    expect(mocks.getChatEngine).not.toHaveBeenCalled();
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it("rejects oversized conversations before consuming quota", async () => {
    const response = await POST(
      new Request("https://wepac.pt/api/wessex/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "x".repeat(4_001) }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(mocks.getChatEngine).not.toHaveBeenCalled();
  });

  it("uses the classified status when the engine fails before streaming", async () => {
    mocks.getChatEngine.mockReturnValue(
      engineFrom(async function* () {
        throw new ChatEngineError("upstream_auth", "provider credential rejected");
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      error: { code: "upstream_auth" },
    });
    expect(mocks.recordAlert).toHaveBeenCalledWith("upstream_auth");
  });

  it("emits discriminable NDJSON and marks failures after partial text", async () => {
    mocks.getChatEngine.mockReturnValue(
      engineFrom(async function* () {
        yield { type: "text_delta", text: "Resposta parcial" };
        throw new ChatEngineError("upstream_unavailable", "socket closed");
      }),
    );

    const response = await POST(request());
    const events = parseNdjson(await response.text());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    expect(events).toEqual([
      { type: "delta", text: "Resposta parcial" },
      {
        type: "error",
        error: { code: "stream_failed", message: expect.any(String) },
      },
    ]);
    expect(mocks.recordAlert).toHaveBeenCalledWith("upstream_unavailable");
  });

  it("keeps save_lead in the direct tool continuation loop", async () => {
    let turn = 0;
    const engine = engineFrom(async function* () {
      turn += 1;
      if (turn === 1) {
        yield {
          type: "tool_use",
          id: "tool-1",
          name: "save_lead",
          inputJson: '{"name":"Ana","email":"ana@example.test"}',
        };
        yield { type: "stop", stopReason: "tool_use", content: [] };
        return;
      }
      yield { type: "text_delta", text: "Obrigada, Ana." };
      yield {
        type: "stop",
        stopReason: "end_turn",
        content: [{ type: "text", text: "Obrigada, Ana." }],
      };
    });
    mocks.getChatEngine.mockReturnValue(engine);

    const response = await POST(request());

    expect(parseNdjson(await response.text())).toEqual([
      { type: "delta", text: "Obrigada, Ana." },
      { type: "done" },
    ]);
    expect(mocks.saveLead).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ana",
        email: "ana@example.test",
        consentGiven: true,
      }),
    );
    expect(engine.runTurn).toHaveBeenCalledTimes(2);
  });
});
