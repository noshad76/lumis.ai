// src/app/api/eval/history/[filename]/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const RESULTS_DIR = path.join(process.cwd(), "data/results");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename: rawFilename } = await params;
  const filename = path.basename(rawFilename);

  if (!filename.endsWith(".json")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const filePath = path.join(RESULTS_DIR, filename);
    const raw = await fs.readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
