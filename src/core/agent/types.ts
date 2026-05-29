export type Intent = "factual_qa" | "summary" | "comparison" | "unknown";

export interface Plan {
  intent: Intent;
  subQuestions: string[];
  needsDecomposition: boolean;
}

export interface Citation {
  source_id: string;
  file_path: string;
  title?: string;
  page?: number | null;
  section?: string | null;
  chunk_index: number;
  snippet: string;
}
export type TraceStage =
  | "planning"
  | "retrieval"
  | "synthesis"
  | "verification";

export interface TraceEvent {
  stage: TraceStage;
  at: string;
  ok: boolean;
  meta?: Record<string, unknown>;
}

export interface AskOutput {
  answer: string;
  citations: Citation[];
  confidence: number;
  trace: TraceEvent[];
}
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}
export type VerificationDecision = "answer" | "refusal" | "clarification";
