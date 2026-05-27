export function getSparseEmbedding(text: string): {
  indices: number[];
  values: number[];
} {
  const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];

  const tokenCounts: Record<string, number> = {};
  for (const token of tokens) {
    tokenCounts[token] = (tokenCounts[token] || 0) + 1;
  }

  const indices: number[] = [];
  const values: number[] = [];
  const VOCAB_SIZE = 100000;

  for (const [token, count] of Object.entries(tokenCounts)) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    indices.push(Math.abs(hash) % VOCAB_SIZE);
    values.push(count);
  }

  return { indices, values };
}
