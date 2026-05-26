"use server";

import path from "path";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import { runIngestionPipeline } from "@/core/ingest/pipeline";

export async function ingestKnowledgeAction(formData: FormData) {
  try {
    const files = formData.getAll("files") as File[];
    const knowledgePath = path.join(process.cwd(), "knowledge");

    await fs.mkdir(knowledgePath, { recursive: true });

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(knowledgePath, file.name);
      await fs.writeFile(filePath, buffer);
    }

    const stats = await runIngestionPipeline(knowledgePath);

    revalidatePath("/ingest");

    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
