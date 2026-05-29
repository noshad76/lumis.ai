import { chunkTextInput } from "./types";

export const chunkText = ({
  size = 1200,
  overlap = 200,
  text,
}: chunkTextInput): string[] => {
  const chunks: string[] = [];

  const paragraphs = text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > size) {
      const sentences = paragraph.split(/(?<=[.!?؟])\s+/g);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > size) {
          chunks.push(currentChunk.trim());
          currentChunk = currentChunk.slice(-overlap) + " " + sentence;
        } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
        }
      }
    } else {
      if (currentChunk.length + paragraph.length > size) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  return chunks.filter((c) => c.length > 100);
};
