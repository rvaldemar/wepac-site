import Anthropic from "@anthropic-ai/sdk";

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

export class ChatEngineError extends Error {}

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

export class DirectAnthropicEngine implements ChatEngine {
  readonly name = "direct" as const;

  private getClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      throw new ChatEngineError("Anthropic API key not configured");
    }
    return new Anthropic({ apiKey });
  }

  async *runTurn(params: ChatTurnParams): AsyncGenerator<ChatEngineEvent> {
    const client = this.getClient();

    const stream = client.messages.stream({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      system: params.system,
      tools: params.tools,
      messages: params.messages,
    });

    let toolUseId = "";
    let toolUseName = "";
    let toolInputJson = "";
    let hasToolUse = false;

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
  return typeof content === "string" ? content : null;
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
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
      throw new ChatEngineError(
        "Configuração do Agents Hub em falta (HUB_API_URL, HUB_API_KEY). Contacta o administrador."
      );
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
      });
    } catch (err) {
      console.error("[wessex:chat] hub request failed", {
        message: safeErrorMessage(err),
      });
      throw new ChatEngineError(
        "Não foi possível contactar o Agents Hub. Tenta novamente."
      );
    }

    if (response.status === 401 || response.status === 403) {
      console.error("[wessex:chat] hub request rejected (auth)", {
        status: response.status,
      });
      throw new ChatEngineError(
        "Autenticação com o Agents Hub falhou. Contacta o administrador."
      );
    }
    if (!response.ok) {
      console.error("[wessex:chat] hub request rejected", {
        status: response.status,
      });
      throw new ChatEngineError(
        "O Agents Hub recusou o pedido de chat. Tenta novamente."
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      console.error("[wessex:chat] hub response not JSON", {
        message: safeErrorMessage(err),
      });
      throw new ChatEngineError("Resposta inesperada do Agents Hub.");
    }

    const text = extractHubChatText(body);
    if (text === null) {
      console.error("[wessex:chat] hub response missing content");
      throw new ChatEngineError("Resposta inesperada do Agents Hub.");
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
  return new DirectAnthropicEngine();
}
