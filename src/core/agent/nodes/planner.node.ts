import type { AgentStateType } from "../state";
import type { Plan, TraceEvent } from "../types";

function buildPlan(q: string): Plan {
  const isComparison =
    /(?:\b(compare|comparison|vs\.?|versus|diff|difference)\b)|(?:\u0645\u0642\u0627\u06cc\u0633\u0647|\u062a\u0641\u0627\u0648\u062a|\u0641\u0631\u0642)/i.test(
      q,
    );
  const isSummary =
    /(?:\b(summary|summarize|summarization|outline|brief)\b)|(?:\u062e\u0644\u0627\u0635\u0647)/i.test(
      q,
    );

  if (isComparison) {
    return {
      intent: "comparison",
      needsDecomposition: true,
      subQuestions: [
        q,
        "What are the key comparison criteria?",
        "What are the main similarities and differences?",
      ],
    };
  }

  if (isSummary) {
    return {
      intent: "summary",
      needsDecomposition: false,
      subQuestions: [],
    };
  }

  return {
    intent: "factual_qa",
    needsDecomposition: false,
    subQuestions: [],
  };
}

export async function plannerNode(state: AgentStateType) {
  const plan = buildPlan(state.userQuestion);
  const trace: TraceEvent = {
    stage: "planning",
    at: new Date().toISOString(),
    ok: true,
    meta: { intent: plan.intent, subQuestions: plan.subQuestions.length },
  };

  return { plan, trace: [trace] };
}
