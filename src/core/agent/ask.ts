import { agentGraph } from "./graph";
import type { AskOutput, ChatTurn } from "./types";

export async function ask(
  question: string,
  history: ChatTurn[] = [],
): Promise<AskOutput> {
  const result = await agentGraph.invoke({
    userQuestion: question,
    retrieved: [],
    history,
    citations: [],
    confidence: 0,
    trace: [],
  });

  return {
    answer: result.answer ?? "I don't know based on the available documents.",
    citations: result.citations ?? [],
    confidence: result.confidence ?? 0,
    trace: result.trace ?? [],
  };
}
