"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  markAsRead,
  sendMessage,
  startConversation,
} from "@/lib/wepacker/actions/message";

interface MessageRow {
  id: string;
  conversationId: string;
  userId: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

interface ConversationRow {
  id: string;
  participants: { id: string; name: string; role: string }[];
  messages: MessageRow[];
}

interface ContactRow {
  id: string;
  name: string;
  role: string;
}

interface MentorMessagesProps {
  conversations: ConversationRow[];
  contacts: ContactRow[];
  currentUserId: string;
}

export function MentorMessagesClient({
  conversations,
  contacts,
  currentUserId,
}: MentorMessagesProps) {
  const router = useRouter();
  const [activeConvo, setActiveConvo] = useState(conversations[0]?.id);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [starting, setStarting] = useState(false);

  const currentConvo = conversations.find((c) => c.id === activeConvo);

  const contactsWithoutConvo = contacts.filter(
    (contact) =>
      !conversations.some((c) => c.participants.some((p) => p.id === contact.id))
  );

  // Mark unread messages from the other participant as read when a
  // conversation is opened.
  useEffect(() => {
    if (!currentConvo) return;
    const unread = currentConvo.messages.filter(
      (m) => !m.readAt && m.userId !== currentUserId
    );
    if (unread.length === 0) return;
    Promise.all(unread.map((m) => markAsRead(m.id)))
      .then(() => router.refresh())
      .catch((e) => console.error("Failed to mark messages as read:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConvo?.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!currentConvo || !newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage(currentConvo.id, newMessage.trim());
      setNewMessage("");
      router.refresh();
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  }

  async function handleStartConversation(contactId: string) {
    setStarting(true);
    try {
      const convo = await startConversation(contactId);
      setActiveConvo(convo.id);
      setShowContacts(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to start conversation:", e);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-wepac-border bg-wepac-black">
        <div className="flex items-center justify-between border-b border-wepac-border p-4">
          <h1 className="font-barlow text-lg font-bold text-wepac-white">
            Mensagens
          </h1>
          <button
            onClick={() => setShowContacts(!showContacts)}
            className="text-xs text-wepac-white hover:underline"
          >
            + Nova
          </button>
        </div>

        {showContacts && (
          <div className="border-b border-wepac-border p-3">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-wepac-text-tertiary">
              Iniciar conversa
            </p>
            <div className="space-y-1">
              {contactsWithoutConvo.map((contact) => (
                <button
                  key={contact.id}
                  disabled={starting}
                  onClick={() => handleStartConversation(contact.id)}
                  className="block w-full px-2 py-1.5 text-left text-xs text-wepac-text-secondary hover:bg-wepac-card"
                >
                  {contact.name}
                </button>
              ))}
              {contactsWithoutConvo.length === 0 && (
                <p className="text-xs text-wepac-text-tertiary">
                  Sem novos contactos disponíveis.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="overflow-y-auto">
          {conversations.map((convo) => {
            const other = convo.participants.find((p) => p.id !== currentUserId);
            const lastMsg = convo.messages[convo.messages.length - 1];
            const hasUnread =
              lastMsg && !lastMsg.readAt && lastMsg.userId !== currentUserId;

            return (
              <button
                key={convo.id}
                onClick={() => setActiveConvo(convo.id)}
                className={`w-full border-b border-wepac-border p-4 text-left transition-colors ${
                  activeConvo === convo.id ? "bg-wepac-card" : "hover:bg-wepac-card/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-wepac-white">
                    {other?.name ?? "—"}
                  </span>
                  {hasUnread && <span className="h-2 w-2 rounded-full bg-wepac-white" />}
                </div>
                {lastMsg && (
                  <p className="mt-1 truncate text-xs text-wepac-text-tertiary">
                    {lastMsg.body}
                  </p>
                )}
              </button>
            );
          })}
          {conversations.length === 0 && (
            <p className="p-4 text-xs text-wepac-text-tertiary">
              Sem conversas ainda.
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col bg-wepac-dark">
        {currentConvo ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {currentConvo.messages.map((msg) => {
                  const isOwn = msg.userId === currentUserId;
                  const author = currentConvo.participants.find(
                    (p) => p.id === msg.userId
                  );
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 ${
                          isOwn
                            ? "bg-wepac-white/10 text-wepac-text-secondary"
                            : "bg-wepac-card text-wepac-text-secondary"
                        }`}
                      >
                        <p className="text-xs font-medium text-wepac-text-tertiary">
                          {author?.name}
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
                  <p className="text-sm text-wepac-text-tertiary">
                    Ainda sem mensagens. Diz olá.
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-wepac-border p-4">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  className="flex-1 bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-white/50"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-wepac-white px-6 py-3 text-sm font-bold text-wepac-black disabled:opacity-30"
                >
                  Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-wepac-text-tertiary">
              Seleciona uma conversa ou inicia uma nova.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
