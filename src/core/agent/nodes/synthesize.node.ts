import type { AgentStateType } from "../state";
import type { Citation, TraceEvent } from "../types";
import { completeOnce } from "../../llm/ollama";

function buildContext(state: AgentStateType, maxChars = 8000): string {
  let out = "";
  state.retrieved.forEach((c, idx) => {
    const block = `[[Source ${idx + 1}]]\nTitle: ${c.metadata.title}\nPath: ${c.metadata.file_path}\nContent: ${c.text}\n\n`;
    if (out.length + block.length <= maxChars) {
      out += block;
    }
  });
  return out;
}

export async function synthesizeNode(state: AgentStateType) {
  const startTime = new Date().toISOString();
  const context = buildContext(state);
  console.log(context);
  const historyBlock = (state.history ?? [])
    .slice(-6)
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n");

  const prompt = `
You are LUMIS. You answer ONLY using the CONTEXT SOURCES.

HISTORY (not a source of facts):
${historyBlock || "None"}

CONTEXT SOURCES (numbered):
${context}

RULES:
1. A claim is allowed ONLY if a source explicitly states it.
2. Cite sources using [1], [2] where the number matches [[SOURCE N]].
3. If NO source contains the answer, respond with "I don't know".
4. Respond in the user's language.
5. Output MUST be VALID JSON ONLY.
Return ONLY minified valid JSON.
Do not use markdown.
Do not wrap in backticks.
Do not add trailing commas.
Do not add explanations before or after the JSON.
If one source explicitly answers the question, answer from that source even if other sources are irrelevant.
Ignore irrelevant sources.
Only say "I don't know" if none of the sources contain the answer.

JSON FORMAT:
{
  "answer": "text with citations like [1]",
  "used_sources_indices": [1],
  "technical_notes": "short"
}

USER QUESTION:
${state.userQuestion}
`.trim();
  try {
    const response = await completeOnce({
      prompt,
      temperature: 0.1,
    });
    console.log(response);

    const start = response.text.indexOf("{");
    const end = response.text.lastIndexOf("}") + 1;
    const slice = response.text.slice(start, end);

    let parsed;
    try {
      parsed = JSON.parse(slice);
    } catch {
      parsed = {
        answer: response.text.trim(),
        used_sources_indices: [],
        technical_notes: "Unstructured fallback due to JSON parse failure",
      };
    }

    const citations: Citation[] = state.retrieved
      .map((c, idx) => ({ ...c, originalIdx: idx + 1 }))
      .filter((item) => parsed.used_sources_indices?.includes(item.originalIdx))
      .map((item) => ({
        source_id: item.metadata.source_id,
        file_path: item.metadata.file_path,
        title: item.metadata.title,
        page: item.metadata.page,
        section: item.metadata.section,
        snippet: item.text.slice(0, 250),
        chunk_id: item.id,
      }));

    const trace: TraceEvent = {
      stage: "synthesis",
      at: startTime,
      ok: true,
      meta: {
        model: response.model,
        citationsCount: citations.length,
        contextLength: context.length,
      },
    };

    return {
      answer: parsed.answer,
      citations,
      trace: [trace],
    };
  } catch (error) {
    return {
      answer: "unfortunately we don't have a answer",
      citations: [],
      trace: [
        {
          stage: "synthesis",
          at: startTime,
          ok: false,
          meta: { error: String(error) },
        },
      ],
    };
  }
}
