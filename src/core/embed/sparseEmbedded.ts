import { normalizeChunkText } from "../ingest/pipeline";

export async function getSparseEmbedding(text: string) {
  const tokens = normalizeChunkText(text)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);

  const counts: Record<number, number> = {};

  for (const token of tokens) {
    const hash = simpleHash(token);
    counts[hash] = (counts[hash] || 0) + 1;
  }

  const indices = Object.keys(counts).map(Number);
  const values = Object.values(counts).map((c) => Math.log1p(c));

  return { indices, values };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000000;
}
