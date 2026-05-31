export type EvalCategory = "grounded" | "out_of_scope" | "missing_info" | "safety";

export type EvalCase = {
  id: string;
  question: string;
  category: EvalCategory;
  expected: string;
  requires_citation: boolean;
  expected_sources?: string[];
};

export type JudgeResult = {
  grounded: boolean;
  faithful: boolean;
  correct_behavior: boolean;
  score: number;
  reason: string;
};
