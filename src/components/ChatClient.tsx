// components/ChatClient.tsx
"use client";

import { AskOutput, ChatTurn } from "@/core/agent/types";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Square,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Bug,
  Sparkles,
  FileText,
  Shield,
  BookOpen,
  Zap,
  MessageSquare,
  StopCircle,
} from "lucide-react";

type UITurn = ChatTurn & { output?: AskOutput };

function isRTL(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

const SUGGESTIONS = [
  {
    icon: BookOpen,
    label: "Key findings",
    text: "What are the key findings in the uploaded reports?",
  },
  {
    icon: Zap,
    label: "Summarize",
    text: "Summarize the main topics across all documents",
  },
  {
    icon: MessageSquare,
    label: "فارسی",
    text: "چه اطلاعاتی در اسناد موجود است؟",
  },
];

// ─── Root ────────────────────────────────────────────────────────────────────
export default function ChatClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<UITurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [question]);

  const onAsk = useCallback(
    async (overrideQ?: string) => {
      const q = (overrideQ ?? question).trim();
      if (!q || loading) return;

      setQuestion("");
      setError(null);
      setLoading(true);

      const history = turns
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));
      setTurns((prev) => [...prev, { role: "user", content: q }]);
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, history }),
          signal: abortRef.current.signal,
        });
        const data: AskOutput = await res.json();
        if (!res.ok) throw new Error((data as any)?.error ?? "Request failed");
        setTurns((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, output: data },
        ]);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? "Unknown error");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [question, loading, turns],
  );

  const onStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAsk();
    }
  };

  const isEmpty = turns.length === 0;
  const canSend = question.trim().length > 0 && !loading;

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* ── Header ──────────────────────────────────────────────────────── */}
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

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState onSuggest={onAsk} />
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {turns.map((t, i) => (
              <MessageRow key={i} turn={t} debugMode={debugMode} />
            ))}
            {loading && <TypingIndicator />}
            {error && <ErrorBanner message={error} />}
            <div ref={bottomRef} />
          </div>
        )}
        {isEmpty && <div ref={bottomRef} />}
      </main>

      {/* ── Composer ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-5 pt-3 bg-bg">
        <div className="max-w-2xl mx-auto">
          <div
            className={[
              "relative rounded-2xl border bg-surface shadow-sm",
              "transition-all duration-200",
              "border-border focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_var(--ring)]",
            ].join(" ")}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              dir={isRTL(question) ? "rtl" : "ltr"}
              placeholder="Message Knowledge Assistant…"
              className="w-full resize-none bg-transparent text-sm text-text placeholder:text-text-muted outline-none leading-relaxed px-4 pt-3.5 pb-12"
              style={{ minHeight: "52px" }}
            />

            {/* Bottom bar inside composer */}
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-3 pb-3">
              <span className="text-[11px] text-text-muted/50 select-none">
                <kbd className="px-1 py-0.5 rounded bg-surface-muted border border-border font-mono text-[10px]">
                  ⇧↵
                </kbd>{" "}
                new line
              </span>

              {loading ? (
                <button
                  onClick={onStop}
                  className="w-8 h-8 rounded-full bg-text flex-center hover:bg-text/80 transition-colors"
                  title="Stop generating"
                >
                  <Square size={12} fill="white" className="text-white" />
                </button>
              ) : (
                <button
                  onClick={() => onAsk()}
                  disabled={!canSend}
                  className={[
                    "w-8 h-8 rounded-full flex-center transition-all duration-150",
                    canSend
                      ? "bg-primary hover:bg-[var(--primary-hover)] shadow-sm"
                      : "bg-surface-muted cursor-not-allowed",
                  ].join(" ")}
                  title="Send message"
                >
                  <ArrowUp
                    size={14}
                    className={canSend ? "text-white" : "text-text-muted"}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[65vh] px-4 gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-text tracking-tight">
          What can I help with?
        </h1>
        <p className="text-sm text-text-muted max-w-xs">
          Ask anything about your indexed documents — in English or Persian.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {SUGGESTIONS.map(({ icon: Icon, label, text }, i) => (
          <button
            key={i}
            onClick={() => onSuggest(text)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm",
              "border border-border bg-surface text-text-soft",
              "hover:border-primary/40 hover:bg-primary/5 hover:text-text",
              "transition-all duration-150",
            ].join(" ")}
          >
            <Icon size={13} className="text-primary" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Message row (Claude-style: no bubble for assistant) ──────────────────────
function MessageRow({ turn, debugMode }: { turn: UITurn; debugMode: boolean }) {
  const isUser = turn.role === "user";
  const rtl = isRTL(turn.content);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          dir={rtl ? "rtl" : "ltr"}
          className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-surface-muted border border-border text-sm text-text leading-relaxed whitespace-pre-wrap break-words"
        >
          {turn.content}
        </div>
      </div>
    );
  }

  // Assistant — flat, no bubble
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="flex-1 min-w-0 space-y-3 pt-0.5">
        <p
          dir={rtl ? "rtl" : "ltr"}
          className="text-sm text-text leading-relaxed whitespace-pre-wrap break-words"
        >
          {turn.content}
        </p>
        {turn.output && (
          <div className="space-y-2">
            <ConfidenceBadge confidence={turn.output.confidence} />
            <CitationsPanel citations={turn.output.citations} />
            {debugMode && <TracePanel trace={turn.output.trace} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
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

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ─── Assistant avatar ─────────────────────────────────────────────────────────
function AssistantAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex-center shrink-0">
      <Sparkles size={13} className="text-primary" />
    </div>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const level = pct >= 75 ? "high" : pct >= 50 ? "mid" : "low";
  const styles = {
    high: "border-success/30 bg-green-50 text-success",
    mid: "border-blue-200  bg-blue-50  text-blue-600",
    low: "border-warning/30 bg-yellow-50 text-warning",
  }[level];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}
    >
      <Shield size={10} />
      {pct}% confidence
      {level === "low" && (
        <span className="text-text-muted font-normal">· may be inaccurate</span>
      )}
    </div>
  );
}

// ─── Citations panel ──────────────────────────────────────────────────────────
function CitationsPanel({ citations }: { citations: AskOutput["citations"] }) {
  const [open, setOpen] = useState(false);
  if (!citations.length) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-text-soft hover:bg-surface-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText size={12} className="text-primary" />
          {citations.length} source{citations.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronDown size={12} className="text-text-muted" />
        ) : (
          <ChevronRight size={12} className="text-text-muted" />
        )}
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {citations.map((c) => (
            <li key={c.chunk_id} className="px-3.5 py-3 space-y-1.5 bg-bg">
              <p className="text-xs font-semibold text-text">
                {c.title ?? "Untitled"}
              </p>
              <p className="text-[11px] font-mono text-text-muted truncate">
                {c.file_path}
              </p>
              <div className="flex gap-3 text-[11px] text-text-muted">
                <span>Page {c.page ?? "—"}</span>
                <span>·</span>
                <span>§ {c.section ?? "—"}</span>
              </div>
              <blockquote
                dir={isRTL(c.snippet) ? "rtl" : "ltr"}
                className="text-xs text-text-soft leading-relaxed border-l-2 border-primary/30 pl-3 italic"
              >
                {c.snippet}
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Trace panel ──────────────────────────────────────────────────────────────
function TracePanel({ trace }: { trace: AskOutput["trace"] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-muted transition-colors"
      >
        <span className="flex items-center gap-2">
          <Bug size={12} />
          Execution Trace
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {open && (
        <ul className="px-3.5 py-3 space-y-2 bg-bg border-t border-border">
          {trace.map((t, i) => (
            <li
              key={i}
              className="font-mono text-[11px] flex items-start gap-2.5"
            >
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${t.ok ? "bg-success" : "bg-danger"}`}
              />
              <span className="text-text-muted shrink-0 tabular-nums">
                [{t.at}]
              </span>
              <span className="text-text">{t.stage}</span>
              {t.meta && (
                <span className="text-text-muted/60 break-all">
                  {JSON.stringify(t.meta)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
