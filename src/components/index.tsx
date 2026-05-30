// components/chat/index.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Bug, AlertTriangle } from "lucide-react";
import { MessageRow } from "./MessageRow";
import { EmptyState } from "./EmptyState";
import { Composer } from "./Composer";
import { useChat } from "@/hooks/useChat";

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex-center shrink-0">
        <Sparkles size={13} className="text-primary" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatClient() {
  const [question, setQuestion] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const { turns, loading, error, ask, stop } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  const handleSubmit = useCallback(() => {
    if (!question.trim()) return;
    ask(question);
    setQuestion("");
  }, [question, ask]);

  const handleSuggest = useCallback(
    (text: string) => {
      ask(text);
    },
    [ask],
  );

  const isEmpty = turns.length === 0;

  // show typing indicator only when loading and last turn isn't already streaming
  const showTyping =
    loading &&
    (turns.length === 0 || !turns[turns.length - 1]?.streaming);

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <header className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-border/50 bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex-center shadow-sm">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-text tracking-tight">
            Knowledge Assistant
          </span>
        </div>

        <button
          onClick={() => setDebugMode((d) => !d)}
          aria-pressed={debugMode}
          className={[
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
            debugMode
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:text-text hover:bg-surface-muted",
          ].join(" ")}
        >
          <Bug size={12} />
          Debug
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState onSuggest={handleSuggest} />
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {turns.map((t, i) => (
              <MessageRow key={i} turn={t} debugMode={debugMode} />
            ))}
            {showTyping && <TypingIndicator />}
            {error && <ErrorBanner message={error} />}
            <div ref={bottomRef} />
          </div>
        )}
        {isEmpty && <div ref={bottomRef} />}
      </main>

      {/* Composer */}
      <Composer
        value={question}
        onChange={setQuestion}
        onSubmit={handleSubmit}
        onStop={stop}
        loading={loading}
      />
    </div>
  );
}
