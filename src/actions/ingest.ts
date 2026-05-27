"use server";

import path from "path";
import fs from "fs/promises";
import { revalidatePath } from "next/cache";
import { runIngestionPipeline } from "@/core/ingest/pipeline";
import { IngestSchema } from "@/schemas/ingest"; // ایمپورت اسکیمای جدید

export async function ingestKnowledgeAction(formData: FormData) {
  // ۱. استخراج داده‌ها و اعتبارسنجی با Zod
  const rawFiles = formData.getAll("files");
  const validation = IngestSchema.safeParse({ files: rawFiles });

  if (!validation.success) {
    // برگرداندن خطاهای فیلدها به صورت ساختاریافته
    return {
      success: false,
      error:
        validation.error.flatten().fieldErrors.files?.[0] ||
        "error with file validation",
    };
  }

  const validatedFiles = validation.data.files;

  try {
    const knowledgePath = path.join(process.cwd(), "knowledge");
    await fs.mkdir(knowledgePath, { recursive: true });

    for (const file of validatedFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(knowledgePath, file.name);

      const safeFileName = path.basename(file.name);
      const safePath = path.join(knowledgePath, safeFileName);

      await fs.writeFile(safePath, buffer);
    }

    const stats = await runIngestionPipeline(knowledgePath);

    revalidatePath("/ingest");
    return { success: true, stats };
  } catch (error: any) {
    console.error("Ingestion Error:", error);
    return { success: false, error: "system error in file procesing" };
  }
}
