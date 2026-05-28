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
    trace: [],
  });

  return {
    answer: result.answer ?? "no answer generator",
    citations: result.citations ?? [],
    confidence: 0.5,
    trace: result.trace ?? [],
  };
}
