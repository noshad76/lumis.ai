// components/chat/MessageRow.tsx
import { UITurn } from "@/hooks/useChat";
import { Sparkles } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CitationsPanel } from "./CitationsPanel";
import { TracePanel } from "./TracePanel";

function isRTL(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function AssistantAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex-center shrink-0">
      <Sparkles size={13} className="text-primary" />
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-3.5 bg-primary/70 ml-0.5 align-middle animate-pulse" />
  );
}

export function MessageRow({
  turn,
  debugMode,
}: {
  turn: UITurn;
  debugMode: boolean;
}) {
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

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="flex-1 min-w-0 space-y-3 pt-0.5">
        <p
          dir={rtl ? "rtl" : "ltr"}
          className="text-sm text-text leading-relaxed whitespace-pre-wrap break-words"
        >
          {turn.content}
          {turn.streaming && <StreamingCursor />}
        </p>

        {/* panels only shown after streaming is done */}
        {!turn.streaming && turn.output && (
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
