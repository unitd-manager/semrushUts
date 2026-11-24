export type ContentBriefInput = {
  topic: string;
  keyword: string;
  audience?: string;
  intent?: string;
  angle?: string;
  outline?: string;
  links?: string;
  cta?: string;
};

export function formatContentBrief(input: ContentBriefInput): string {
  return [
    `# ${input.topic.trim()}`,
    `\n## Primary keyword\n${input.keyword.trim()}`,
    `\n## Audience\n${input.audience?.trim() || "To be defined by editor"}`,
    `\n## Search intent\n${input.intent?.trim() || "To be researched by editor"}`,
    `\n## Content angle\n${input.angle?.trim() || "To be defined by editor"}`,
    `\n## Outline\n${input.outline?.trim() || "Add headings and supporting points before drafting."}`,
    `\n## Internal links to consider\n${input.links?.trim() || "Add relevant URLs after reviewing the site."}`,
    `\n## Call to action\n${input.cta?.trim() || "To be selected by editor"}`,
    "\n## Research note\nThis brief contains editor-supplied information only. No search results, competitor pages, or AI-generated recommendations were added.",
  ].join("\n");
}
