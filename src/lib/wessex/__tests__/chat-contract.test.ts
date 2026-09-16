import { describe, expect, it } from "vitest";
import { parseChatStreamLine } from "@/lib/wessex/chat-contract";

describe("chat stream public contract", () => {
  it("parses delta, completion, and typed error records", () => {
    expect(parseChatStreamLine('{"type":"delta","text":"Olá"}')).toEqual({
      type: "delta",
      text: "Olá",
    });
    expect(parseChatStreamLine('{"type":"done"}')).toEqual({ type: "done" });
    expect(
      parseChatStreamLine(
        '{"type":"error","error":{"code":"rate_limited","message":"safe","retryAfter":30}}',
      ),
    ).toEqual({
      type: "error",
      error: { code: "rate_limited", message: "safe", retryAfter: 30 },
    });
  });

  it("rejects malformed and unknown records", () => {
    expect(parseChatStreamLine("not-json")).toBeNull();
    expect(
      parseChatStreamLine(
        '{"type":"error","error":{"code":"internal_secret","message":"x"}}',
      ),
    ).toBeNull();
  });
});
