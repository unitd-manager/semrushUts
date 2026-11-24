import { describe, expect, it } from "vitest";
import { modules, moduleGroups } from "./modules";

describe("module navigation inventory", () => {
  it("exposes all workspace areas and toolkit reports at distinct routes", () => {
    expect(modules).toHaveLength(100);
    expect(new Set(modules.map((module) => module.slug)).size).toBe(100);
    expect(["keyword-page-mapping", "internal-link-automation", "content-optimization-workbench", "competitor-change-monitoring", "seo-calendar", "website-change-monitor"].every((slug) => modules.some((module) => module.slug === slug))).toBe(true);
    expect(modules.find((module) => module.slug === "seo-fix-center")?.group).toBe("SEO Intelligence");
    expect(modules.find((module) => module.slug === "client-reporting")?.group).toBe("Agency Management");
    expect(modules.find((module) => module.slug === "task-management")?.group).toBe("SEO Operations");
  });

  it("groups every module exactly once", () => {
    expect(moduleGroups.flatMap((group) => group.items).map((module) => module.slug).sort()).toEqual(modules.map((module) => module.slug).sort());
  });

  it("does not label an unimplemented area as finished", () => {
    expect(modules.filter((module) => module.state === "not-started").every((module) => module.features.length > 0)).toBe(true);
    expect(modules.some((module) => module.state === "complete" as never)).toBe(false);
  });
});
