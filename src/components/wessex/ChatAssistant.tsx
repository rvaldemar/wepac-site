"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Ola! Sou o assistente da WEPAC — Companhia de Artes. Posso ajudar-te com informacoes sobre os nossos projetos (Easy Peasy, Arte a Capela, Wessex), orcamentos de servicos musicais, sugestoes de repertorio, ou qualquer questao sobre a WEPAC. Como posso ajudar?",
};

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Only send user/assistant messages (skip welcome if it was never part of API context)
    const apiMessages = newMessages
      .slice(1) // skip welcome message
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/wessex/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        const content = assistantContent;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro. Por favor tente novamente ou contacte-nos em info@wepac.pt.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-[60vh] min-h-[400px] max-h-[600px] flex-col border border-wepac-white/10">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:text-wepac-white prose-a:text-wepac-gray prose-a:underline">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input area — always visible at bottom */}
      <div className="flex-shrink-0 flex gap-3 border-t border-wepac-white/10 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Escreve aqui a tua questao..."
          disabled={isStreaming}
          className="flex-1 border-b border-wepac-white/20 bg-transparent py-2 text-sm text-wepac-white outline-none transition-colors focus:border-wepac-white placeholder:text-wepac-white/30 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="bg-wepac-white px-6 py-2 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
