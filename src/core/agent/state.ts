import { Annotation } from "@langchain/langgraph";
import type { Plan, Citation, TraceEvent, ChatTurn } from "./types";
import type { RetrievalChunk } from "../retrieval/types";

export const AgentState = Annotation.Root({
  userQuestion: Annotation<string>(),
  plan: Annotation<Plan | undefined>(),
  retrieved: Annotation<RetrievalChunk[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  history: Annotation<ChatTurn[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),

  answer: Annotation<string | undefined>(),
  citations: Annotation<Citation[]>({
    reducer: (_, right) => right,
    default: () => [],
  }),
  trace: Annotation<TraceEvent[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;
