import { qdrant } from "../storage/qdrant";
import { env } from "../config/env";
import { getEmbedding } from "../embed/local-embeded";
import { getSparseEmbedding } from "../embed/sparseEmbedded";
import { deduplicateChunks, diversifyChunks } from "./deduplicator";
import { RetrievalChunk } from "./types";
import { applyAdvancedBoosting } from "./advancedBoosting";

export interface RetrievalOptions {
  query: string;
  topK?: number;
  filter?: {
    source_id?: string;
    file_path?: string;
    tags?: string[];
  };
}

export async function hybridRetrieve({
  query,
  topK = 5,
  filter,
}: RetrievalOptions): Promise<RetrievalChunk[]> {
  const [denseVector, sparseVector] = await Promise.all([
    getEmbedding(query),
    getSparseEmbedding(query),
  ]);

  const mustFilters: any[] = [];

  if (filter?.source_id) {
    mustFilters.push({
      key: "source_id",
      match: { value: filter.source_id },
    });
  }

  if (filter?.file_path) {
    mustFilters.push({
      key: "file_path",
      match: { value: filter.file_path },
    });
  }

  if (filter?.tags && filter.tags.length > 0) {
    mustFilters.push({
      key: "tags",
      match: { any: filter.tags },
    });
  }

  const qdrantFilter =
    mustFilters.length > 0 ? { must: mustFilters } : undefined;

  const response = await qdrant.query(env.QDRANT_COLLECTION, {
    prefetch: [
      {
        query: denseVector,
        filter: qdrantFilter,
        limit: topK * 3,
      },
      {
        query: {
          indices: sparseVector.indices,
          values: sparseVector.values,
        },
        using: "sparse",
        filter: qdrantFilter,
        limit: topK * 3,
      },
    ],
    query: { rrf: {} },
    limit: topK * 2,
    with_payload: true,
  });

  const rawChunks: RetrievalChunk[] = response.points.map((p) => {
    const payload = p.payload || {};
    return {
      id: String(p.id),
      score: p.score,
      text: (payload.text as string) || "",
      metadata: {
        source_id: (payload.source_id as string) || "unknown",
        file_path: (payload.file_path as string) || "unknown",
        title:
          (payload.title as string) ||
          (payload.file_path as string) ||
          "Untitled",
        hash: (payload.hash as string) || String(p.id),
        extension: (payload.extension as string) || "txt",
        chunk_index:
          typeof payload.chunk_index === "number" ? payload.chunk_index : 0, // اضافه شد

        // فیلدهای اختیاری:
        tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
        page: payload.page ? Number(payload.page) : undefined,
        section: (payload.section as string) || undefined,
      },
    };
  });

  let processedChunks = deduplicateChunks(rawChunks);

  processedChunks = applyAdvancedBoosting(processedChunks, query);

  const finalChunks = diversifyChunks(processedChunks, topK);

  return finalChunks;
}
