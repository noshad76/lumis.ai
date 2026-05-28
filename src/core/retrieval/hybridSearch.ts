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
  topN?: number;
  filter?: {
    source_id?: string;
    file_path?: string;
    tags?: string[];
  };
}

export async function hybridRetrieve({
  query,
  topK = 20,
  topN = 10,
  filter,
}: RetrievalOptions): Promise<RetrievalChunk[]> {
  const [denseVector, sparseVector] = await Promise.all([
    getEmbedding(query),
    getSparseEmbedding(query),
  ]);

  const mustFilters: any[] = [];
  if (filter?.source_id)
    mustFilters.push({ key: "source_id", match: { value: filter.source_id } });
  if (filter?.file_path)
    mustFilters.push({ key: "file_path", match: { value: filter.file_path } });
  if (filter?.tags?.length)
    mustFilters.push({ key: "tags", match: { any: filter.tags } });

  const qdrantFilter =
    mustFilters.length > 0 ? { must: mustFilters } : undefined;

  const response = await qdrant.query(env.QDRANT_COLLECTION, {
    prefetch: [
      { query: denseVector, filter: qdrantFilter, limit: topK * 20 },
      {
        query: { indices: sparseVector.indices, values: sparseVector.values },
        using: "sparse",
        filter: qdrantFilter,
        limit: topK * 20,
      },
    ],
    query: { rrf: { weights: [0.2, 0.8] } },
    limit: topK,
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
        chunk_index: Number(payload.chunk_index) || 0,
        tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
        page: payload.page ? Number(payload.page) : undefined,
        section: (payload.section as string) || undefined,
      },
    };
  });

  let processedChunks = applyAdvancedBoosting(rawChunks, query);

  processedChunks = deduplicateChunks(processedChunks);

  const finalChunks = diversifyChunks(processedChunks, topN);

  return finalChunks;
}
