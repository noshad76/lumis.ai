// components/chat/EmptyState.tsx
import { BookOpen, Zap, MessageSquare } from "lucide-react";

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

export function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
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
