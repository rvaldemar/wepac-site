"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, markAsRead } from "@/lib/wepacker/actions/message";

interface Message {
  id: string;
  conversationId: string;
  userId: string;
  body: string;
  readAt?: string;
  createdAt: string;
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
  const router = useRouter();
  const [activeConvo, setActiveConvo] = useState<string | undefined>(undefined);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

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

  const currentConvo = conversations.find((c) => c.id === activeConvo);

  async function handleOpenConvo(convo: Conversation) {
    setActiveConvo(convo.id);
    const unread = convo.messages.filter((m) => !m.readAt && m.userId !== userId);
    if (unread.length > 0) {
      await Promise.all(unread.map((m) => markAsRead(m.id)));
      router.refresh();
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
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Conversation list */}
      <div
        className={`${listPaneClass} w-full flex-shrink-0 border-r border-wepac-border bg-wepac-black lg:w-72`}
      >
        <div className="border-b border-wepac-border p-4">
          <h1 className="font-barlow text-lg font-bold text-wepac-white">Messages</h1>
        </div>

        <div className="overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-wepac-text-tertiary">
              No explicit Message Conversations yet. Starting a Conversation
              remains unavailable until a separate Message grant is accepted.
            </p>
          )}
          {conversations.map((convo) => {
            const other = convo.participants.find((p) => p.id !== userId);
            const lastMsg = convo.messages[convo.messages.length - 1];
            const hasUnread = lastMsg && !lastMsg.readAt && lastMsg.userId !== userId;

            return (
              <button
                key={convo.id}
                onClick={() => handleOpenConvo(convo)}
                className={`w-full border-b border-wepac-border p-4 text-left transition-colors ${
                  activeConvo === convo.id ? "bg-wepac-card" : "hover:bg-wepac-card/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-wepac-white">
                    {other?.name ?? "Desconhecido"}
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
                className="-m-2 flex items-center gap-1 p-2 text-sm text-wepac-white hover:underline"
              >
                ← Voltar
              </button>
              <span className="truncate font-barlow text-sm font-bold text-wepac-white">
                {currentConvo.participants.find((p) => p.id !== userId)?.name ?? "Conversa"}
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
                          {new Date(msg.createdAt).toLocaleDateString("pt-PT")}{" "}
                          {new Date(msg.createdAt).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {currentConvo.messages.length === 0 && (
                  <p className="text-center text-sm text-wepac-text-tertiary">
                    Ainda sem mensagens. Escreve a primeira.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-wepac-border p-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newMessage.trim() || sending) return;
                  setSending(true);
                  try {
                    await sendMessage(currentConvo.id, newMessage.trim());
                    setNewMessage("");
                    router.refresh();
                  } finally {
                    setSending(false);
                  }
                }}
                className="flex gap-3"
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  className="flex-1 bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted disabled:opacity-50"
                >
                  {sending ? "A enviar..." : "Enviar"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-wepac-text-tertiary">
              Select an existing Conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
