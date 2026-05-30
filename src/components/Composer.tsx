// components/chat/Composer.tsx
"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";

function isRTL(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  loading: boolean;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  loading,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !loading;

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            dir={isRTL(value) ? "rtl" : "ltr"}
            placeholder="Message Knowledge Assistant…"
            disabled={false}
            className="w-full resize-none bg-transparent text-sm text-text placeholder:text-text-muted outline-none leading-relaxed px-4 pt-3.5 pb-12"
            style={{ minHeight: "52px" }}
          />

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
                aria-label="Stop generating"
              >
                <Square size={12} fill="white" className="text-white" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={!canSend}
                className={[
                  "w-8 h-8 rounded-full flex-center transition-all duration-150",
                  canSend
                    ? "bg-primary hover:bg-[var(--primary-hover)] shadow-sm"
                    : "bg-surface-muted cursor-not-allowed",
                ].join(" ")}
                title="Send message"
                aria-label="Send message"
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
  );
}
