// components/chat/panels/TracePanel.tsx
"use client";

import { useState } from "react";
import { Bug, ChevronDown, ChevronRight } from "lucide-react";
import type { AskOutput } from "@/core/agent/types";

export function TracePanel({ trace }: { trace: AskOutput["trace"] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-muted transition-colors"
        aria-expanded={open}
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
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  t.ok ? "bg-success" : "bg-danger"
                }`}
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
