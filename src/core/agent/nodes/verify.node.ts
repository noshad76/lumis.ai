import { AgentStateType } from "../state";
import { TraceEvent, VerificationDecision, VerifyOutput } from "../types";

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeText(text: string) {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[“”"'.!,?()[\]{}:;،؟]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isUnknownLike(answer: string) {
  const t = normalizeText(answer);

  const patterns = [
    /\bi (do not|don't) know\b/,
    /\binsufficient evidence\b/,
    /\bnot enough (information|context|evidence)\b/,
    /\bunclear\b/,
    /\bcan't answer\b/,
    /\bunknown\b/,
    /نمی\s*دانم/,
    /اطلاعات\s*(کافی|کافى)\s*نیست/,
    /شواهد\s*کافی\s*نیست/,
    /نمی\s*توان(م|یم)\s*با\s*اطمینان\s*گفت/,
    /ابهام\s*دارد/,
  ];

  return patterns.some((re) => re.test(t));
}

function median(xs: number[]) {
  if (xs.length === 0) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 === 0 ? (a[mid - 1] + a[mid]) / 2 : a[mid];
}

function percentile(xs: number[], p: number) {
  if (xs.length === 0) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const idx = Math.max(
    0,
    Math.min(a.length - 1, Math.round((p / 100) * (a.length - 1))),
  );
  return a[idx];
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function computeRetrievalSignal(scores: number[]): number {
  if (scores.length === 0) return 0;
  const top1 = Math.max(...scores);
  const med = median(scores);
  const p75 = percentile(scores, 75);
  const p25 = percentile(scores, 25);
  const iqr = Math.max(1e-9, p75 - p25);

  const z = (top1 - med) / iqr;
  return clamp01(sigmoid(z - 0.5));
}
function citationSignalFromCount(n: number): number {
  return clamp01(1 - Math.exp(-0.8 * Math.max(0, n)));
}
function computeConfidence(state: AgentStateType): number {
  const answer = (state.answer ?? "").trim();
  const citationsCount = state.citations?.length ?? 0;
  const retrievedScores = (state.retrieved ?? []).map((r) => r.score ?? 0);

  if (!answer) return 0;
  if (isUnknownLike(answer)) return 0;
  if (citationsCount === 0) return 0;

  const retrievalSignal = computeRetrievalSignal(retrievedScores);
  const citationSignal = citationSignalFromCount(citationsCount);

  let conf = 0.75 * citationSignal + 0.25 * retrievalSignal;

  const intent = state.plan?.intent;
  if ((intent === "summary" || intent === "comparison") && citationsCount < 2) {
    conf *= 0.75;
  }

  const len = normalizeText(answer).length;
  if (len < 40) conf *= 0.85;

  return clamp01(Number(conf.toFixed(3)));
}

function hasUsableEvidence(state: AgentStateType) {
  const answer = (state.answer ?? "").trim();
  const citations = state.citations ?? [];

  if (!answer) return false;
  if (isUnknownLike(answer)) return false;
  if (citations.length === 0) return false;

  const hasSnippet = citations.some((c) => (c.snippet ?? "").trim().length > 0);
  const answerLengthOk = normalizeText(answer).length >= 20;

  return hasSnippet && answerLengthOk;
}

function needsClarification(state: AgentStateType) {
  const intent = state.plan?.intent ?? "unknown";
  const citationsCount = state.citations?.length ?? 0;
  const answer = state.answer ?? "";

  if (intent === "summary" || intent === "comparison") {
    if (citationsCount < 1) return true;
  }

  const t = normalizeText(answer);
  const hedgeSignals = [
    /may be/,
    /possibly/,
    /seems/,
    /appears/,
    /به\s*نظر/,
    /شاید/,
    /احتمالاً/,
  ];

  if (citationsCount === 1 && hedgeSignals.some((re) => re.test(t))) {
    return true;
  }

  return false;
}

function shouldRefuse(state: AgentStateType) {
  const answer = state.answer ?? "";
  const citationsCount = state.citations?.length ?? 0;
  if (!hasUsableEvidence(state)) return true;
  if (citationsCount === 0) return true;
  if (isUnknownLike(answer)) return true;

  return false;
}

function decide(state: AgentStateType): VerificationDecision {
  if (shouldRefuse(state)) return "refusal";
  if (needsClarification(state)) return "clarification";
  return "answer";
}

function buildFinalAnswer(
  decision: VerificationDecision,
  currentAnswer: string,
) {
  if (decision === "answer") return currentAnswer;

  if (decision === "clarification") {
    return "I found some relevant excerpts, but they are not enough to answer this confidently. Please clarify the scope, document, or section you want.";
  }

  return "I don't know based on the available documents.";
}

export async function verifyNode(state: AgentStateType):Promise<VerifyOutput> {
  const at = new Date().toISOString();

  try {
    const confidence = computeConfidence(state);
    const decision = decide(state);
    const finalAnswer = buildFinalAnswer(decision, state.answer ?? "");

    const trace: TraceEvent = {
      stage: "verification",
      at,
      ok: true,
      meta: {
        decision,
        confidence,
        citationsCount: state.citations.length,
        retrievedCount: state.retrieved.length,
        intent: state.plan?.intent ?? "unknown",
      },
    };

    return {
      answer: finalAnswer,
      confidence,
      trace: [trace],
    };
  } catch (error) {
    return {
      answer: "I don't know based on the available documents.",
      confidence: 0,
      trace: [
        {
          stage: "verification",
          at,
          ok: false,
          meta: { error: String(error) },
        },
      ],
    };
  }
}
