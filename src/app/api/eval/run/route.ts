import { runEvaluation } from "@/eval/runEval";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const data = await runEvaluation();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Eval API failed:", error);
    return NextResponse.json(
      {
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
