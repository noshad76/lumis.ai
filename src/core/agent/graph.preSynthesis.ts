import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
import { plannerNode } from "./nodes/planner.node";
import { retrieverNode } from "./nodes/retriever.node";

export const agentGraphPreSynthesis = new StateGraph(AgentState)
  .addNode("planner", plannerNode)
  .addNode("retriever", retrieverNode)
  .addEdge(START, "planner")
  .addEdge("planner", "retriever")
  .addEdge("retriever", END)
  .compile();
