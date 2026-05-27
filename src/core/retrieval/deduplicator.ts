import { RetrievalChunk } from "./types";

export interface SimilarityThresholds {
  content: number;
  source_id?: number;
  tags?: number;
}

const DEFAULT_SIMILARITY_THRESHOLDS: SimilarityThresholds = {
  content: 0.8,
  source_id: 0.95,
};

const getJaccardSimilarity = (str1: string, str2: string): number => {
  const s1 = new Set(str1.toLowerCase().split(/\s+/));
  const s2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...s1].filter((x) => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  return intersection.size / union.size;
};

export const deduplicateChunks = (
  chunks: RetrievalChunk[],
  config: SimilarityThresholds = DEFAULT_SIMILARITY_THRESHOLDS,
): RetrievalChunk[] => {
  if (!chunks || chunks.length === 0) return [];

  const uniqueChunks: RetrievalChunk[] = [];
  const seenHashes = new Set<string>();

  for (const chunk of chunks) {
    const contentHash = hashString(chunk.text);

    if (seenHashes.has(contentHash)) continue;

    const isTooSimilar = uniqueChunks.some((prevChunk) => {
      const lengthRatio =
        Math.min(chunk.text.length, prevChunk.text.length) /
        Math.max(chunk.text.length, prevChunk.text.length);

      if (lengthRatio > config.content) {
        return (
          getJaccardSimilarity(chunk.text, prevChunk.text) > config.content
        );
      }
      return false;
    });

    if (!isTooSimilar) {
      uniqueChunks.push(chunk);
      seenHashes.add(contentHash);
    }
  }

  return uniqueChunks;
};

export const diversifyChunks = (
  chunks: RetrievalChunk[],
  topN: number,
): RetrievalChunk[] => {
  if (chunks.length <= topN) return chunks;

  const result: RetrievalChunk[] = [];
  const sourceBuckets: Record<string, RetrievalChunk[]> = {};

  for (const chunk of chunks) {
    const source = chunk.metadata.source_id || "unknown";
    if (!sourceBuckets[source]) sourceBuckets[source] = [];
    sourceBuckets[source].push(chunk);
  }

  const sourceIds = Object.keys(sourceBuckets);
  let round = 0;

  while (result.length < topN && sourceIds.length > 0) {
    for (let i = 0; i < sourceIds.length; i++) {
      const sourceId = sourceIds[i];
      const bucket = sourceBuckets[sourceId];

      if (bucket.length > 0) {
        result.push(bucket.shift()!);
      } else {
        sourceIds.splice(i, 1);
        i--;
      }

      if (result.length >= topN) break;
    }
    round++;
  }

  return result;
};

const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return "0";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(Math.abs(hash));
};
