import Anthropic, { APIConnectionError } from "@anthropic-ai/sdk";
import type { ChatErrorCode } from "@/lib/wessex/chat-contract";

// Two-impl seam for the public Wessex chat (src/app/api/wessex/chat/route.ts):
// DirectAnthropicEngine calls the Anthropic API directly (today's behavior,
// unchanged); HubChatEngine routes through the Agents Hub's generic chat
// endpoint (green-lit by the Hub side to be used as-is — same
// HUB_API_URL/HUB_API_KEY env pair as HubDebriefEngine, see
// src/lib/wepacker/debrief/hub.ts). Selected via env WESSEX_ENGINE.
//
// Scope note: the Hub's POST /api/v1/llm/chat is a plain completion
// endpoint (no tool-calling contract confirmed yet) — HubChatEngine
// therefore never emits a "tool_use" event, so the save_lead tool loop in
// route.ts is only ever exercised by DirectAnthropicEngine in this phase.
// This is a deliberate v1 tradeoff (T1/M ticket), not a bug: a lead is
// simply not captured server-side when WESSEX_ENGINE=hub, until the Hub
// side confirms a tool-calling shape for this endpoint.

export class ChatEngineError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string,
    readonly retryAfter?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ChatEngineError";
  }
}

function retryAfterSeconds(headers: unknown): number | undefined {
  let value: string | null | undefined;
  if (headers instanceof Headers) value = headers.get("retry-after");
  else if (headers && typeof headers === "object") {
    const record = headers as Record<string, unknown>;
    const raw = record["retry-after"] ?? record["Retry-After"];
    if (typeof raw === "string") value = raw;
  }
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined;
}

function classifyUpstreamError(error: unknown): ChatEngineError {
  if (error instanceof ChatEngineError) return error;
  const status =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: unknown }).status
      : undefined;
  const headers =
    error && typeof error === "object" && "headers" in error
      ? (error as { headers?: unknown }).headers
      : undefined;
  if (status === 401 || status === 403) {
    return new ChatEngineError("upstream_auth", "Upstream authentication rejected", undefined, { cause: error });
  }
  if (status === 429) {
    return new ChatEngineError("rate_limited", "Upstream rate limit reached", retryAfterSeconds(headers), { cause: error });
  }
  if (typeof status === "number" && status >= 500) {
    return new ChatEngineError("upstream_unavailable", "Upstream service unavailable", undefined, { cause: error });
  }
  if (error instanceof APIConnectionError) {
    return new ChatEngineError("upstream_unavailable", "Upstream connection failed", undefined, { cause: error });
  }
  return new ChatEngineError("stream_failed", "Upstream stream failed", undefined, { cause: error });
}

// A single conversation turn as sent to either engine. `system` and
// `tools` are passed through unchanged to the Anthropic SDK by
// DirectAnthropicEngine; HubChatEngine forwards `system` and flattens
// `messages` to plain text content (tool blocks are dropped, see the
// scope note above) and ignores `tools` since the Hub endpoint has no
// confirmed tool-calling contract yet.
export interface ChatTurnParams {
  system: string;
  tools?: Anthropic.Tool[];
  messages: Anthropic.MessageParam[];
}

// Mirrors the shape the current route already switches on while
// streaming the Anthropic SDK's own event stream, so DirectAnthropicEngine
// can forward it near-verbatim:
// - "text_delta": one chunk of assistant text, in order — enqueue as-is.
// - "tool_use": a completed tool call (id/name/inputJson) — the route
//   still owns actually executing the tool (save_lead) and building the
//   tool_result continuation message, exactly as before.
// - "stop": terminates the turn. `content` is the full assistant content
//   block array for this turn (needed verbatim to build the next
//   "assistant" message when continuing the tool loop).
export type ChatEngineEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; id: string; name: string; inputJson: string }
  | {
      type: "stop";
      stopReason: string | null;
      content: Anthropic.MessageParam["content"];
    };

export interface ChatEngine {
  readonly name: "direct" | "hub";
  runTurn(params: ChatTurnParams): AsyncGenerator<ChatEngineEvent>;
}

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const UPSTREAM_TIMEOUT_MS = 30_000;

export class DirectAnthropicEngine implements ChatEngine {
  readonly name = "direct" as const;

  private getClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      throw new ChatEngineError("configuration", "Anthropic API key not configured");
    }
    return new Anthropic({ apiKey, timeout: UPSTREAM_TIMEOUT_MS, maxRetries: 1 });
  }

  async *runTurn(params: ChatTurnParams): AsyncGenerator<ChatEngineEvent> {
    const client = this.getClient();

    let toolUseId = "";
    let toolUseName = "";
    let toolInputJson = "";
    let hasToolUse = false;

    try {
      const stream = client.messages.stream({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        system: params.system,
        tools: params.tools,
        messages: params.messages,
      });

      for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text_delta", text: event.delta.text };
      }
      if (
        event.type === "content_block_start" &&
        event.content_block.type === "tool_use"
      ) {
        hasToolUse = true;
        toolUseId = event.content_block.id;
        toolUseName = event.content_block.name;
        toolInputJson = "";
      }
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "input_json_delta"
      ) {
        toolInputJson += event.delta.partial_json;
      }
      }

      const finalMessage = await stream.finalMessage();

      if (finalMessage.stop_reason === "tool_use" && hasToolUse) {
        yield {
          type: "tool_use",
          id: toolUseId,
          name: toolUseName,
          inputJson: toolInputJson,
        };
      }

      yield {
        type: "stop",
        stopReason: finalMessage.stop_reason,
        content: finalMessage.content,
      };
    } catch (error) {
      throw classifyUpstreamError(error);
    }
  }
}

// Flattens an Anthropic MessageParam content value down to plain text for
// the Hub's generic chat endpoint — it has no confirmed contract for
// structured content blocks (tool_use / tool_result), so those blocks are
// simply dropped here (see the module-level scope note).
function flattenContent(content: Anthropic.MessageParam["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((block): block is Anthropic.TextBlockParam => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function extractHubChatText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  const content = (data as Record<string, unknown>).content;
  return typeof content === "string" && content.trim() ? content : null;
}

export class HubChatEngine implements ChatEngine {
  readonly name = "hub" as const;

  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    const apiUrl = process.env.HUB_API_URL;
    const apiKey = process.env.HUB_API_KEY;

    // Fail-loud at construction, never a silent fallback to the direct
    // engine — same contract as HubDebriefEngine.
    if (!apiUrl || !apiKey) {
      throw new ChatEngineError("configuration", "Agents Hub configuration missing");
    }

    this.apiUrl = apiUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  // The Hub's chat endpoint is not (yet) a streaming SSE contract on our
  // side, so this engine yields the full response as a single text_delta
  // rather than incremental token chunks — an acceptable v1 UX tradeoff
  // for a low-traffic informational chat (the direct engine keeps true
  // streaming intact).
  async *runTurn(params: ChatTurnParams): AsyncGenerator<ChatEngineEvent> {
    const url = `${this.apiUrl}/api/v1/llm/chat`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system: params.system,
          messages: params.messages.map((m) => ({
            role: m.role,
            content: flattenContent(m.content),
          })),
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch (err) {
      throw new ChatEngineError("upstream_unavailable", "Agents Hub request failed", undefined, { cause: err });
    }

    if (response.status === 401 || response.status === 403) {
      throw new ChatEngineError("upstream_auth", `Agents Hub authentication rejected (${response.status})`);
    }
    if (response.status === 429) {
      throw new ChatEngineError(
        "rate_limited",
        "Agents Hub rate limit reached",
        retryAfterSeconds(response.headers),
      );
    }
    if (!response.ok) {
      throw new ChatEngineError("upstream_unavailable", `Agents Hub rejected request (${response.status})`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      throw new ChatEngineError("invalid_response", "Agents Hub response is not JSON", undefined, { cause: err });
    }

    const text = extractHubChatText(body);
    if (text === null) {
      throw new ChatEngineError("invalid_response", "Agents Hub response has no content");
    }

    yield { type: "text_delta", text };
    yield {
      type: "stop",
      stopReason: "end_turn",
      content: [{ type: "text", text }],
    };
  }
}

// env WESSEX_ENGINE ("direct" | "hub"), default "direct". "hub" fails
// loud at construction (not here) when its own env vars are missing —
// see HubChatEngine's constructor — never a silent fallback to direct.
export function getChatEngine(): ChatEngine {
  const impl = process.env.WESSEX_ENGINE;
  if (impl === "hub") return new HubChatEngine();
  if (!impl || impl === "direct") return new DirectAnthropicEngine();
  throw new ChatEngineError("configuration", `Unsupported WESSEX_ENGINE value: ${impl}`);
}
