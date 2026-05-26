import { chunkTextInput } from "./types";

export const chunkText = ({
  size = 1000,
  overlap = 200,
  text,
}: chunkTextInput): string[] => {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  return chunks;
};
