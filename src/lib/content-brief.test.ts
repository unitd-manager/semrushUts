import { describe, expect, it } from "vitest";
import { formatContentBrief } from "./content-brief";

describe("formatContentBrief", () => {
  it("formats editor input as a structured markdown brief", () => {
    const brief = formatContentBrief({ topic: "  Audit checklist ", keyword: " audit ", outline: "## Crawl\n- Check status codes" });
    expect(brief).toContain("# Audit checklist");
    expect(brief).toContain("## Primary keyword\naudit");
    expect(brief).toContain("## Outline\n## Crawl\n- Check status codes");
    expect(brief).toContain("No search results, competitor pages, or AI-generated recommendations were added.");
  });

  it("labels omitted research as editor work instead of inventing it", () => {
    const brief = formatContentBrief({ topic: "Topic", keyword: "topic" });
    expect(brief).toContain("## Search intent\nTo be researched by editor");
    expect(brief).toContain("## Internal links to consider\nAdd relevant URLs after reviewing the site.");
  });
});
