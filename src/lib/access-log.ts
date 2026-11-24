export type AccessLogEntry = { line: number; host: string; timestamp: string; method: string; path: string; status: number; bytes: number | null; bot: string; userAgent: string };
export type AccessLogParseResult = { entries: AccessLogEntry[]; ignoredLines: number; truncated: boolean };

const logPattern = /^(\S+) \S+ \S+ \[([^\]]+)\] "([A-Z]+) (.*?) HTTP\/[\d.]+" (\d{3}) (\d+|-) "[^"]*" "([^"]*)"$/;

export function classifyCrawler(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/googlebot|google-inspectiontool/.test(ua)) return "Googlebot";
  if (/bingbot|msnbot/.test(ua)) return "Bingbot";
  if (/duckduckbot/.test(ua)) return "DuckDuckBot";
  if (/yandexbot/.test(ua)) return "YandexBot";
  if (/baiduspider/.test(ua)) return "Baiduspider";
  if (/applebot/.test(ua)) return "Applebot";
  if (/gptbot|chatgpt-user|oai-searchbot/.test(ua)) return "OpenAI crawler";
  if (/claudebot|claude-web/.test(ua)) return "Anthropic crawler";
  if (/perplexitybot/.test(ua)) return "PerplexityBot";
  if (/bot|crawler|spider|slurp/.test(ua)) return "Other crawler";
  return "Non-crawler";
}

export function parseAccessLog(text: string, maxLines = 20_000): AccessLogParseResult {
  const lines = text.split(/\r?\n/);
  const truncated = lines.length > maxLines;
  const bounded = lines.slice(0, maxLines);
  const entries: AccessLogEntry[] = [];
  let ignoredLines = 0;
  bounded.forEach((line, index) => {
    if (!line.trim()) return;
    const match = logPattern.exec(line);
    if (!match) { ignoredLines++; return; }
    const [, host, timestamp, method, rawPath, status, bytes, userAgent] = match;
    entries.push({ line: index + 1, host, timestamp, method, path: rawPath, status: Number(status), bytes: bytes === "-" ? null : Number(bytes), bot: classifyCrawler(userAgent), userAgent });
  });
  return { entries, ignoredLines, truncated };
}
