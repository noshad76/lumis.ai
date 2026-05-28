import { hybridRetrieve } from "@/core/retrieval/hybridSearch";
import type { AgentStateType } from "../state";
import type { ChatTurn, TraceEvent } from "../types";

function compactHistory(history: ChatTurn[], n = 3) {
  return history
    .slice(-n)
    .map((h) => `${h.role === "user" ? "User" : "AI"}: ${h.content}`)
    .join("\n");
}

export async function retrieverNode(state: AgentStateType) {
  const startTime = new Date().toISOString();

  try {
    const shortHistory = compactHistory(state.history ?? []);

    const queries = [state.userQuestion];

    const allResults = await Promise.all(
      queries.map((q) => hybridRetrieve({ query: q, topK: 8 })),
    );
    console.log(allResults);

    const seen = new Set<string>();
    const merged = allResults
      .flat()
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const trace: TraceEvent = {
      stage: "retrieval",
      at: startTime,
      ok: true,
      meta: {
        queryCount: queries.length,
        retrievedCount: merged.length,
        hasContext: !!shortHistory,
      },
    };

    return {
      retrieved: merged,
      trace: [trace],
    };
  } catch (error) {
    console.error("Retriever Error:", error);
    return {
      trace: [
        {
          stage: "retrieval",
          at: startTime,
          ok: false,
          meta: { error: String(error) },
        },
      ],
    };
  }
}
