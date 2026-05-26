import { glob } from "glob";
import crypto from "crypto";
import path from "path";
import { env } from "../config/env";
import { chunkText } from "./chunker";
import { loadTextFile, loadPdfFile } from "./loaders";
import { IngestionStats } from "./types";
import { createCollectionIfMissing, qdrant } from "../storage/qdrant";
import { getEmbedding } from "../embed/local-embeded";

const EMBEDDING_DIMENSION = 384;
const BATCH_SIZE = 50;

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
      const content =
        ext === ".pdf" ? await loadPdfFile(file) : await loadTextFile(file);

      if (!content?.trim()) {
        stats.skipped++;
        continue;
      }

      const fileHash = crypto.createHash("md5").update(content).digest("hex");
      const textChunks = chunkText({ text: content });

      const points = await Promise.all(
        textChunks.map(async (text, index) => {
          const vector = await getEmbedding(text);
          const chunkId = crypto
            .createHash("md5")
            .update(`${fileHash}-${index}`)
            .digest("hex")
            .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

          return {
            id: chunkId,
            vector: vector,
            payload: {
              text,
              source_id: fileHash,
              file_path: file,
              title: path.basename(file),
              extension: ext,
              chunk_index: index,
            },
          };
        }),
      );

      for (let i = 0; i < points.length; i += BATCH_SIZE) {
        const batch = points.slice(i, i + BATCH_SIZE);
        await qdrant.upsert(env.QDRANT_COLLECTION, {
          wait: true,
          points: batch,
        });
      }

      stats.processed++;
      stats.totalChunks += points.length;
      console.log(
        `Successfully indexed: ${path.basename(file)} (${points.length} chunks)`,
      );
    } catch (err) {
      stats.skipped++;
      console.error(
        `❌ Error processing ${file}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return stats;
};
