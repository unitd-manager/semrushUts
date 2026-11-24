import { describe, expect, it } from "vitest";
import { classifyCrawler, parseAccessLog } from "./access-log";

describe("access log analysis", () => {
  it("parses combined access logs and labels known crawlers", () => {
    const result = parseAccessLog('203.0.113.4 - - [02/Nov/2026:10:00:00 +0000] "GET /robots.txt HTTP/1.1" 200 42 "-" "Googlebot/2.1"\n203.0.113.5 - - [02/Nov/2026:10:01:00 +0000] "GET /page HTTP/2" 404 - "-" "Mozilla/5.0"');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({ host: "203.0.113.4", path: "/robots.txt", status: 200, bytes: 42, bot: "Googlebot" });
    expect(result.entries[1]).toMatchObject({ path: "/page", status: 404, bytes: null, bot: "Non-crawler" });
    expect(result.ignoredLines).toBe(0);
  });

  it("reports malformed and over-limit lines without parsing beyond the cap", () => {
    const valid = '203.0.113.4 - - [02/Nov/2026:10:00:00 +0000] "GET / HTTP/1.1" 200 10 "-" "Bingbot"';
    const result = parseAccessLog(`${valid}\nnot a log\n${valid}`, 2);
    expect(result.entries).toHaveLength(1);
    expect(result.ignoredLines).toBe(1);
    expect(result.truncated).toBe(true);
  });

  it("classifies AI crawlers distinctly", () => {
    expect(classifyCrawler("GPTBot/1.0")).toBe("OpenAI crawler");
    expect(classifyCrawler("ClaudeBot")).toBe("Anthropic crawler");
    expect(classifyCrawler("PerplexityBot")).toBe("PerplexityBot");
  });
});
