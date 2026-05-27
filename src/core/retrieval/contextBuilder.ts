import { RetrievalChunk } from "./types";

interface ContextConfig {
  maxEstimatedTokens?: number;
}

export const buildContext = (
  chunks: RetrievalChunk[],
  config: ContextConfig = {},
): string => {
  const { maxEstimatedTokens = 3000 } = config;
  if (!chunks || chunks.length === 0) {
    return "No relevant context found in the knowledge base.";
  }
  const contextSegments: string[] = [];
  let currentTokenEstimate = 0;

  for (const chunk of chunks) {
    const docTitle =
      chunk.metadata.title ||
      chunk.metadata.file_path.split("/").pop() ||
      "Untitled";
    const pageInfo = chunk.metadata.page
      ? ` | Page: ${chunk.metadata.page}`
      : "";
    const sectionInfo = chunk.metadata.section
      ? ` | Section: ${chunk.metadata.section}`
      : "";

    const header = `[Document: ${docTitle}${pageInfo}${sectionInfo} (ID: ${chunk.metadata.source_id})]`;
    const body = chunk.text.trim();
    const formattedChunk = `${header}\n${body}\n---`;
    const estimatedChunkTokens = Math.ceil(formattedChunk.length / 4);
    if (currentTokenEstimate + estimatedChunkTokens > maxEstimatedTokens) {
      break;
    }
    contextSegments.push(formattedChunk);
    currentTokenEstimate += estimatedChunkTokens;
  }
  return contextSegments.join("\n\n");
};
