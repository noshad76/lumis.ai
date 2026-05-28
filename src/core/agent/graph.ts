import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode } from "./nodes/planner.node";
import { retrieverNode } from "./nodes/retriever.node";
import { synthesizeNode } from "./nodes/synthesize.node";

export const agentGraph = new StateGraph(AgentState)
  .addNode("planner", plannerNode)
  .addNode("retriever", retrieverNode)
  .addNode("synthesizer", synthesizeNode)
  .addEdge(START, "planner")
  .addEdge("planner", "retriever")
  .addEdge("retriever", "synthesizer")
  .addEdge("synthesizer", END)
  .compile();
