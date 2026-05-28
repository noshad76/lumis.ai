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
  page?: number;
  section?: string;
  snippet: string;
  chunk_id: string;
}

export interface TraceEvent {
  stage: "planning" | "retrieval" | "synthesis";
  at: string;
  ok: boolean;
  meta?: Record<string, unknown>;
}

export interface AskOutput {
  answer: string;
  citations: Citation[];
  confidence: number; //Todo
  trace: TraceEvent[];
}
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}
