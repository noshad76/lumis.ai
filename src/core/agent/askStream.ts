import type { AskOutput, ChatTurn, TraceEvent, Citation } from "./types";
import { agentGraphPreSynthesis } from "./graph.preSynthesis";
import { verifyNode } from "./nodes/verify.node";
import { completeStream } from "../llm/llmStream";

type RetrievedLike = {
  text?: string;
  metadata?: {
    source_id?: string;
    file_path?: string;
    title?: string;
    page?: number | null;
    section?: string | null;
    chunk_index?: number | null;
  };
};

function buildContext(retrieved: RetrievedLike[], maxChars = 8000) {
  let out = "";

  retrieved.forEach((c, idx) => {
    const block =
      `[[Source ${idx + 1}]]\n` +
      `Title: ${c.metadata?.title ?? "Untitled"}\n` +
      `Path: ${c.metadata?.file_path ?? "Unknown"}\n` +
      `Content: ${c.text ?? ""}\n\n`;

    if (out.length + block.length <= maxChars) {
      out += block;
    }
  });

  return out;
}

function buildPrompt(args: {
  question: string;
  history: ChatTurn[];
  retrieved: RetrievedLike[];
}) {
  const context = buildContext(args.retrieved);

  const historyBlock = (args.history ?? [])
    .slice(-6)
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n");

  return `
You are LUMIS. You answer ONLY using the CONTEXT SOURCES.

HISTORY (not a source of facts):
${historyBlock || "None"}

CONTEXT SOURCES (numbered):
${context}

RULES:
1. A claim is allowed ONLY if a source explicitly states it.
2. Cite sources using [1], [2] where the number matches [[Source N]].
3. If NO source contains the answer, respond with "I don't know".
4. Respond in the user's language.

USER QUESTION:
${args.question}
`.trim();
}

function extractCitedIndices(text: string, maxMatches = 20): number[] {
  const seen = new Set<number>();
  const regex = /\[(\d{1,2})\]/g;

  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(text)) !== null) {
    const index = Number(match[1]);
    if (Number.isInteger(index) && index >= 1) {
      seen.add(index);
    }

    if (seen.size >= maxMatches) {
      break;
    }
  }

  return [...seen].sort((a, b) => a - b);
}

function mapRetrievedToCitation(chunk: RetrievedLike): Citation {
  return {
    source_id: chunk.metadata?.source_id ?? "",
    file_path: chunk.metadata?.file_path ?? "",
    title: chunk.metadata?.title,
    page: chunk.metadata?.page ?? null,
    section: chunk.metadata?.section ?? null,
    chunk_index: chunk.metadata?.chunk_index ?? 0,

    snippet: String(chunk.text ?? "")
      .slice(0, 250)
      .trim(),
  };
}

export async function askStream(
  question: string,
  history: ChatTurn[] = [],
  opts: {
    signal?: AbortSignal;
    emitTrace: (t: TraceEvent) => void;
    emitToken: (delta: string) => void;
    emitMeta: (m: AskOutput) => void;
  },
) {
  const trace: TraceEvent[] = [];

  const emitTrace = (event: TraceEvent) => {
    trace.push(event);
    opts.emitTrace(event);
  };

  // 1) pre-synthesis (planner + retrieval)
  const pre = await agentGraphPreSynthesis.invoke({
    userQuestion: question,
    retrieved: [],
    history,
    citations: [],
    confidence: 0,
    trace: [],
  });

  (pre.trace ?? []).forEach((event: TraceEvent) => {
    emitTrace(event);
  });

  // 2) stream synthesis tokens
  const prompt = buildPrompt({
    question,
    history,
    retrieved: (pre.retrieved ?? []) as RetrievedLike[],
  });

  let fullText = "";

  emitTrace({
    stage: "synthesis",
    at: new Date().toISOString(),
    ok: true,
    meta: { streaming: true },
  });

  for await (const delta of completeStream({
    prompt,
    temperature: 0.1,
    signal: opts.signal,
  })) {
    fullText += delta;
    opts.emitToken(delta);
  }

  // 3) map citations from cited source markers in the streamed answer
  const retrieved = (pre.retrieved ?? []) as RetrievedLike[];
  const citedIndices = extractCitedIndices(fullText);

  const citations: Citation[] =
    citedIndices.length > 0
      ? citedIndices
          .map((index) => retrieved[index - 1])
          .filter((chunk): chunk is RetrievedLike => Boolean(chunk))
          .slice(0, 6)
          .map(mapRetrievedToCitation)
      : [];

  // 4) run verifyNode on final state
  const verified = await verifyNode({
    ...pre,
    answer: fullText.trim(),
    citations,
  } as typeof pre);

  (verified.trace ?? []).forEach((event: TraceEvent) => {
    emitTrace(event);
  });

  const out: AskOutput = {
    answer: verified.answer ?? fullText.trim(),
    citations,
    confidence: verified.confidence ?? 0,
    trace,
  };

  opts.emitMeta(out);
}
