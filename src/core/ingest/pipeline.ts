import { glob } from "glob";
import crypto from "crypto";
import path from "path";
import { env } from "../config/env";
import { chunkText } from "./chunker";
import { loadTextFile, loadPdfPages } from "./loaders";
import { IngestionStats } from "./types";
import { createCollectionIfMissing, qdrant } from "../storage/qdrant";
import { getEmbedding } from "../embed/local-embeded";
import { getSparseEmbedding } from "../embed/sparseEmbedded";

const EMBEDDING_DIMENSION = 768;
const BATCH_SIZE = 50;

type PreparedChunk = {
  text: string;
  chunk_index: number;
  page?: number;
  section?: string;
};
export function normalizeChunkText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\u0000/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .replace(/[\u202A-\u202E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const runIngestionPipeline = async (
  knowledgePath: string,
): Promise<IngestionStats> => {
  if (!env.QDRANT_COLLECTION) {
    throw new Error(
      "QDRANT_COLLECTION is not defined in environment variables.",
    );
  }

  await createCollectionIfMissing(EMBEDDING_DIMENSION);
  const normalizedPath = knowledgePath.replace(/\\/g, "/");

  const files = await glob(`${normalizedPath}/**/*.{txt,md,pdf}`);
  const stats: IngestionStats = {
    totalFiles: files.length,
    processed: 0,
    skipped: 0,
    totalChunks: 0,
  };

  for (const file of files) {
    try {
      const ext = path.extname(file).toLowerCase();
      const title = path.basename(file);

      const preparedChunks: PreparedChunk[] = [];
      let fileHashSource = "";

      if (ext === ".pdf") {
        const pages = await loadPdfPages(file);

        if (!pages.length) {
          stats.skipped++;
          continue;
        }

        fileHashSource = pages.map((p) => p.text).join("\n\n");

        let globalChunkIndex = 0;

        for (const pdfPage of pages) {
          if (!pdfPage.text?.trim()) continue;

          const chunks = chunkText({ text: pdfPage.text });

          for (const chunk of chunks) {
            preparedChunks.push({
              text: chunk,
              chunk_index: globalChunkIndex++,
              page: pdfPage.page,
            });
          }
        }
      } else {
        const content = await loadTextFile(file);

        if (!content?.trim()) {
          stats.skipped++;
          continue;
        }

        fileHashSource = content;

        const chunks = chunkText({ text: content });

        chunks.forEach((chunk, index) => {
          preparedChunks.push({
            text: chunk,
            chunk_index: index,
          });
        });
      }

      if (!preparedChunks.length) {
        stats.skipped++;
        continue;
      }

      const fileHash = crypto
        .createHash("md5")
        .update(fileHashSource)
        .digest("hex");

      const points = [];

      for (const chunk of preparedChunks) {
        try {
          const safeText = normalizeChunkText(chunk.text);

          if (!safeText) continue;

          const dense = await getEmbedding(`passage: ${safeText}`);
          const sparse = await getSparseEmbedding(safeText);
          const chunkHash = crypto
            .createHash("md5")
            .update(safeText)
            .digest("hex");
          const chunkId = crypto
            .createHash("md5")
            .update(`${fileHash}-${chunk.chunk_index}`)
            .digest("hex")
            .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

          points.push({
            id: chunkId,
            vector: {
              dense,
              sparse: { indices: sparse.indices, values: sparse.values },
            },
            payload: {
              text: safeText,
              text_raw: chunk.text,
              source_id: fileHash,
              file_path: file,
              hash: chunkHash,
              title,
              extension: ext,
              chunk_index: chunk.chunk_index,
              ...(typeof chunk.page === "number" ? { page: chunk.page } : {}),
              ...(chunk.section ? { section: chunk.section } : {}),
            },
          });
        } catch (error) {
          console.error(
            `Embedding failed for file=${title}, chunk_index=${chunk.chunk_index}, page=${chunk.page ?? "-"}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      for (let i = 0; i < points.length; i += BATCH_SIZE) {
        const batch = points.slice(i, i + BATCH_SIZE);
        await qdrant.upsert(env.QDRANT_COLLECTION, {
          wait: true,
          points: batch,
        });
      }

      stats.processed++;
      stats.totalChunks += points.length;

      console.log(`Successfully indexed: ${title} (${points.length} chunks)`);
    } catch (err) {
      stats.skipped++;
      console.error(`❌ Error processing ${file}:`);
      console.error(err);

      if (err instanceof Error) {
        console.error("message:", err.message);
        console.error("stack:", err.stack);
      }
    }
  }

  return stats;
};
