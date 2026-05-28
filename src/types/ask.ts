export interface CitationDto {
  source_id: string;
  file_path: string;
  title?: string;
  page?: number;
  section?: string;
  snippet: string;
  chunk_id: string;
}

export interface TraceEventDto {
  stage: "planning" | "retrieval" | "synthesis";
  at: string;
  ok: boolean;
  meta?: Record<string, unknown>;
}

export interface AskOutputDto {
  answer: string;
  citations: CitationDto[];
  confidence: number;
  trace: TraceEventDto[];
}
