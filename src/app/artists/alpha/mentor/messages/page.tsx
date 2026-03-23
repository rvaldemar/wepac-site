"use client";

import { useState } from "react";
import { mockConversations, mockUsers, getArtists } from "@/data/artist-mock";

export default function MentorMessagesPage() {
  const mentorId = "m1";
  const conversations = mockConversations.filter((c) =>
    c.participants.includes(mentorId)
  );
  const [activeConvo, setActiveConvo] = useState(conversations[0]?.id);
  const [newMessage, setNewMessage] = useState("");

  const currentConvo = conversations.find((c) => c.id === activeConvo);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-wepac-border bg-wepac-black">
        <div className="border-b border-wepac-border p-4">
          <h1 className="font-cormorant text-lg font-bold text-wepac-white">
            Mensagens
          </h1>
        </div>
        <div className="overflow-y-auto">
          {conversations.map((convo) => {
            const artistId = convo.participants.find((p) => p !== mentorId);
            const artist = mockUsers.find((u) => u.id === artistId);
            const lastMsg = convo.messages[convo.messages.length - 1];
            const hasUnread = lastMsg && !lastMsg.readAt && lastMsg.userId !== mentorId;

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
                    {artist?.name ?? "—"}
                  </span>
                  {hasUnread && <span className="h-2 w-2 rounded-full bg-wepac-borgonha" />}
                </div>
                {lastMsg && (
                  <p className="mt-1 truncate text-xs text-wepac-text-tertiary">
                    {lastMsg.body}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col bg-wepac-dark">
        {currentConvo ? (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {currentConvo.messages.map((msg) => {
                  const isOwn = msg.userId === mentorId;
                  const author = mockUsers.find((u) => u.id === msg.userId);
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md rounded-lg px-4 py-3 ${
                          isOwn
                            ? "bg-wepac-borgonha/20 text-wepac-text-secondary"
                            : "bg-wepac-card text-wepac-text-secondary"
                        }`}
                      >
                        <p className="text-xs font-medium text-wepac-text-tertiary">{author?.name}</p>
                        <p className="mt-1 text-sm leading-relaxed">{msg.body}</p>
                        <p className="mt-1 text-right text-xs text-wepac-text-tertiary">
                          {new Date(msg.createdAt).toLocaleDateString("pt-PT")}{" "}
                          {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-wepac-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewMessage("");
                }}
                className="flex gap-3"
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  className="flex-1 rounded bg-wepac-input px-4 py-3 text-sm text-wepac-white placeholder-wepac-text-tertiary outline-none focus:ring-1 focus:ring-wepac-borgonha"
                />
                <button
                  type="submit"
                  className="rounded bg-wepac-borgonha px-6 py-3 text-sm font-bold text-wepac-white"
                >
                  Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-wepac-text-tertiary">Seleciona uma conversa.</p>
          </div>
        )}
      </div>
    </div>
  );
}
