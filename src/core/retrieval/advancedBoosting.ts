import { RetrievalChunk } from "./types";

export function applyAdvancedBoosting(
  chunks: RetrievalChunk[],
  query: string,
): RetrievalChunk[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

  return chunks
    .map((chunk) => {
      let boost = 0;
      const text = chunk.text.toLowerCase();
      const title = chunk.metadata.title?.toLowerCase() || "";
      const section = chunk.metadata.section?.toLowerCase() || "";
      const tags = chunk.metadata.tags?.map((t) => t.toLowerCase()) ?? [];

      if (text.includes(normalizedQuery)) {
        boost += 1.5; 
      }

      let matchCount = 0;
      queryTerms.forEach((term) => {
        const isNumeric = /^\d+$/.test(term);
        
        if (tags.includes(term)) boost += 0.4;

        if (text.includes(term)) {
          matchCount++;
          boost += isNumeric ? 0.3 : 0.15;
        }

        if (title.includes(term)) boost += 0.5;
        if (section.includes(term)) boost += 0.3;
      });

      if (queryTerms.length > 0) {
        const overlapRatio = matchCount / queryTerms.length;
        boost += overlapRatio * 0.5;
      }

      return {
        ...chunk,
        score: (chunk.score || 0) + boost,
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
