import { RetrievalChunk } from "./types";

export function applyAdvancedBoosting(
  chunks: RetrievalChunk[],
  query: string,
): RetrievalChunk[] {
  const queryTerms = query.toLowerCase().split(/\s+/);

  return chunks
    .map((chunk) => {
      let boost = 0;
      const text = chunk.text.toLowerCase();
      const tags = chunk.metadata.tags.map((t) => t.toLowerCase());
      queryTerms.forEach((term) => {
        if (tags.includes(term)) boost += 0.5;
        if (text.includes(term)) boost += 0.1;
      });

      return {
        ...chunk,
        score: (chunk.score || 0) + boost,
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
