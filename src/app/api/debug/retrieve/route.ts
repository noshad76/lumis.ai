import { buildContext } from "@/core/retrieval/contextBuilder";
import { hybridRetrieve } from "@/core/retrieval/hybridSearch";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const limitStr = searchParams.get("limit");

  const filePath = searchParams.get("file_path") || undefined;
  const sourceId = searchParams.get("source_id") || undefined;

  let tags: string[] | undefined = undefined;
  const rawTags = searchParams.getAll("tags");
  if (rawTags.length > 0) {
    tags = rawTags.flatMap((t) => t.split(",").map((item) => item.trim()));
  }

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  try {
    const cleanChunks = await hybridRetrieve({
      query,
      topK: limit,
      filter: {
        file_path: filePath,
        source_id: sourceId,
        tags: tags,
      },
    });

    const formattedContext = buildContext(cleanChunks);

    return NextResponse.json({
      success: true,
      query,
      resultsCount: cleanChunks.length,
      filtersApplied: {
        file_path: filePath,
        source_id: sourceId,
        tags: tags,
      },
      chunks: cleanChunks,
      formattedContext,
    });
  } catch (error: any) {
    console.error("QDRANT_ERROR_DETAIL:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred during retrieval",
        details:
          error.response?.data?.status?.error || "Check server console logs",
      },
      { status: 500 },
    );
  }
};
