import { qdrant } from "../storage/qdrant";
import { env } from "../config/env";
import { getEmbedding } from "../embed/local-embeded";
import { getSparseEmbedding } from "../embed/sparseEmbedded";
// شما نیاز به تابعی دارید که متن را به بردار تنک تبدیل کند
// import { getSparseEmbedding } from "../embed/sparse-embedder";

export async function hybridRetrive({
  query,
  topK = 5,
  filterFilePath,
}: {
  query: string;
  topK?: number;
  filterFilePath?: string;
}) {
  // ۱. تولید بردار چگال (Dense)
  const queryVector = await getEmbedding(query);

  const sparseVector = getSparseEmbedding(query);

  const filter = filterFilePath
    ? { must: [{ key: "file_path", match: { value: filterFilePath } }] }
    : undefined;

  const response = await qdrant.query(env.QDRANT_COLLECTION, {
    prefetch: [
      {
        query: queryVector,
        filter: filter,
        limit: topK * 2,
      },
      {
        query: sparseVector,
        using: "sparse",
        filter: filter,
        limit: topK * 2,
      },
    ],
    query: {
      rrf: {},
    },
    limit: topK,
    with_payload: true,
  });

  return response.points.map((point) => ({
    id: point.id as string,
    score: point.score,
    text: (point.payload?.text as string) || "",
    metadata: {
      source_id: (point.payload?.source_id as string) || "",
      file_path: (point.payload?.file_path as string) || "",
      title: (point.payload?.title as string) || "",
      hash: (point.payload?.hash as string) || "",
      extension: (point.payload?.extension as string) || "",
      chunk_index: Number(point.payload?.chunk_index) || 0,
      page: point.payload?.page ? Number(point.payload?.page) : undefined,
    },
  }));
}
