const ignoredWords = new Set([
  "a", "an", "and", "for", "from", "in", "of", "on", "or", "the", "to", "with", "your", "best", "how", "what", "when", "where", "why",
]);

export type KeywordClusterSuggestion = { topic: string; keywords: string[] };

/**
 * Group supplied phrases by their most distinctive shared word. This is a
 * lightweight organizing aid, not search-intent classification.
 */
export function suggestKeywordClusters(input: string): KeywordClusterSuggestion[] {
  const phrases = [...new Set(input.split(/[\n,;]+/u).map((phrase) => phrase.trim()).filter(Boolean))];
  const tokensByPhrase = phrases.map((phrase) => ({
    phrase,
    tokens: [...new Set(phrase.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [])].filter((token) => !ignoredWords.has(token)),
  }));
  const frequency = new Map<string, number>();
  for (const item of tokensByPhrase) for (const token of item.tokens) frequency.set(token, (frequency.get(token) ?? 0) + 1);

  const groups = new Map<string, string[]>();
  for (const item of tokensByPhrase) {
    const anchor = item.tokens
      .filter((token) => (frequency.get(token) ?? 0) > 1)
      .sort((left, right) => (frequency.get(right) ?? 0) - (frequency.get(left) ?? 0) || left.localeCompare(right))[0];
    if (anchor) groups.set(anchor, [...(groups.get(anchor) ?? []), item.phrase]);
  }

  return [...groups.entries()]
    .filter(([, keywords]) => keywords.length > 1)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([topic, keywords]) => ({ topic: `${topic[0].toLocaleUpperCase()}${topic.slice(1)}`, keywords }));
}
