import { RetrievalChunk } from "./types";

export interface SimilarityThresholds {
  content: number;
  source_id?: number;
}

const DEFAULT_THRESHOLDS: SimilarityThresholds = {
  content: 0.8,
};

const getJaccardSimilarity = (str1: string, str2: string): number => {
  const s1 = new Set(str1.toLowerCase().split(/\s+/));
  const s2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...s1].filter((x) => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

export const deduplicateChunks = (
  chunks: RetrievalChunk[],
  config: SimilarityThresholds = DEFAULT_THRESHOLDS,
): RetrievalChunk[] => {
  if (!chunks.length) return [];

  const uniqueChunks: RetrievalChunk[] = [];

  const seenSections = new Set<string>();

  for (const chunk of chunks) {
    const sectionKey = `${chunk.metadata.file_path}#${chunk.metadata.section || "default"}`;

    const contentHash = chunk.metadata.hash;
    if (seenSections.has(`${sectionKey}#${contentHash}`)) continue;

    const isTooSimilar = uniqueChunks.some((prevChunk) => {
      const isSameFile =
        prevChunk.metadata.file_path === chunk.metadata.file_path;
      const threshold = isSameFile ? 0.7 : config.content;

      return getJaccardSimilarity(chunk.text, prevChunk.text) > threshold;
    });

    if (!isTooSimilar) {
      uniqueChunks.push(chunk);
      seenSections.add(`${sectionKey}#${contentHash}`);
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
  const buckets: Record<string, RetrievalChunk[]> = {};

  for (const chunk of chunks) {
    const key = chunk.metadata.source_id || "unknown";
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(chunk);
  }

  const keys = Object.keys(buckets);
  while (result.length < topN && keys.length > 0) {
    for (let i = 0; i < keys.length; i++) {
      const bucket = buckets[keys[i]];
      if (bucket.length > 0) {
        result.push(bucket.shift()!);
      } else {
        keys.splice(i, 1);
        i--;
      }
      if (result.length >= topN) break;
    }
  }

  return result;
};
