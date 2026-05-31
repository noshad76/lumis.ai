import { agentGraph } from "./graph";
import type { ChatTurn } from "./types";
import type { RetrievalChunk } from "@/core/retrieval/types";
import type { AskOutput } from "./types";

export type AskEvalOutput = AskOutput & {
  retrieved: RetrievalChunk[];
};

export async function askForEval(
  question: string,
  history: ChatTurn[] = [],
): Promise<AskEvalOutput> {
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
    retrieved: (result.retrieved ?? []) as RetrievalChunk[],
  };
}
