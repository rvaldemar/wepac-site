"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import ReactMarkdown from "react-markdown";
import { useLocale } from "next-intl";
import { getWessexCopy } from "@/i18n/copy/institutional-wessex";
import {
  isChatPublicError,
  parseChatStreamLine,
  type ChatErrorCode,
  type ChatPublicError,
} from "@/lib/wessex/chat-contract";
import {
  clearBrowserFormDraft,
  FORM_DRAFT_KEY_PREFIX,
  readBrowserFormDraft,
  writeBrowserFormDraft,
} from "@/lib/local-form-draft";

const CHAT_DRAFT_KEY = `${FORM_DRAFT_KEY_PREFIX}:wessex-chat`;

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: { code: ChatErrorCode; partial: boolean; retryAfter?: number };
}

class ChatRequestError extends Error {
  constructor(readonly detail: ChatPublicError) {
    super(detail.code);
  }
}

export function ChatAssistant({
  onSwitchToSimulator,
}: {
  onSwitchToSimulator: () => void;
}) {
  const locale = useLocale();
  const copy = getWessexCopy(locale).chat;
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: copy.welcome },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draft = readBrowserFormDraft(CHAT_DRAFT_KEY);
    if (draft?.prompt) setInput(draft.prompt);
  }, []);

  function fallbackText(error: Message["error"]): string {
    if (error?.code === "rate_limited") {
      const wait = error.retryAfter
        ? copy.rateLimitWait(Math.max(1, Math.ceil(error.retryAfter / 60)))
        : copy.rateLimit;
      return wait;
    }
    return copy.error;
  }

  // Scroll only inside the messages container (not the page)
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming || !consentGiven) return;
    writeBrowserFormDraft(CHAT_DRAFT_KEY, { prompt: text });

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const apiMessages = newMessages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));
    let assistantMessageStarted = false;
    let assistantContent = "";

    try {
      const res = await fetch("/api/wessex/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, consentGiven }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: unknown;
        } | null;
        if (isChatPublicError(body?.error)) {
          throw new ChatRequestError(body.error);
        }
        throw new ChatRequestError({
          code: "invalid_response",
          message: "Invalid error response",
        });
      }

      if (!res.body) {
        throw new ChatRequestError({
          code: "invalid_response",
          message: "Missing response body",
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let sawDone = false;
      let streamError: ChatPublicError | null = null;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      assistantMessageStarted = true;

      while (true) {
        const { done, value } = await reader.read();
        buffered += decoder.decode(value, { stream: !done });
        const lines = buffered.split("\n");
        buffered = done ? "" : (lines.pop() ?? "");

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = parseChatStreamLine(line);
          if (!event) {
            streamError = {
              code: "invalid_response",
              message: "Invalid stream event",
            };
            break;
          }
          if (event.type === "delta") assistantContent += event.text;
          if (event.type === "done") sawDone = true;
          if (event.type === "error") streamError = event.error;

          const content = assistantContent;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content,
              ...(streamError
                ? {
                    error: {
                      code: streamError.code,
                      retryAfter: streamError.retryAfter,
                      partial: content.length > 0,
                    },
                  }
                : {}),
            };
            return updated;
          });
          if (streamError) break;
        }
        if (done || streamError) break;
      }

      if (!streamError && !sawDone) {
        streamError = {
          code: "stream_failed",
          message: "Stream ended before completion",
        };
      }
      if (streamError) {
        const error = streamError;
        const content = assistantContent;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content,
            error: {
              code: error.code,
              retryAfter: error.retryAfter,
              partial: content.length > 0,
            },
          };
          return updated;
        });
        setInput(text);
      } else {
        clearBrowserFormDraft(CHAT_DRAFT_KEY);
      }
    } catch (error) {
      const detail =
        error instanceof ChatRequestError
          ? error.detail
          : { code: "stream_failed" as const, message: "Request failed" };
      setMessages((prev) => {
        const failure: Message = {
          role: "assistant",
          content: assistantContent,
          error: {
            code: detail.code,
            retryAfter: detail.retryAfter,
            partial: assistantContent.length > 0,
          },
        };
        if (!assistantMessageStarted) return [...prev, failure];
        const updated = [...prev];
        updated[updated.length - 1] = failure;
        return updated;
      });
      setInput(text);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[350px] max-h-[700px] flex-col border border-wepac-white/10">
      {/* RGPD consent banner */}
      {!consentGiven && (
        <div className="flex-shrink-0 border-b border-wepac-white/10 p-4 bg-wepac-card">
          <p className="text-xs text-wepac-white/60 leading-relaxed">
            {copy.consent}{" "}
            <Link
              href="/privacidade"
              className="underline text-wepac-gray hover:text-wepac-white"
            >
              {copy.privacy}
            </Link>
          </p>
          <button
            onClick={() => setConsentGiven(true)}
            className="mt-2 bg-wepac-white px-4 py-1.5 font-barlow text-xs font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            {copy.accept}
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-wepac-card text-wepac-white"
                  : "border border-wepac-white/10 text-wepac-white/80"
              }`}
            >
              {msg.role === "assistant" ? (
                <>
                  {msg.content && (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:text-wepac-white prose-a:text-wepac-gray prose-a:underline">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  {msg.error && (
                    <div
                      role="alert"
                      className={`${msg.error.partial ? "mt-3 border-t" : ""} border-wepac-white/20 pt-3`}
                    >
                      {msg.error.partial && (
                        <p className="mb-2 font-semibold text-wepac-white">
                          {copy.partialResponse}
                        </p>
                      )}
                      <p>{fallbackText(msg.error)}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                        <button
                          type="button"
                          onClick={onSwitchToSimulator}
                          className="font-semibold text-wepac-white underline underline-offset-2"
                        >
                          {copy.useCalculator}
                        </button>
                        <a
                          href="mailto:info@wepac.pt"
                          className="font-semibold text-wepac-white underline underline-offset-2"
                        >
                          info@wepac.pt
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
              {isStreaming &&
                i === messages.length - 1 &&
                msg.role === "assistant" &&
                msg.content === "" && (
                  <span className="inline-block w-2 h-4 bg-wepac-white/40 animate-pulse" />
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 flex gap-3 border-t border-wepac-white/10 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={
            consentGiven
              ? copy.placeholder
              : copy.blockedPlaceholder
          }
          disabled={isStreaming || !consentGiven}
          className="flex-1 border-b border-wepac-white/20 bg-transparent py-2 text-sm text-wepac-white outline-none transition-colors focus:border-wepac-white placeholder:text-wepac-white/30 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim() || !consentGiven}
          className="bg-wepac-white px-6 py-2 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {copy.send}
        </button>
      </div>
    </div>
  );
}
