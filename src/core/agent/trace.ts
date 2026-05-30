import type { TraceEvent, TraceStage } from "./types";

export function makeTrace(
  stage: TraceStage,
  ok: boolean,
  meta?: Record<string, unknown>,
): TraceEvent {
  return {
    stage,
    ok,
    at: new Date().toISOString(),
    meta,
  };
}
