import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const RESULTS_DIR = path.join(process.cwd(), "data/results");

export async function GET() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    const files = await fs.readdir(RESULTS_DIR);

    const entries = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (filename) => {
          const filePath = path.join(RESULTS_DIR, filename);
          const stat = await fs.stat(filePath);
          try {
            const raw = await fs.readFile(filePath, "utf-8");
            const parsed = JSON.parse(raw);
            return {
              filename,
              path: filePath,
              sizeBytes: stat.size,
              generatedAt: parsed.generatedAt ?? stat.mtime.toISOString(),
              summary: parsed.summary ?? null,
              resultCount: parsed.results?.length ?? 0,
            };
          } catch {
            return {
              filename,
              path: filePath,
              sizeBytes: stat.size,
              generatedAt: stat.mtime.toISOString(),
              summary: null,
              resultCount: 0,
            };
          }
        }),
    );

    // newest first
    entries.sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );

    return NextResponse.json({ entries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
