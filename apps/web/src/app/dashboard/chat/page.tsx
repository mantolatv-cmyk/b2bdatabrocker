"use client";

/**
 * B2B Data Broker — Chat Page (RAG Interface Preditiva)
 * Real-time chat with the Atlas AI assistant powered by DeepSeek.
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

// ── Simple Custom React Markdown Parser ──
function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, i) => {
    let content = line;

    // Headings
    let isHeader = false;
    let headerLevel = 0;
    if (content.startsWith("### ")) {
      content = content.slice(4);
      isHeader = true;
      headerLevel = 3;
    } else if (content.startsWith("## ")) {
      content = content.slice(3);
      isHeader = true;
      headerLevel = 2;
    } else if (content.startsWith("# ")) {
      content = content.slice(2);
      isHeader = true;
      headerLevel = 1;
    }

    // Lists
    let isListItem = false;
    if (content.startsWith("- ") || content.startsWith("* ")) {
      content = content.slice(2);
      isListItem = true;
    }

    // Parse Bold **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${match.index}`} className="font-extrabold text-white text-shadow-neon">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // Parse Italic *text* (used for opportunities)
    let formattedContent: React.ReactNode = parts.length > 0 ? parts : content;
    if (typeof formattedContent === "string") {
      const italicRegex = /\*(.*?)\*/g;
      let italicParts: React.ReactNode[] = [];
      let lastItIndex = 0;
      let itMatch;
      while ((itMatch = italicRegex.exec(formattedContent)) !== null) {
        if (itMatch.index > lastItIndex) {
          italicParts.push(formattedContent.substring(lastItIndex, itMatch.index));
        }
        italicParts.push(
          <em key={`italic-${itMatch.index}`} className="italic text-emerald-400 font-semibold select-all">
            {itMatch[1]}
          </em>
        );
        lastItIndex = italicRegex.lastIndex;
      }
      if (lastItIndex < formattedContent.length) {
        italicParts.push(formattedContent.substring(lastItIndex));
      }
      if (italicParts.length > 0) {
        formattedContent = italicParts;
      }
    }

    // Render wrap
    if (isHeader) {
      if (headerLevel === 1) return <h1 key={i} className="text-base sm:text-lg font-extrabold text-white mt-4 mb-2 font-display">{formattedContent}</h1>;
      if (headerLevel === 2) return <h2 key={i} className="text-sm sm:text-base font-bold text-white mt-3 mb-1.5 font-display">{formattedContent}</h2>;
      return <h3 key={i} className="text-xs sm:text-sm font-bold text-white/90 mt-2 mb-1 font-display">{formattedContent}</h3>;
    }

    if (isListItem) {
      return (
        <li key={i} className="list-disc list-inside ml-2.5 my-1 text-zinc-300">
          <span>{formattedContent}</span>
        </li>
      );
    }

    if (!line.trim()) {
      return <div key={i} className="h-2" />;
    }

    return <p key={i} className="my-1 text-zinc-300 leading-relaxed">{formattedContent}</p>;
  });
}

// ── Quick suggestion chips ──
const SUGGESTIONS = [
  { text: "Quais são os maiores riscos de mercado hoje?", label: "🛡️ Riscos Ativos" },
  { text: "Identifique oportunidades de lucro em supply chain regional", label: "🎯 Oportunidades de Lucro" },
  { text: "Explicar impactos do novo marco regulatório do Banco Central", label: "📋 Marco Regulatório" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou o **Atlas**, seu assistente de inteligência preditiva focado em **análise de risco** e *arbitragem de lucro*.\n\nPosso estimar a exposição financeira (VaR) de ameaças regulatórias ou mapear gaps deixados pela concorrência nas próximas semanas. O que vamos analisar hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  )
                );
              } else if (parsed.type === "sources") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, sources: parsed.sources }
                      : m
                  )
                );
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Desculpe, houve um erro ao processar sua pergunta. Verifique a chave do DeepSeek e tente novamente." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
      {/* Background neon glows */}
      <div className="absolute top-10 right-[-100px] w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-[-200px] w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06] select-none z-10 relative">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-emerald-400 flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          🤖
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-wide font-display">
            Atlas Intelligence
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-medium">
            Agente Preditivo Ativo • DeepSeek-Chat
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Conectado
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5 scrollbar-thin z-10 relative">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4.5 py-3.5 text-xs sm:text-sm leading-relaxed border transition-colors duration-300 ${
                  msg.role === "user"
                    ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.02)]"
                    : "glass border-white/[0.04] text-zinc-300"
                }`}
              >
                {/* Custom Markdown Parser */}
                {msg.content ? (
                  <div className="space-y-1.5">{parseMarkdown(msg.content)}</div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Calculando probabilidade e impacto...
                  </div>
                )}

                {/* Sources attachment (RAG) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-white/[0.04] space-y-2 select-none">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">
                      Fontes de Mapeamento:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[8px] bg-white/[0.03] border border-white/[0.05] text-zinc-500 font-medium font-mono"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips (Rendered only when chat is idle) */}
      {!isLoading && messages.length === 1 && (
        <div className="flex flex-wrap items-center gap-2 pb-3 select-none z-10 relative">
          {SUGGESTIONS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.text)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-white/[0.08] text-[10px] sm:text-xs font-semibold text-zinc-400 hover:text-white transition-all duration-200"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="pt-4 border-t border-white/[0.06] bg-zinc-950/20 z-10 relative">
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-3 border-white/[0.04] focus-within:border-cyan-500/20 transition-all duration-300">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Pergunte ao Atlas: estimar VaR, oportunidades ou simular cenários..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none"
            disabled={isLoading}
            autoComplete="off"
            id="chat-input"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-bold disabled:opacity-30 disabled:hover:opacity-30 hover:opacity-90 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all select-none"
            id="chat-send-btn"
          >
            Analisar
          </button>
        </div>
        <p className="text-[8px] sm:text-[9px] text-zinc-600 mt-2.5 text-center uppercase tracking-widest font-mono font-medium">
          O Atlas utiliza RAG e IA DeepSeek estruturada para projetar tendências financeiras de B2B
        </p>
      </div>
    </div>
  );
}
