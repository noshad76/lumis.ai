// components/chat/hooks/useChat.ts
"use client";

import { useState, useRef, useCallback } from "react";
import type { AskOutput, ChatTurn, TraceEvent } from "@/core/agent/types";

export type UITurn = ChatTurn & {
  output?: AskOutput;
  streaming?: boolean;
};

function parseSSELine(line: string): { event?: string; data?: string } {
  if (line.startsWith("event:")) return { event: line.slice(6).trim() };
  if (line.startsWith("data:")) return { data: line.slice(5).trim() };
  return {};
}

export function useChat() {
  const [turns, setTurns] = useState<UITurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;

      setError(null);
      setLoading(true);

      const history: ChatTurn[] = turns
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      // add user turn
      setTurns((prev) => [...prev, { role: "user", content: q }]);

      // placeholder for streaming assistant turn
      const assistantIndex = turns.length + 1;
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: "", streaming: true },
      ]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, history }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error ?? "Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";
        let metaReceived: AskOutput | null = null;
        const traceEvents: TraceEvent[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              currentEvent = "";
              continue;
            }

            const { event, data } = parseSSELine(trimmed);

            if (event) {
              currentEvent = event;
              continue;
            }

            if (!data) continue;

            if (currentEvent === "token") {
              const parsed = JSON.parse(data) as { delta: string };
              setTurns((prev) => {
                const next = [...prev];
                const target = next[assistantIndex];
                if (target) {
                  next[assistantIndex] = {
                    ...target,
                    content: target.content + parsed.delta,
                  };
                }
                return next;
              });
            } else if (currentEvent === "trace") {
              const t = JSON.parse(data) as TraceEvent;
              traceEvents.push(t);
            } else if (currentEvent === "meta") {
              metaReceived = JSON.parse(data) as AskOutput;
            } else if (currentEvent === "error") {
              const parsed = JSON.parse(data) as { message: string };
              throw new Error(parsed.message);
            } else if (currentEvent === "done") {
              break;
            }
          }
        }

        // finalize assistant turn
        setTurns((prev) => {
          const next = [...prev];
          const target = next[assistantIndex];
          if (target && metaReceived) {
            next[assistantIndex] = {
              ...target,
              streaming: false,
              output: metaReceived,
            };
          } else if (target) {
            next[assistantIndex] = { ...target, streaming: false };
          }
          return next;
        });
      } catch (e: any) {
        if (e.name === "AbortError") {
          // mark streaming done on abort
          setTurns((prev) => {
            const next = [...prev];
            const target = next[assistantIndex];
            if (target) next[assistantIndex] = { ...target, streaming: false };
            return next;
          });
        } else {
          // remove placeholder and show error
          setTurns((prev) => prev.filter((_, i) => i !== assistantIndex));
          setError(e.message ?? "Unknown error");
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading, turns],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    setTurns([]);
    setError(null);
  }, []);

  return { turns, loading, error, ask, stop, clear };
}
