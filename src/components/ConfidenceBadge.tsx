// components/chat/panels/ConfidenceBadge.tsx
import { Shield } from "lucide-react";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const level = pct >= 75 ? "high" : pct >= 50 ? "mid" : "low";
  const styles = {
    high: "border-success/30 bg-green-50 text-success",
    mid: "border-blue-200 bg-blue-50 text-blue-600",
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
