// Path: src/core/retrieval/retrieval.test.ts

import { describe, it, expect } from "vitest";
import { RetrievalChunk } from "../types";
import { buildContext } from "../contextBuilder";
import { deduplicateChunks, diversifyChunks } from "../deduplicator";
import { applyAdvancedBoosting } from "../advancedBoosting";

describe("Retrieval Module - Comprehensive Tests", () => {
  const mockChunks: RetrievalChunk[] = [
    {
      id: "chunk-1",
      score: 0.9,
      text: "LUMIS.ai leverages lightweight local models.",
      metadata: {
        source_id: "doc-1",
        file_path: "knowledge/lumis_doc.txt",
        title: "lumis_doc.txt",
        hash: "hash-alpha",
        extension: "txt",
        chunk_index: 0,
        page: 1,
        tags: ["AI", "Architecture"],
      },
    },
    {
      id: "chunk-2",
      score: 0.85,
      text: "LUMIS.ai leverages lightweight local models.",
      metadata: {
        source_id: "doc-2",
        file_path: "other/duplicate.txt",
        title: "duplicate.txt",
        hash: "hash-alpha",
        extension: "txt",
        chunk_index: 0,
        tags: ["AI"],
      },
    },
    {
      id: "chunk-3",
      score: 0.7,
      text: "Qdrant provides high-performance vector search.",
      metadata: {
        source_id: "doc-1",
        file_path: "knowledge/lumis_doc.txt",
        title: "lumis_doc.txt",
        hash: "hash-beta",
        extension: "txt",
        chunk_index: 1,
        tags: ["Database", "Vector"],
      },
    },
  ];

  describe("Context Builder", () => {
    it("should correctly format chunks into RAG-compliant context structures", () => {
      const context = buildContext([mockChunks[0]]);
      expect(context).toContain(
        "[Document: lumis_doc.txt | Page: 1 (ID: doc-1)]",
      );
      expect(context).toContain("LUMIS.ai leverages lightweight local models.");
      expect(context).toContain("---");
    });

    it("should gracefully handle empty chunks array", () => {
      const context = buildContext([]);
      expect(context).toBe("No relevant context found in the knowledge base.");
    });
  });

  describe("Deduplication Logic", () => {
    it("should remove chunks with identical content hashes", () => {
      const result = deduplicateChunks(mockChunks);
      expect(result.length).toBe(2);
      expect(result.map((c) => c.id)).not.toContain("chunk-2");
    });
  });

  describe("Diversity Logic", () => {
    it("should prioritize different sources when limit is reached", () => {
      const result = diversifyChunks(mockChunks, 2);
      const sourceIds = result.map((c) => c.metadata.source_id);

      expect(sourceIds).toContain("doc-1");
      expect(sourceIds).toContain("doc-2");
      expect(result.length).toBe(2);
    });
  });

  describe("Advanced Keyword Boosting", () => {
    it("should increase score when query terms match metadata tags", () => {
      const query = "Database";
      const boosted = applyAdvancedBoosting(mockChunks, query);

      const chunk3 = boosted.find((c) => c.id === "chunk-3");
      const chunk1 = boosted.find((c) => c.id === "chunk-1");

      expect(chunk3!.score).toBeGreaterThan(0.7);
      expect(boosted[0].id).toBe("chunk-3");
    });
  });
});
