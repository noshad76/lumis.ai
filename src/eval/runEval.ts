import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs/promises";
import path from "node:path";

import { loadGoldenSet } from "./loadGoldenSet";
import { behaviorCheck } from "./metrics";
import { judgeWithLLM } from "./judge";
import {
  dedupeSources,
  normalizeSourceForDisplay,
  sourceInExpectedList,
} from "./sourceMatch";

const GOLDEN_PATH = path.resolve(
  process.cwd(),
  "src/eval/data/golden_set.jsonl",
);
const OUT_DIR = path.resolve(process.cwd(), "data/results");

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function getChunkSource(chunk: any): string | undefined {
  return (
    chunk?.metadata?.file_path ??
    chunk?.metadata?.source ??
    chunk?.metadata?.source_id ??
    chunk?.metadata?.filename ??
    chunk?.source ??
    undefined
  );
}

function hitAtKByFilename(
  rankedSources: string[],
  expectedSources: string[],
  k: number,
): boolean | null {
  if (!expectedSources?.length) return null;
  const topK = rankedSources.slice(0, k);
  return topK.some((src) => sourceInExpectedList(src, expectedSources));
}

function mrrByFilename(
  rankedSources: string[],
  expectedSources: string[],
): number | null {
  if (!expectedSources?.length) return null;

  const idx = rankedSources.findIndex((src) =>
    sourceInExpectedList(src, expectedSources),
  );

  if (idx === -1) return 0;
  return 1 / (idx + 1);
}

export async function runEvaluation() {
  const [{ askForEval }, { buildContext }] = await Promise.all([
    import("@/core/agent/askForEval"),
    import("@/core/retrieval/contextBuilder"),
  ]);

  const cases = await loadGoldenSet(GOLDEN_PATH);
  await fs.mkdir(OUT_DIR, { recursive: true });

  const results: any[] = [];

  for (const c of cases) {
    const t0 = Date.now();

    const out = await askForEval(c.question, []);
    const latencyMs = Date.now() - t0;

    const rawRankedSources = (out.retrieved ?? [])
      .map((chunk) => getChunkSource(chunk))
      .filter((x): x is string => Boolean(x));

    const rankedSources = dedupeSources(rawRankedSources);

    const hit3 = hitAtKByFilename(rankedSources, c.expected_sources ?? [], 3);
    const hit5 = hitAtKByFilename(rankedSources, c.expected_sources ?? [], 5);
    const rr = mrrByFilename(rankedSources, c.expected_sources ?? []);

    const citationPresent = (out.citations?.length ?? 0) > 0;
    const citationOk = c.requires_citation ? citationPresent : true;
    const behaviorOk = behaviorCheck(c.category, out.answer);
    const context = buildContext(out.retrieved ?? []);

    const judge =
      c.category === "grounded"
        ? await judgeWithLLM({
            question: c.question,
            answer: out.answer,
            context,
            category: c.category,
            expected: c.expected,
          })
        : null;

    results.push({
      id: c.id,
      category: c.category,
      question: c.question,
      expected: c.expected,
      expected_sources: c.expected_sources ?? [],
      latencyMs,
      retrieval: {
        hit3,
        hit5,
        rr,
        rankedSources,
        rankedSourceFilenames: rankedSources.map(normalizeSourceForDisplay),
      },
      checks: {
        citationPresent,
        citationOk,
        behaviorOk,
      },
      judge,
      output: {
        answer: out.answer,
        confidence: out.confidence,
        citations: out.citations,
        trace: out.trace,
      },
    });
  }

  const retrievalCases = results.filter(
    (r) => (r.expected_sources?.length ?? 0) > 0,
  );

  const hit3s = retrievalCases.map((r) => (r.retrieval.hit3 ? 1 : 0));
  const hit5s = retrievalCases.map((r) => (r.retrieval.hit5 ? 1 : 0));
  const mrrs = retrievalCases
    .map((r) => r.retrieval.rr)
    .filter((x): x is number => typeof x === "number");

  const citationRequiredCases = results.filter(
    (r) => r.category === "grounded" && r.expected_sources.length > 0,
  );
  const behaviorCases = results.filter((r) => r.checks.behaviorOk !== null);
  const judged = results.filter((r) => r.judge !== null);

  const summary = {
    total: results.length,
    retrieval: {
      evaluatedCases: retrievalCases.length,
      hitAt3: retrievalCases.length ? avg(hit3s) : null,
      hitAt5: retrievalCases.length ? avg(hit5s) : null,
      mrr: retrievalCases.length ? avg(mrrs) : null,
    },
    citations: {
      evaluatedCases: citationRequiredCases.length,
      requiredCitationSuccess: citationRequiredCases.length
        ? avg(citationRequiredCases.map((r) => (r.checks.citationOk ? 1 : 0)))
        : null,
    },
    behavior: {
      evaluatedCases: behaviorCases.length,
      behaviorOkRate: behaviorCases.length
        ? avg(behaviorCases.map((r) => (r.checks.behaviorOk ? 1 : 0)))
        : null,
    },
    judge: {
      evaluatedCases: judged.length,
      groundedPassRate: judged.length
        ? avg(judged.map((r) => (r.judge.grounded ? 1 : 0)))
        : null,
      faithfulPassRate: judged.length
        ? avg(judged.map((r) => (r.judge.faithful ? 1 : 0)))
        : null,
      correctBehaviorRate: judged.length
        ? avg(judged.map((r) => (r.judge.correct_behavior ? 1 : 0)))
        : null,
      avgScore: judged.length ? avg(judged.map((r) => r.judge.score)) : null,
    },
    performance: {
      avgLatencyMs: avg(results.map((r) => r.latencyMs)),
    },
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    results,
  };

  const outPath = path.join(OUT_DIR, `eval-${Date.now()}.json`);
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

  return {
    ...payload,
    outPath,
  };
}
