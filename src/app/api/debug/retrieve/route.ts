import { buildContext } from "@/core/retrieval/contextBuilder";
import { hybridRetrive } from "@/core/retrieval/hybridSearch";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const limitStr = searchParams.get("limit");
  const filePath = searchParams.get("file_path") || undefined;
  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }
  const limit = limitStr ? parseInt(limitStr, 10) : 5;

  try {
    const rawChunks = await hybridRetrive({
      query,
      topK: limit,
      filterFilePath: filePath,
    });
    const formattedContext = buildContext(rawChunks);
    return NextResponse.json({
      success: true,
      query,
      resultsCount: rawChunks.length,
      chunks: rawChunks,
      formattedContext,
    });
  } catch (error: any) {
    console.error("QDRANT_ERROR_DETAIL:", error.getActualError?.() || error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.response?.data?.status?.error || "Check server logs",
      },
      { status: 500 },
    );
  }
};
