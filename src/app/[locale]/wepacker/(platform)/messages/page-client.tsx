"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useLocale } from "next-intl";
import { wp } from "@/i18n/copy/wepacker";
import { useRouter } from "@/i18n/navigation";
import { sendMessage, markAsRead } from "@/lib/wepacker/actions/message";

interface Message {
  id: string;
  conversationId: string;
  userId: string;
  body: string;
  readAt?: string;
  createdAt: string;
  deliveryState?: "sending" | "failed";
}

interface Participant {
  id: string;
  name: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  messages: Message[];
}

interface Props {
  userId: string;
  conversations: Conversation[];
}

export default function MessagesPageClient({ userId, conversations }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const [activeConvo, setActiveConvo] = useState<string | undefined>(undefined);
  const [conversationState, setConversationState] = useState(conversations);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [pendingRequest, setPendingRequest] = useState<{
    id: string;
    conversationId: string;
    body: string;
  } | null>(null);
  const [readFailure, setReadFailure] = useState<{
    conversationId: string;
    messageIds: string[];
  } | null>(null);

  useEffect(() => setConversationState(conversations), [conversations]);

  // Mobile starts on the conversation list (matches SSR, avoids hydration
  // mismatch). Only on desktop do we auto-open the first conversation —
  // decided once at mount, not re-evaluated on resize.
  useLayoutEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop && conversations.length > 0) {
      setActiveConvo(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentConvo = conversationState.find((c) => c.id === activeConvo);

  async function markMessagesRead(conversationId: string, messageIds: string[]) {
    setReadFailure(null);
    const results = await Promise.allSettled(messageIds.map((id) => markAsRead(id)));
    const succeeded = messageIds.filter((_, index) => results[index].status === "fulfilled");
    const failed = messageIds.filter((_, index) => results[index].status === "rejected");

    if (succeeded.length > 0) {
      const succeededIds = new Set(succeeded);
      setConversationState((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  succeededIds.has(message.id)
                    ? { ...message, readAt: new Date().toISOString() }
                    : message,
                ),
              }
            : conversation,
        ),
      );
      router.refresh();
    }
    if (failed.length > 0) setReadFailure({ conversationId, messageIds: failed });
  }

  async function handleOpenConvo(convo: Conversation) {
    setActiveConvo(convo.id);
    const unread = convo.messages.filter((m) => !m.readAt && m.userId !== userId);
    if (unread.length > 0) void markMessagesRead(convo.id, unread.map((m) => m.id));
  }

  async function submitMessage() {
    if (!currentConvo || !newMessage.trim() || sending) return;
    const body = newMessage.trim();
    const request =
      pendingRequest?.conversationId === currentConvo.id && pendingRequest.body === body
        ? pendingRequest
        : { id: crypto.randomUUID(), conversationId: currentConvo.id, body };
    const temporaryId = `pending-${request.id}`;
    setPendingRequest(request);
    setSending(true);
    setSendError("");
    setConversationState((current) =>
      current.map((conversation) =>
        conversation.id === request.conversationId
          ? {
              ...conversation,
              messages: conversation.messages.some((message) => message.id === temporaryId)
                ? conversation.messages.map((message) =>
                    message.id === temporaryId
                      ? { ...message, deliveryState: "sending" }
                      : message,
                  )
                : [
                    ...conversation.messages,
                    {
                      id: temporaryId,
                      conversationId: request.conversationId,
                      userId,
                      body,
                      createdAt: new Date().toISOString(),
                      deliveryState: "sending",
                    },
                  ],
            }
          : conversation,
      ),
    );
    try {
      const saved = await sendMessage(request.conversationId, body, request.id);
      setConversationState((current) =>
        current.map((conversation) =>
          conversation.id === request.conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === temporaryId
                    ? {
                    ...saved,
                    readAt: saved.readAt?.toISOString(),
                    createdAt: saved.createdAt.toISOString(),
                      }
                    : message,
                ),
              }
            : conversation,
        ),
      );
      setPendingRequest(null);
      setNewMessage("");
      router.refresh();
    } catch {
      setConversationState((current) =>
        current.map((conversation) =>
          conversation.id === request.conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === temporaryId
                    ? { ...message, deliveryState: "failed" }
                    : message,
                ),
              }
            : conversation,
        ),
      );
      setSendError(
        wp(
          locale,
          "Não foi possível enviar a mensagem. O texto foi preservado.",
          "The message could not be sent. Your text was preserved.",
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function handleBackToList() {
    setActiveConvo(undefined);
  }

  // Below `lg` this is a master/detail layout: the list and the open
  // conversation never share the row — only one pane is visible at a time.
  const listPaneClass = activeConvo ? "hidden lg:block" : "block";
  const detailPaneClass = activeConvo ? "flex" : "hidden lg:flex";

  return (
    <div className="flex h-[calc(var(--usable-viewport-height)-3.5rem)] lg:h-[var(--usable-viewport-height)]">
      {/* Conversation list */}
      <div
        className={`${listPaneClass} w-full flex-shrink-0 border-r border-wepac-border bg-wepac-black lg:w-72`}
      >
        <div className="border-b border-wepac-border p-4">
          <h1 className="font-barlow text-lg font-bold text-wepac-white">
            {wp(locale, "Mensagens", "Messages")}
          </h1>
        </div>

        <div className="overflow-y-auto">
          {conversationState.length === 0 && (
            <p className="p-4 text-sm text-wepac-text-tertiary">
              {wp(
                locale,
                "Ainda não há conversas explícitas. Só é possível iniciar uma conversa depois de ser aceite uma autorização separada para mensagens.",
                "No explicit conversations yet. Starting a conversation remains unavailable until a separate messaging grant is accepted.",
              )}
            </p>
          )}
          {conversationState.map((convo) => {
            const other = convo.participants.find((p) => p.id !== userId);
            const lastMsg = convo.messages[convo.messages.length - 1];
            const hasUnread = lastMsg && !lastMsg.readAt && lastMsg.userId !== userId;

            return (
              <button
                key={convo.id}
                onClick={() => handleOpenConvo(convo)}
                className={`min-h-11 w-full border-b border-wepac-border p-4 text-left transition-colors ${
                  activeConvo === convo.id ? "bg-wepac-card" : "hover:bg-wepac-card/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-wepac-white">
                    {other?.name ?? wp(locale, "Desconhecido", "Unknown")}
                  </span>
                  {hasUnread && <span className="h-2 w-2 rounded-full bg-wepac-white" />}
                </div>
                {lastMsg && (
                  <p className="mt-1 truncate text-xs text-wepac-text-tertiary">{lastMsg.body}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages area */}
      <div className={`${detailPaneClass} flex-1 flex-col bg-wepac-dark`}>
        {currentConvo ? (
          <>
            {/* Mobile-only back control: returns to the conversation list */}
            <div className="flex items-center gap-3 border-b border-wepac-border p-4 lg:hidden">
              <button
                onClick={handleBackToList}
                className="-m-2 flex min-h-11 items-center gap-1 p-2 text-sm text-wepac-white hover:underline"
              >
                ← {wp(locale, "Voltar", "Back")}
              </button>
              <span className="truncate font-barlow text-sm font-bold text-wepac-white">
                {currentConvo.participants.find((p) => p.id !== userId)?.name ??
                  wp(locale, "Conversa", "Conversation")}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {currentConvo.messages.map((msg) => {
                  const isOwn = msg.userId === userId;
                  const author = currentConvo.participants.find((p) => p.id === msg.userId);
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md px-4 py-3 ${
                          isOwn
                            ? "bg-wepac-white/10 text-wepac-text-secondary"
                            : "bg-wepac-card text-wepac-text-secondary"
                        }`}
                      >
                        <p className="text-xs font-medium text-wepac-text-tertiary">
                          {author?.name ?? "—"}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{msg.body}</p>
                        <p className="mt-1 text-right text-xs text-wepac-text-tertiary">
                          {new Date(msg.createdAt).toLocaleDateString(locale)}{" "}
                          {new Date(msg.createdAt).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {msg.deliveryState && (
                          <p className="mt-1 text-right text-xs text-wepac-text-tertiary" role="status">
                            {msg.deliveryState === "sending"
                              ? wp(locale, "A enviar...", "Sending...")
                              : wp(locale, "Falhou", "Failed")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {currentConvo.messages.length === 0 && (
                  <p className="text-center text-sm text-wepac-text-tertiary">
                    {wp(
                      locale,
                      "Ainda sem mensagens. Escreve a primeira.",
                      "No messages yet. Write the first one.",
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-wepac-border p-4">
              {readFailure?.conversationId === currentConvo.id && (
                <div role="alert" className="mb-3 flex items-center justify-between gap-3 text-sm text-wepac-error">
                  <span>{wp(locale, "Não foi possível marcar as mensagens como lidas.", "Messages could not be marked as read.")}</span>
                  <button
                    type="button"
                    onClick={() => void markMessagesRead(readFailure.conversationId, readFailure.messageIds)}
                    className="min-h-11 px-3 font-bold underline"
                  >
                    {wp(locale, "Tentar novamente", "Retry")}
                  </button>
                </div>
              )}
              {sendError && (
                <div role="alert" className="mb-3 flex items-center justify-between gap-3 text-sm text-wepac-error">
                  <span>{sendError}</span>
                  <button
                    type="button"
                    onClick={() => void submitMessage()}
                    className="min-h-11 px-3 font-bold underline"
                  >
                    {wp(locale, "Tentar novamente", "Retry")}
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitMessage();
                }}
                className="flex gap-3"
              >
                <textarea
                  name="message"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (sendError) setSendError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitMessage();
                    }
                  }}
                  aria-label={wp(locale, "Mensagem", "Message")}
                  autoComplete="off"
                  maxLength={10000}
                  rows={1}
                  placeholder={wp(
                    locale,
                    "Escreve uma mensagem...",
                    "Write a message...",
                  )}
                  className="min-h-11 flex-1 resize-y bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="min-h-11 bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
                >
                  {sending
                    ? wp(locale, "A enviar...", "Sending...")
                    : wp(locale, "Enviar", "Send")}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-wepac-text-tertiary">
              {wp(
                locale,
                "Seleciona uma conversa existente.",
                "Select an existing conversation.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
