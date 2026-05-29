import { qdrant } from "../storage/qdrant";
import { env } from "../config/env";
import { getEmbedding } from "../embed/local-embeded";
import { getSparseEmbedding } from "../embed/sparseEmbedded";
import { deduplicateChunks, diversifyChunks } from "./deduplicator";
import { RetrievalChunk,RetrievalOptions } from "./types";
import { applyAdvancedBoosting } from "./advancedBoosting";


export async function hybridRetrieve({
  query,
  topK = 20,
  topN = 10,
  filter,
}: RetrievalOptions): Promise<RetrievalChunk[]> {
  const denseQuery = `query: ${query}`;
  const [denseVector, sparseVector] = await Promise.all([
    getEmbedding(denseQuery),
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
      { query: denseVector, filter: qdrantFilter, limit: 50, using: "dense" },
      {
        query: { indices: sparseVector.indices, values: sparseVector.values },
        using: "sparse",
        filter: qdrantFilter,
        limit: 50,
      },
    ],
    query: { rrf: { weights: [0.6, 0.4] } },
    limit: topK,
    with_payload: true,
    with_vector: true,
  });

  const rawChunks: RetrievalChunk[] = response.points.map((p) => {
    const payload = p.payload || {};
    const vectors = p.vector as { dense?: number[] } | number[] | undefined;

    const denseVector = Array.isArray(vectors) ? vectors : vectors?.dense;

    return {
      id: String(p.id),
      score: p.score ?? 0,
      dense_vector: denseVector,
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
