import { describe, it, expect } from "vitest";
import { RetrievalChunk } from "../types";
import { buildContext } from "../contextBuilder";

describe("Retrive Module Test", () => {
  const mockChunks: RetrievalChunk[] = [
    {
      id: "chunk-1",
      score: 0.033,
      text: "LUMIS.ai leverages lightweight local models.",
      metadata: {
        source_id: "doc-123",
        file_path: "knowledge/lumis_doc.txt",
        title: "lumis_doc.txt",
        hash: "xyz123hash",
        extension: "txt",
        chunk_index: 0,
        page: 1,
      },
    },
  ];
  it("should correctly format chunks into RAG-compliant context structures", () => {
    const context = buildContext(mockChunks);
    expect(context).toContain(
      "[Document: lumis_doc.txt | Page: 1 (ID: doc-123)]",
    );
    expect(context).toContain("LUMIS.ai leverages lightweight local models.");
    expect(context).toContain("---");
  });
  it("should gracefully handle empty chunks array", () => {
    const context = buildContext([]);
    expect(context).toBe("No relevant context found in the knowledge base.");
  });
});
