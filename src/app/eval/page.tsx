// src/app/(dashboard)/eval/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileOutput,
  ChevronDown,
  BarChart3,
  Loader2,
  History,
  RefreshCw,
} from "lucide-react";

type EvalResponse = {
  generatedAt: string;
  outPath: string;
  summary: any;
  results: any[];
};

type HistoryEntry = {
  filename: string;
  path: string;
  sizeBytes: number;
  generatedAt: string;
  summary: any;
  resultCount: number;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricBadge({ label, value }: { label: string; value: any }) {
  // label: "retrieval.hitAt3" → "Retrieval · Hit@3"
  const [group, sub] = label.includes(".")
    ? label.split(/\.(.+)/)
    : [null, label];

  const displayLabel = sub
    ? `${toTitle(group!)} · ${toTitle(sub)}`
    : toTitle(label);

  const isPercent =
    typeof value === "number" &&
    (label.includes("Rate") ||
      label.includes("Score") ||
      label.includes("mrr") ||
      label.includes("hit"));

  const display =
    typeof value === "number"
      ? isPercent
        ? `${(value * 100).toFixed(1)}%`
        : label.includes("Latency") || label.includes("latency")
          ? `${value.toFixed(0)} ms`
          : value.toFixed(3)
      : String(value ?? "—");

  return (
    <div className="surface-card flex flex-col gap-1 p-4">
      <p className="text-caption">{displayLabel}</p>
      <p className="text-headline text-primary">{display}</p>
    </div>
  );
}

function toTitle(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function StatusChip({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={12} /> Pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full">
      <AlertCircle size={12} /> Fail
    </span>
  );
}

function ResultCard({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const passed = item.checks?.passed ?? item.judge?.passed ?? null;

  return (
    <div className="surface-card p-0! overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-(--radius-sm) bg-primary-soft flex-center text-primary shrink-0 text-xs font-bold">
          {item.id ?? "#"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {item.question}
          </p>
          <p className="text-caption mt-0.5">{item.category}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {passed !== null && <StatusChip passed={passed} />}
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Clock size={12} />
            {item.latencyMs} ms
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-text-muted hover:text-text transition-colors p-1 rounded"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-caption mb-1">Expected</p>
          <p className="text-body-sm text-text">{item.expected ?? "—"}</p>
        </div>
        <div>
          <p className="text-caption mb-1">Answer</p>
          <p className="text-body-sm text-text">{item.output?.answer ?? "—"}</p>
        </div>
      </div>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {[
            { label: "Retrieval", data: item.retrieval },
            { label: "Checks", data: item.checks },
            { label: "Judge", data: item.judge },
          ].map(({ label, data }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-caption mb-2">{label}</p>
              <pre className="text-mono text-xs bg-surface-muted text-text-soft rounded-(--radius-sm) p-3 overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({
  onSelect,
  activeFilename,
}: {
  onSelect: (entry: HistoryEntry) => void;
  activeFilename: string | null;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/eval/history");
      const json = await res.json();
      setEntries(json.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="surface-card p-0! overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <History size={14} className="text-primary" />
        <span className="text-sm font-semibold text-text flex-1">History</span>
        <button
          onClick={load}
          disabled={loading}
          className="text-text-muted hover:text-text transition-colors p-1 rounded disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && entries.length === 0 && (
        <div className="flex-center py-8">
          <Loader2 size={18} className="animate-spin text-primary" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-caption text-center py-8">No runs yet</p>
      )}

      <ul className="divide-y divide-border max-h-72 overflow-y-auto">
        {entries.map((entry) => {
          const isActive = entry.filename === activeFilename;
          const date = new Date(entry.generatedAt);
          const passRate =
            entry.summary?.citationSuccessRate ??
            entry.summary?.behaviorSuccessRate ??
            null;

          return (
            <li key={entry.filename}>
              <button
                onClick={() => onSelect(entry)}
                className={`w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors ${
                  isActive ? "bg-primary-soft" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-text"}`}
                  >
                    {entry.filename}
                  </span>
                  {passRate !== null && (
                    <span className="text-xs text-text-muted shrink-0">
                      {(passRate * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-caption">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </span>
                  <span className="text-caption">·</span>
                  <span className="text-caption">
                    {entry.resultCount} cases
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvalPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EvalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0); // forces HistoryPanel refresh

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setActiveFilename(null);

    try {
      const res = await fetch("/api/eval/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Evaluation failed");
      setData(json);
      // derive filename from outPath so history highlights the new run
      const filename = json.outPath?.split("/").pop() ?? null;
      setActiveFilename(filename);
      setHistoryKey((k) => k + 1); // refresh history list
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = async (entry: HistoryEntry) => {
    setError(null);
    setActiveFilename(entry.filename);
    setLoading(true);
    try {
      const res = await fetch(`/api/eval/history/${entry.filename}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setData(json);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // جایگزین summaryEntries در EvalPage
  const summaryEntries = data?.summary
    ? Object.entries(data.summary).flatMap(([key, val]) => {
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          // nested object → flatten با prefix
          return Object.entries(val as Record<string, unknown>)
            .filter(([, v]) => typeof v === "number")
            .map(([subKey, v]) => [`${key}.${subKey}`, v] as [string, number]);
        }
        return typeof val === "number" || typeof val === "string"
          ? [[key, val] as [string, unknown]]
          : [];
      })
    : [];

  const passCount = data?.results?.filter(
    (r) => r.checks?.passed ?? r.judge?.passed,
  ).length;

  return (
    <div className="flex-1 flex flex-col p-8 gap-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption mb-1">Evaluation</p>
          <h1 className="text-title-2 text-text">Evaluation Runner</h1>
          <p className="text-body-sm mt-1">
            Run evaluation against the Golden Set and inspect retrieval and
            answer quality.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-(--radius-sm)
            bg-primary text-white text-sm font-semibold
            hover:bg-(--primary-hover) transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed shrink-0
          "
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} />
          )}
          {loading ? "Running..." : "Start Evaluation"}
        </button>
      </div>

      {/* History panel */}
      <HistoryPanel
        key={historyKey}
        onSelect={handleHistorySelect}
        activeFilename={activeFilename}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-(--radius-md) bg-danger/8 border border-danger/20 text-danger text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="surface-card flex-center flex-col gap-4 py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-body-sm">
            {activeFilename
              ? "Loading run..."
              : "Running evaluation pipeline..."}
          </p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-primary" />
              <h2 className="text-headline">Summary</h2>
              {passCount !== undefined && (
                <span className="text-caption ml-auto">
                  {passCount} / {data.results.length} passed
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {summaryEntries.map(([key, val]) => (
                <MetricBadge key={key} label={key} value={val} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-(--radius-md) bg-surface-muted border border-border text-sm">
            <FileOutput size={15} className="text-text-muted shrink-0" />
            <span className="text-caption mr-1">Saved to</span>
            <span className="text-mono text-text-soft truncate">
              {data.outPath}
            </span>
          </div>

          <div>
            <h2 className="text-headline mb-4">
              Results
              <span className="ml-2 text-sm font-normal text-text-muted">
                {data.results.length} case
                {data.results.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {data.results.map((item, i) => (
                <ResultCard key={item.id ?? i} item={item} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="surface-card flex-center flex-col gap-4 py-16 text-center">
          <div className="w-14 h-14 rounded-(--radius-lg) bg-primary-soft flex-center text-primary">
            <Play size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-text">Ready to Evaluate</p>
            <p className="text-body-sm mt-1">
              Click "Start Evaluation" to run the Golden Set through the
              pipeline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
