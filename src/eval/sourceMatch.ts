import path from "node:path";

function normalizeSourceName(input: string): string {
  const cleaned = input
    .trim()
    .replace(/\\/g, "/")
    .split("?")[0]
    .split("#")[0];

  const base = path.posix.basename(cleaned);
  return base.trim().toLowerCase();
}

export function sourceMatchesExpected(
  actualSource: string | undefined | null,
  expectedSource: string | undefined | null,
): boolean {
  if (!actualSource || !expectedSource) return false;
  return normalizeSourceName(actualSource) === normalizeSourceName(expectedSource);
}

export function sourceInExpectedList(
  actualSource: string | undefined | null,
  expectedSources: string[] | undefined | null,
): boolean {
  if (!actualSource || !expectedSources?.length) return false;
  return expectedSources.some((expected) => sourceMatchesExpected(actualSource, expected));
}

export function dedupeSources(sources: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const source of sources) {
    const key = normalizeSourceName(source);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }

  return result;
}

export function normalizeSourceForDisplay(source: string): string {
  return normalizeSourceName(source);
}
