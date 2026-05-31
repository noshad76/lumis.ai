import fs from "node:fs/promises";
import type { EvalCase } from "./types";

export async function loadGoldenSet(filePath: string): Promise<EvalCase[]> {
  const raw = await fs.readFile(filePath, "utf8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const x = JSON.parse(line) as Partial<EvalCase>;
      return {
        id: x.id ?? `case-${i + 1}`,
        question: x.question ?? "",
        category: (x.category ?? "grounded") as any,
        expected: x.expected ?? "",
        requires_citation: x.requires_citation ?? false,
        expected_sources: x.expected_sources ?? [],
      } satisfies EvalCase;
    });
}
