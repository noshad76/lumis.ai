import { completeOnce, listLocalModels } from "@/core/llm/ollama";
import { listCollections } from "@/core/storage/qdrant";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const qdrant = await listCollections();
    const models = await listLocalModels();

    const completion = await completeOnce({
      prompt: "Say OK",
    });

    return NextResponse.json({
      ok: true,
      qdrantCollections: qdrant.collections.length,
      ollamaModels: models.models.map((m) => m.name),
      sampleCompletion: completion.text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}
