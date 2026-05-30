// components/chat/panels/CitationsPanel.tsx
"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronRight } from "lucide-react";
import type { AskOutput } from "@/core/agent/types";

function isRTL(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

export function CitationsPanel({
  citations,
}: {
  citations: AskOutput["citations"];
}) {
  const [open, setOpen] = useState(false);
  if (!citations.length) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-text-soft hover:bg-surface-muted transition-colors"
        aria-expanded={open}
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
            <li
              key={`${c.source_id}:${c.file_path}:${c.chunk_index}`}
              className="px-3.5 py-3 space-y-1.5 bg-bg"
            >
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
