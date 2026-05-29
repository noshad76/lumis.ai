import { RetrievalChunk } from "./types";

export interface SimilarityThresholds {
  content: number;
  sameFile?: number;
}

const DEFAULT_THRESHOLDS: SimilarityThresholds = {
  content: 0.95,
  sameFile: 0.9,
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a.length || !b.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const deduplicateChunks = (
  chunks: RetrievalChunk[],
  config: SimilarityThresholds = DEFAULT_THRESHOLDS,
): RetrievalChunk[] => {
  if (!chunks.length) return [];

  const uniqueChunks: RetrievalChunk[] = [];
  const seenHashes = new Set<string>();

  for (const chunk of chunks) {
    const filePath = chunk.metadata.file_path || "";
    const section = chunk.metadata.section || "default";
    const hash = chunk.metadata.hash;

    if (hash) {
      const exactKey = `${filePath}#${section}#${hash}`;
      if (seenHashes.has(exactKey)) continue;
      seenHashes.add(exactKey);
    }

    const isTooSimilar = uniqueChunks.some((prevChunk) => {
      if (!chunk.dense_vector || !prevChunk.dense_vector) return false;

      const isSameFile =
        !!prevChunk.metadata.file_path &&
        !!chunk.metadata.file_path &&
        prevChunk.metadata.file_path === chunk.metadata.file_path;

      const threshold = isSameFile
        ? (config.sameFile ?? config.content)
        : config.content;

      return (
        cosineSimilarity(chunk.dense_vector, prevChunk.dense_vector) >=
        threshold
      );
    });

    if (!isTooSimilar) {
      uniqueChunks.push(chunk);
    }
  }

  return uniqueChunks;
};

export const diversifyChunks = (
  chunks: RetrievalChunk[],
  topN: number,
): RetrievalChunk[] => {
  if (chunks.length <= topN) return chunks;

  const buckets = new Map<string, RetrievalChunk[]>();

  for (const chunk of chunks) {
    const key =
      chunk.metadata.source_id || chunk.metadata.file_path || "unknown";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(chunk);
  }

  const result: RetrievalChunk[] = [];
  const activeKeys = [...buckets.keys()];

  while (result.length < topN && activeKeys.length > 0) {
    for (let i = 0; i < activeKeys.length; i++) {
      const key = activeKeys[i];
      const bucket = buckets.get(key)!;

      if (bucket.length === 0) {
        activeKeys.splice(i, 1);
        i--;
        continue;
      }

      result.push(bucket.shift()!);

      if (result.length >= topN) break;
    }
  }

  return result;
};
