export const CHAT_ERROR_CODES = [
  "rate_limited",
  "configuration",
  "upstream_auth",
  "upstream_unavailable",
  "invalid_response",
  "stream_failed",
] as const;

export type ChatErrorCode = (typeof CHAT_ERROR_CODES)[number];

export interface ChatPublicError {
  code: ChatErrorCode;
  message: string;
  retryAfter?: number;
}

export interface ChatErrorResponse {
  error: ChatPublicError;
}

export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: ChatPublicError };

export function isChatPublicError(value: unknown): value is ChatPublicError {
  if (!value || typeof value !== "object") return false;
  const error = value as Record<string, unknown>;
  return (
    typeof error.code === "string" &&
    CHAT_ERROR_CODES.includes(error.code as ChatErrorCode) &&
    typeof error.message === "string" &&
    (error.retryAfter === undefined ||
      (typeof error.retryAfter === "number" && error.retryAfter >= 0))
  );
}

export function parseChatStreamLine(line: string): ChatStreamEvent | null {
  try {
    const value = JSON.parse(line) as Record<string, unknown>;
    if (value.type === "delta" && typeof value.text === "string") {
      return { type: "delta", text: value.text };
    }
    if (value.type === "done") return { type: "done" };
    if (value.type === "error" && isChatPublicError(value.error)) {
      return { type: "error", error: value.error };
    }
  } catch {
    return null;
  }
  return null;
}
